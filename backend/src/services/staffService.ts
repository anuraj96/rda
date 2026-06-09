import prisma from '../prisma/client';
import { NotFoundError, ConflictError } from '../utils/errors';

export class StaffService {
  static async list(
    orgId: string,
    branchId?: string,
    query?: { roleId?: string; search?: string; status?: string }
  ) {
    const whereClause: any = {
      organizationId: orgId,
      isActive: true,
    };

    if (branchId) {
      whereClause.branchId = branchId;
    }

    if (query?.roleId) {
      whereClause.roleId = query.roleId;
    }

    if (query?.status) {
      whereClause.status = query.status;
    }

    if (query?.search) {
      whereClause.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { employeeId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return prisma.user.findMany({
      where: whereClause,
      include: {
        role: true,
        branch: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(orgId: string, id: string) {
    const staff = await prisma.user.findFirst({
      where: { id, organizationId: orgId, isActive: true },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    if (!staff) {
      throw new NotFoundError('Staff user not found');
    }

    return staff;
  }

  static async create(orgId: string, data: any, userId: string) {
    // Check email unique
    const existing = await prisma.user.findFirst({
      where: { email: data.email, isActive: true },
    });
    if (existing) {
      throw new ConflictError('Email address is already in use by another user');
    }

    // Check employeeId unique if provided
    if (data.employeeId) {
      const existingEmp = await prisma.user.findFirst({
        where: { employeeId: data.employeeId, isActive: true },
      });
      if (existingEmp) {
        throw new ConflictError('Employee ID is already in use');
      }
    }

    return prisma.user.create({
      data: {
        organizationId: orgId,
        branchId: data.branchId || null,
        employeeId: data.employeeId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        roleId: data.roleId,
        salary: data.salary,
        joiningDate: data.joiningDate,
        status: data.status || 'ACTIVE',
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  static async update(orgId: string, id: string, data: any, userId: string) {
    const staff = await this.getById(orgId, id);

    // If email is changing, check uniqueness
    if (data.email && data.email !== staff.email) {
      const existing = await prisma.user.findFirst({
        where: { email: data.email, isActive: true },
      });
      if (existing) {
        throw new ConflictError('Email address is already in use');
      }
    }

    return prisma.user.update({
      where: { id },
      data: {
        branchId: data.branchId !== undefined ? data.branchId : undefined,
        employeeId: data.employeeId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        roleId: data.roleId,
        salary: data.salary,
        joiningDate: data.joiningDate,
        status: data.status,
        updatedBy: userId,
      },
    });
  }

  static async delete(orgId: string, id: string, userId: string) {
    await this.getById(orgId, id);

    return prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        updatedBy: userId,
      },
    });
  }

  static async listRoles() {
    return prisma.role.findMany();
  }
}
