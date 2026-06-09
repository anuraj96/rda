import prisma from '../prisma/client';
import { BadRequestError, NotFoundError } from '../utils/errors';

export class AttendanceService {
  // Student Attendance
  static async markStudentAttendance(orgId: string, branchId: string, data: any, userId: string) {
    const { batchId, date, records } = data;
    const dateOnly = new Date(date);
    dateOnly.setUTCHours(0, 0, 0, 0);

    return prisma.$transaction(async (tx) => {
      let changed = false;
      const savedRecords = [];
      for (const record of records) {
        const existing = await tx.attendance.findFirst({
          where: {
            organizationId: orgId,
            batchId,
            studentId: record.studentId,
            date: dateOnly,
            type: 'STUDENT',
            isActive: true,
          },
          select: { id: true, status: true, remarks: true }
        });

        if (!existing || existing.status !== record.status || existing.remarks !== (record.remarks || null)) {
          changed = true;
        }

        const attendance = await tx.attendance.upsert({
          where: {
            id: existing?.id || '00000000-0000-0000-0000-000000000000',
          },
          create: {
            organizationId: orgId,
            branchId,
            type: 'STUDENT',
            studentId: record.studentId,
            batchId,
            date: dateOnly,
            status: record.status,
            remarks: record.remarks || null,
            createdBy: userId,
            updatedBy: userId,
          },
          update: {
            status: record.status,
            remarks: record.remarks || null,
            updatedBy: userId,
          },
        });
        savedRecords.push(attendance);
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          branchId,
          userId,
          action: 'MARK_STUDENT_ATTENDANCE',
          entityName: 'Batch',
          entityId: batchId,
          details: JSON.stringify({ date: dateOnly, count: records.length }),
        },
      });

      return {
        records: savedRecords,
        alreadyMarked: !changed
      };
    });
  }

  static async getBatchAttendanceForDate(orgId: string, batchId: string, date: Date) {
    const dateOnly = new Date(date);
    dateOnly.setUTCHours(0, 0, 0, 0);

    return prisma.attendance.findMany({
      where: {
        organizationId: orgId,
        batchId,
        date: dateOnly,
        type: 'STUDENT',
        isActive: true,
      },
      include: {
        student: {
          select: { id: true, name: true, admissionNumber: true },
        },
      },
    });
  }

  static async getStudentAttendanceSummary(orgId: string, studentId: string) {
    const attendances = await prisma.attendance.findMany({
      where: {
        organizationId: orgId,
        studentId,
        type: 'STUDENT',
        isActive: true,
      },
      orderBy: { date: 'desc' },
    });

    const total = attendances.length;
    const present = attendances.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    const absent = attendances.filter(a => a.status === 'ABSENT').length;
    const leave = attendances.filter(a => a.status === 'LEAVE').length;

    return {
      history: attendances,
      summary: {
        total,
        present,
        absent,
        leave,
        rate: total > 0 ? Math.round((present / total) * 100) : 100,
      },
    };
  }

  // Staff Attendance
  static async staffCheckIn(orgId: string, branchId: string, userId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Check if already checked in today
    const existing = await prisma.attendance.findFirst({
      where: {
        organizationId: orgId,
        userId,
        date: today,
        type: 'STAFF',
        isActive: true,
      },
    });

    if (existing) {
      throw new BadRequestError('You have already checked in today');
    }

    return prisma.attendance.create({
      data: {
        organizationId: orgId,
        branchId,
        type: 'STAFF',
        userId,
        date: today,
        status: 'PRESENT',
        checkInTime: new Date(),
      },
    });
  }

  static async staffCheckOut(orgId: string, userId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findFirst({
      where: {
        organizationId: orgId,
        userId,
        date: today,
        type: 'STAFF',
        isActive: true,
      },
    });

    if (!existing) {
      throw new BadRequestError('No check-in record found for today. Please check in first.');
    }

    if (existing.checkOutTime) {
      throw new BadRequestError('You have already checked out today');
    }

    return prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOutTime: new Date(),
      },
    });
  }

  static async getStaffAttendanceReport(orgId: string, branchId?: string, month?: number, year?: number) {
    const targetMonth = month !== undefined ? month : new Date().getMonth();
    const targetYear = year !== undefined ? year : new Date().getFullYear();

    const start = new Date(targetYear, targetMonth, 1);
    const end = new Date(targetYear, targetMonth + 1, 0);

    const where: any = {
      organizationId: orgId,
      type: 'STAFF',
      date: { gte: start, lte: end },
      isActive: true,
    };

    if (branchId) {
      where.branchId = branchId;
    }

    return prisma.attendance.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, employeeId: true, role: { select: { name: true } } } },
      },
      orderBy: { date: 'desc' },
    });
  }
}
