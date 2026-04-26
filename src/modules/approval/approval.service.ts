import { prisma } from '../../lib/prisma.js';
import { cacheDel } from '../../lib/redis.js';
import type { RejectInput } from './approval.schema.js';

export async function getPendingContent() {
  return prisma.content.findMany({
    where: { status: 'PENDING' },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
      schedules: {
        select: {
          rotationOrder: true,
          duration: true,
          startTime: true,
          endTime: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function approveContent(contentId: string, principalId: string) {
  const content = await prisma.content.findUnique({ where: { id: contentId } });

  if (!content) {
    const err = new Error('Content not found') as Error & {
      statusCode: number;
    };
    err.statusCode = 404;
    throw err;
  }

  if (content.status !== 'PENDING') {
    const err = new Error(
      `Content is not pending (current status: ${content.status})`,
    ) as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }

  const updated = await prisma.content.update({
    where: { id: contentId },
    data: {
      status: 'APPROVED',
      approvedById: principalId,
      approvedAt: new Date(),
      rejectionReason: null,
    },
    include: {
      uploadedBy: { select: { id: true, name: true } },
    },
  });

  await cacheDel(`live:${updated.uploadedById}`);
  await cacheDel(`live:${updated.uploadedById}:${updated.subject}`);

  return updated;
}

export async function rejectContent(
  contentId: string,
  principalId: string,
  input: RejectInput,
) {
  const content = await prisma.content.findUnique({ where: { id: contentId } });

  if (!content) {
    const err = new Error('Content not found') as Error & {
      statusCode: number;
    };
    err.statusCode = 404;
    throw err;
  }

  if (content.status !== 'PENDING') {
    const err = new Error(
      `Content is not pending (current status: ${content.status})`,
    ) as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }

  return prisma.content.update({
    where: { id: contentId },
    data: {
      status: 'REJECTED',
      rejectionReason: input.rejectionReason,
      approvedById: principalId,
      approvedAt: new Date(),
    },
  });
}
