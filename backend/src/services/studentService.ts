import prisma from '../prisma/client';
import { NotFoundError, ConflictError } from '../utils/errors';

export class StudentService {
  static async list(
    orgId: string,
    branchId?: string,
    query?: { batchId?: string; search?: string; status?: string }
  ) {
    const whereClause: any = {
      organizationId: orgId,
      isActive: true,
    };

    if (branchId) {
      whereClause.branchId = branchId;
    }

    if (query?.status) {
      whereClause.status = query.status;
    }

    if (query?.batchId) {
      whereClause.batches = {
        some: {
          batchId: query.batchId,
        },
      };
    }

    if (query?.search) {
      whereClause.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { admissionNumber: { contains: query.search, mode: 'insensitive' } },
        { parentName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return prisma.student.findMany({
      where: whereClause,
      include: {
        branch: { select: { name: true } },
        batches: {
          include: {
            batch: {
              include: {
                course: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(orgId: string, id: string) {
    const student = await prisma.student.findFirst({
      where: { id, organizationId: orgId, isActive: true },
      include: {
        branch: { select: { id: true, name: true } },
        documents: { where: { isActive: true } },
        batches: {
          where: { status: 'ACTIVE' },
          include: {
            batch: {
              include: {
                course: true,
                instructor: { select: { id: true, name: true } },
              },
            },
          },
        },
        fees: {
          where: { isActive: true },
          include: {
            payments: { where: { isActive: true } },
          },
          orderBy: { dueDate: 'desc' },
        },
        attendances: {
          where: { isActive: true },
          orderBy: { date: 'desc' },
          take: 30, // Get last 30 attendance records
        },
      },
    });

    if (!student) {
      throw new NotFoundError('Student not found');
    }

    return student;
  }

  static async create(orgId: string, data: any, userId: string) {
    // Check admission number unique
    const existing = await prisma.student.findFirst({
      where: {
        organizationId: orgId,
        admissionNumber: data.admissionNumber,
        isActive: true,
      },
    });
    if (existing) {
      throw new ConflictError('Admission number is already in use');
    }

    // Wrap in a transaction to handle student creation, batch assignment, and fee generation
    return prisma.$transaction(async (tx) => {
      // 1. Create Student
      const student = await tx.student.create({
        data: {
          organizationId: orgId,
          branchId: data.branchId,
          admissionNumber: data.admissionNumber,
          name: data.name,
          photo: data.photo,
          gender: data.gender,
          dob: data.dob,
          parentName: data.parentName,
          parentPhone: data.parentPhone,
          email: data.email,
          address: data.address,
          emergencyContact: data.emergencyContact,
          joiningDate: data.joiningDate,
          status: data.status || 'ACTIVE',
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 2. Assign to Batch if batchId is provided
      if (data.batchId) {
        await tx.batchStudent.create({
          data: {
            batchId: data.batchId,
            studentId: student.id,
            joinedAt: data.joiningDate || new Date(),
            status: 'ACTIVE',
          },
        });
      }

      // 3. Generate initial Fees if courseId is provided
      if (data.courseId) {
        const course = await tx.course.findFirst({
          where: { id: data.courseId, organizationId: orgId, isActive: true },
        });

        if (course) {
          // A. Registration Fee invoice
          if (course.registrationFee.greaterThan(0)) {
            await tx.fee.create({
              data: {
                organizationId: orgId,
                branchId: data.branchId,
                studentId: student.id,
                type: 'REGISTRATION',
                amount: course.registrationFee,
                dueDate: data.joiningDate || new Date(),
                status: 'PENDING',
                remarks: `Initial Registration Fee for ${course.name}`,
                createdBy: userId,
                updatedBy: userId,
              },
            });
          }

          // B. First Month Fee invoice
          if (course.monthlyFee.greaterThan(0)) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 10); // due in 10 days

            await tx.fee.create({
              data: {
                organizationId: orgId,
                branchId: data.branchId,
                studentId: student.id,
                type: 'MONTHLY',
                amount: course.monthlyFee,
                dueDate,
                status: 'PENDING',
                remarks: `First month tuition fee for ${course.name}`,
                createdBy: userId,
                updatedBy: userId,
              },
            });
          }
        }
      }

      // 4. Log audit event
      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          branchId: data.branchId,
          userId,
          action: 'CREATE_STUDENT',
          entityName: 'Student',
          entityId: student.id,
          details: JSON.stringify({ admissionNumber: student.admissionNumber, name: student.name }),
        },
      });

      return student;
    });
  }

  static async update(orgId: string, id: string, data: any, userId: string) {
    const student = await this.getById(orgId, id);

    if (data.admissionNumber && data.admissionNumber !== student.admissionNumber) {
      const existing = await prisma.student.findFirst({
        where: {
          organizationId: orgId,
          admissionNumber: data.admissionNumber,
          isActive: true,
        },
      });
      if (existing) {
        throw new ConflictError('Admission number is already in use');
      }
    }

    return prisma.$transaction(async (tx) => {
      const updatedStudent = await tx.student.update({
        where: { id },
        data: {
          name: data.name,
          photo: data.photo,
          gender: data.gender,
          dob: data.dob,
          parentName: data.parentName,
          parentPhone: data.parentPhone,
          email: data.email,
          address: data.address,
          emergencyContact: data.emergencyContact,
          joiningDate: data.joiningDate,
          status: data.status,
          updatedBy: userId,
        },
      });

      // Update batch enrollment if batchId changed and is different
      if (data.batchId) {
        const currentBatchEnrollment = student.batches[0];
        if (!currentBatchEnrollment || currentBatchEnrollment.batchId !== data.batchId) {
          // Soft dropout the old batch
          if (currentBatchEnrollment) {
            await tx.batchStudent.update({
              where: {
                batchId_studentId: {
                  batchId: currentBatchEnrollment.batchId,
                  studentId: id,
                },
              },
              data: { status: 'DROPOUT' },
            });
          }

          // Enroll in new batch
          await tx.batchStudent.upsert({
            where: {
              batchId_studentId: {
                batchId: data.batchId,
                studentId: id,
              },
            },
            create: {
              batchId: data.batchId,
              studentId: id,
              status: 'ACTIVE',
            },
            update: {
              status: 'ACTIVE',
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          branchId: student.branchId,
          userId,
          action: 'UPDATE_STUDENT',
          entityName: 'Student',
          entityId: id,
          details: JSON.stringify({ name: updatedStudent.name }),
        },
      });

      return updatedStudent;
    });
  }

  static async delete(orgId: string, id: string, userId: string) {
    const student = await this.getById(orgId, id);

    return prisma.$transaction(async (tx) => {
      const deletedStudent = await tx.student.update({
        where: { id },
        data: {
          isActive: false,
          updatedBy: userId,
        },
      });

      // Log audit
      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          branchId: student.branchId,
          userId,
          action: 'DELETE_STUDENT',
          entityName: 'Student',
          entityId: id,
          details: JSON.stringify({ admissionNumber: student.admissionNumber }),
        },
      });

      return deletedStudent;
    });
  }

  static async addDocument(orgId: string, studentId: string, name: string, fileUrl: string, userId: string) {
    const student = await this.getById(orgId, studentId);

    return prisma.studentDocument.create({
      data: {
        studentId,
        name,
        fileUrl,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  static async deleteDocument(orgId: string, documentId: string, userId: string) {
    const doc = await prisma.studentDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      throw new NotFoundError('Document not found');
    }

    return prisma.studentDocument.update({
      where: { id: documentId },
      data: {
        isActive: false,
        updatedBy: userId,
      },
    });
  }
}
