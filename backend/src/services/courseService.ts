import prisma from '../prisma/client';
import { NotFoundError } from '../utils/errors';

export class CourseService {
  // Course CRUD
  static async listCourses(orgId: string, branchId?: string, status?: string) {
    const where: any = { organizationId: orgId, isActive: true };
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;

    return prisma.course.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getCourseById(orgId: string, id: string) {
    const course = await prisma.course.findFirst({
      where: { id, organizationId: orgId, isActive: true },
      include: {
        branch: { select: { id: true, name: true } },
      },
    });
    if (!course) throw new NotFoundError('Course not found');
    return course;
  }

  static async createCourse(orgId: string, data: any, userId: string) {
    return prisma.course.create({
      data: {
        organizationId: orgId,
        branchId: data.branchId,
        name: data.name,
        description: data.description,
        duration: data.duration,
        monthlyFee: data.monthlyFee,
        registrationFee: data.registrationFee,
        status: data.status || 'ACTIVE',
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  static async updateCourse(orgId: string, id: string, data: any, userId: string) {
    await this.getCourseById(orgId, id);

    return prisma.course.update({
      where: { id },
      data: {
        branchId: data.branchId,
        name: data.name,
        description: data.description,
        duration: data.duration,
        monthlyFee: data.monthlyFee,
        registrationFee: data.registrationFee,
        status: data.status,
        updatedBy: userId,
      },
    });
  }

  static async deleteCourse(orgId: string, id: string, userId: string) {
    await this.getCourseById(orgId, id);

    return prisma.course.update({
      where: { id },
      data: {
        isActive: false,
        updatedBy: userId,
      },
    });
  }

  // Batch CRUD
  static async listBatches(orgId: string, branchId?: string, query?: { courseId?: string; instructorId?: string; status?: string }) {
    const where: any = { organizationId: orgId, isActive: true };
    if (branchId) where.branchId = branchId;
    if (query?.courseId) where.courseId = query.courseId;
    if (query?.instructorId) where.instructorId = query.instructorId;
    if (query?.status) where.status = query.status;

    return prisma.batch.findMany({
      where,
      include: {
        course: { select: { id: true, name: true, monthlyFee: true } },
        instructor: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        _count: {
          select: { students: { where: { status: 'ACTIVE' } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getBatchById(orgId: string, id: string) {
    const batch = await prisma.batch.findFirst({
      where: { id, organizationId: orgId, isActive: true },
      include: {
        course: true,
        instructor: { select: { id: true, name: true, email: true } },
        branch: { select: { id: true, name: true } },
        students: {
          where: { status: 'ACTIVE' },
          include: {
            student: {
              select: {
                id: true,
                admissionNumber: true,
                name: true,
                parentName: true,
                parentPhone: true,
                email: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!batch) throw new NotFoundError('Batch not found');
    return batch;
  }

  static async createBatch(orgId: string, data: any, userId: string) {
    return prisma.batch.create({
      data: {
        organizationId: orgId,
        branchId: data.branchId,
        courseId: data.courseId,
        instructorId: data.instructorId,
        name: data.name,
        schedule: data.schedule,
        capacity: data.capacity,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status || 'ACTIVE',
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  static async updateBatch(orgId: string, id: string, data: any, userId: string) {
    const batch = await this.getBatchById(orgId, id);

    return prisma.batch.update({
      where: { id },
      data: {
        branchId: data.branchId,
        courseId: data.courseId,
        instructorId: data.instructorId,
        name: data.name,
        schedule: data.schedule,
        capacity: data.capacity,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
        updatedBy: userId,
      },
    });
  }

  static async deleteBatch(orgId: string, id: string, userId: string) {
    await this.getBatchById(orgId, id);

    return prisma.batch.update({
      where: { id },
      data: {
        isActive: false,
        updatedBy: userId,
      },
    });
  }

  static async enrollStudents(orgId: string, batchId: string, studentIds: string[]) {
    // Verify batch exists
    await this.getBatchById(orgId, batchId);

    const enrollmentPromises = studentIds.map((studentId) => {
      return prisma.batchStudent.upsert({
        where: {
          batchId_studentId: {
            batchId,
            studentId,
          },
        },
        create: {
          batchId,
          studentId,
          status: 'ACTIVE',
        },
        update: {
          status: 'ACTIVE',
        },
      });
    });

    await Promise.all(enrollmentPromises);
  }

  static async unenrollStudents(orgId: string, batchId: string, studentIds: string[]) {
    // Verify batch exists
    await this.getBatchById(orgId, batchId);

    const dropoutPromises = studentIds.map((studentId) => {
      return prisma.batchStudent.update({
        where: {
          batchId_studentId: {
            batchId,
            studentId,
          },
        },
        data: {
          status: 'DROPOUT',
        },
      });
    });

    await Promise.all(dropoutPromises);
  }
}
