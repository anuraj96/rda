import prisma from '../prisma/client';
import { NotFoundError } from '../utils/errors';

export class EventService {
  static async list(orgId: string, branchId?: string, query?: { status?: string }) {
    const where: any = { organizationId: orgId, isActive: true };
    if (branchId) where.branchId = branchId;
    if (query?.status) where.status = query.status;

    return prisma.event.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  static async getById(orgId: string, id: string) {
    const event = await prisma.event.findFirst({
      where: { id, organizationId: orgId, isActive: true },
      include: {
        branch: { select: { id: true, name: true } },
        participants: {
          include: {
            student: { select: { id: true, name: true, admissionNumber: true, parentPhone: true } },
          },
        },
        expenses: { where: { isActive: true } },
        incomes: { where: { isActive: true } },
      },
    });

    if (!event) throw new NotFoundError('Event not found');
    return event;
  }

  static async create(orgId: string, data: any, userId: string) {
    return prisma.event.create({
      data: {
        organizationId: orgId,
        branchId: data.branchId,
        name: data.name,
        date: data.date,
        venue: data.venue,
        budget: data.budget,
        description: data.description || null,
        status: data.status || 'UPCOMING',
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  static async update(orgId: string, id: string, data: any, userId: string) {
    await this.getById(orgId, id);

    return prisma.event.update({
      where: { id },
      data: {
        branchId: data.branchId,
        name: data.name,
        date: data.date,
        venue: data.venue,
        budget: data.budget,
        description: data.description,
        status: data.status,
        updatedBy: userId,
      },
    });
  }

  static async delete(orgId: string, id: string, userId: string) {
    await this.getById(orgId, id);

    return prisma.event.update({
      where: { id },
      data: {
        isActive: false,
        updatedBy: userId,
      },
    });
  }

  static async registerParticipant(orgId: string, eventId: string, studentId: string) {
    // Verify event exists
    await this.getById(orgId, eventId);

    // Verify student exists
    const student = await prisma.student.findFirst({
      where: { id: studentId, organizationId: orgId, isActive: true },
    });
    if (!student) throw new NotFoundError('Student not found');

    return prisma.eventParticipant.upsert({
      where: {
        eventId_studentId: {
          eventId,
          studentId,
        },
      },
      create: {
        eventId,
        studentId,
      },
      update: {},
    });
  }

  static async updateParticipantAttendance(orgId: string, eventId: string, studentId: string, status: string) {
    await this.getById(orgId, eventId);

    return prisma.eventParticipant.update({
      where: {
        eventId_studentId: {
          eventId,
          studentId,
        },
      },
      data: {
        attendanceStatus: status,
      },
    });
  }
}
