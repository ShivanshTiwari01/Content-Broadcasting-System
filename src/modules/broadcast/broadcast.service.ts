import { prisma } from '../../lib/prisma.js';
import { cacheGet, cacheSet } from '../../lib/redis.js';

interface ScheduledContent {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: { id: string; name: string };
  schedule: {
    rotationOrder: number;
    duration: number;
    startTime: Date;
    endTime: Date;
  };
}

/**
 * Time-based modulo scheduling algorithm.
 *
 * Given a list of content items for a single subject, each with a rotation order
 * and duration (in minutes), this function determines which item is currently
 * "on air" based on the current time.
 *
 * Algorithm:
 *  1. Sort items by rotationOrder ascending.
 *  2. Compute totalCycleMs = sum of all durations in milliseconds.
 *  3. Use Unix epoch (0) as the reference point.
 *  4. elapsed = now_ms % totalCycleMs (where in the cycle we currently are)
 *  5. Walk the sorted list, subtracting each item's duration until elapsed <= 0.
 *     The item that "consumes" the remaining elapsed time is active.
 *
 * This approach requires NO cron jobs and is purely deterministic.
 */
function resolveActiveContent(
  items: ScheduledContent[],
  now: Date,
): ScheduledContent | null {
  if (items.length === 0) return null;

  // Filter to items whose time window includes "now"
  const active = items.filter(
    (item) => now >= item.schedule.startTime && now <= item.schedule.endTime,
  );

  if (active.length === 0) return null;

  // Sort by rotation order
  active.sort((a, b) => a.schedule.rotationOrder - b.schedule.rotationOrder);

  // Total cycle duration in milliseconds
  const totalCycleMs = active.reduce(
    (sum, item) => sum + item.schedule.duration * 60 * 1000,
    0,
  );

  if (totalCycleMs === 0) return active[0] ?? null;

  // How far into the cycle are we?
  const elapsed = now.getTime() % totalCycleMs;

  let remaining = elapsed;
  for (const item of active) {
    const itemMs = item.schedule.duration * 60 * 1000;
    if (remaining < itemMs) {
      return item;
    }
    remaining -= itemMs;
  }

  // Fallback (should not happen)
  return active[active.length - 1] ?? null;
}

export async function getLiveContent(
  teacherId: string,
  subject?: string,
): Promise<Record<string, ScheduledContent | null>> {
  const cacheKey = subject
    ? `live:${teacherId}:${subject.toLowerCase()}`
    : `live:${teacherId}`;

  // Check Redis cache first
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return JSON.parse(cached) as Record<string, ScheduledContent | null>;
  }

  // Verify teacher exists
  const teacher = await prisma.user.findUnique({
    where: { id: teacherId, role: 'TEACHER' },
  });

  if (!teacher) {
    return {}; // Edge case: invalid teacher → empty response
  }

  const now = new Date();

  // Fetch all approved content for this teacher with their schedules
  const contents = await prisma.content.findMany({
    where: {
      uploadedById: teacherId,
      status: 'APPROVED',
      ...(subject ? { subject: subject.toLowerCase().trim() } : {}),
    },
    include: {
      uploadedBy: { select: { id: true, name: true } },
      schedules: true,
    },
  });

  if (contents.length === 0) {
    await cacheSet(cacheKey, JSON.stringify({}), 30);
    return {};
  }

  // Flatten: each content-schedule pair becomes one schedulable item
  // (one content can theoretically appear in multiple slots, but typically one)
  const scheduledItems: ScheduledContent[] = [];

  for (const content of contents) {
    for (const schedule of content.schedules) {
      scheduledItems.push({
        id: content.id,
        title: content.title,
        description: content.description,
        subject: content.subject,
        fileUrl: content.fileUrl,
        fileType: content.fileType,
        fileSize: content.fileSize,
        uploadedBy: content.uploadedBy,
        schedule: {
          rotationOrder: schedule.rotationOrder,
          duration: schedule.duration,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        },
      });
    }
  }

  // Group by subject
  const bySubject: Record<string, ScheduledContent[]> = {};
  for (const item of scheduledItems) {
    if (!bySubject[item.subject]) {
      bySubject[item.subject] = [];
    }
    bySubject[item.subject]!.push(item);
  }

  // For each subject, resolve the currently active content
  const result: Record<string, ScheduledContent | null> = {};
  for (const [subj, items] of Object.entries(bySubject)) {
    result[subj] = resolveActiveContent(items, now);
  }

  // Cache the result for 30 seconds
  await cacheSet(cacheKey, JSON.stringify(result), 30);

  return result;
}

export async function getSubjectAnalytics(teacherId: string) {
  // Bonus: subject-wise analytics
  const contents = await prisma.content.findMany({
    where: { uploadedById: teacherId, status: 'APPROVED' },
    select: { subject: true },
  });

  const counts: Record<string, number> = {};
  for (const c of contents) {
    counts[c.subject] = (counts[c.subject] ?? 0) + 1;
  }

  return Object.entries(counts)
    .map(([subject, count]) => ({ subject, count }))
    .sort((a, b) => b.count - a.count);
}
