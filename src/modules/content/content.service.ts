import path from 'path';
import fs from 'fs';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import type { UploadContentInput } from './content.schema.js';

export async function uploadContent(
  teacherId: string,
  file: Express.Multer.File,
  input: UploadContentInput,
) {
  const subject = input.subject.toLowerCase().trim();

  const slot = await prisma.contentSlot.upsert({
    where: { subject },
    update: {},
    create: { subject },
  });

  const maxOrder = await prisma.contentSchedule.aggregate({
    where: { slotId: slot.id },
    _max: { rotationOrder: true },
  });

  const nextOrder = (maxOrder._max.rotationOrder ?? 0) + 1;

  const fileUrl = `/uploads/${file.filename}`;

  const content = await prisma.$transaction(async (tx) => {
    const newContent = await tx.content.create({
      data: {
        title: input.title,
        description: input.description,
        subject,
        fileUrl,
        fileType: file.mimetype,
        fileSize: file.size,
        status: 'PENDING',
        uploadedById: teacherId,
      },
    });

    await tx.contentSchedule.create({
      data: {
        contentId: newContent.id,
        slotId: slot.id,
        rotationOrder: nextOrder,
        duration: input.rotationDuration,
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
      },
    });

    return newContent;
  });

  return content;
}

export async function getMyContent(teacherId: string) {
  return prisma.content.findMany({
    where: { uploadedById: teacherId },
    include: {
      schedules: {
        select: {
          rotationOrder: true,
          duration: true,
          startTime: true,
          endTime: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getContentById(contentId: string) {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true } },
      schedules: true,
    },
  });

  if (!content) {
    const err = new Error('Content not found') as Error & {
      statusCode: number;
    };
    err.statusCode = 404;
    throw err;
  }

  return content;
}

export async function getAllContent(filters: {
  status?: string;
  subject?: string;
  teacherId?: string;
}) {
  return prisma.content.findMany({
    where: {
      ...(filters.status ? { status: filters.status as any } : {}),
      ...(filters.subject ? { subject: filters.subject.toLowerCase() } : {}),
      ...(filters.teacherId ? { uploadedById: filters.teacherId } : {}),
    },
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
    orderBy: { createdAt: 'desc' },
  });
}

export async function deleteContent(contentId: string, teacherId: string) {
  const content = await prisma.content.findUnique({ where: { id: contentId } });

  if (!content) {
    const err = new Error('Content not found') as Error & {
      statusCode: number;
    };
    err.statusCode = 404;
    throw err;
  }

  if (content.uploadedById !== teacherId) {
    const err = new Error('Forbidden: you do not own this content') as Error & {
      statusCode: number;
    };
    err.statusCode = 403;
    throw err;
  }

  const filePath = path.resolve(env.UPLOAD_DIR, path.basename(content.fileUrl));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await prisma.content.delete({ where: { id: contentId } });
}
