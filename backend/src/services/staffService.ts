import prisma from '../prisma/client';
import { NotFoundError, ConflictError, ForbiddenError } from '../utils/errors';

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

  static async create(orgId: string, data: any, userId: string, creatorRole: string) {
    // Verify role assignment permissions
    if (data.roleId) {
      const targetRole = await prisma.role.findUnique({
        where: { id: data.roleId },
      });
      if (!targetRole) {
        throw new NotFoundError('Target role not found');
      }
      if (
        (targetRole.name === 'SUPER_ADMIN' || targetRole.name === 'PRODUCT_OWNER') &&
        creatorRole !== 'PRODUCT_OWNER'
      ) {
        throw new ForbiddenError('Only a Product Owner can assign Super Admin or Product Owner roles');
      }
    }

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
        password: (data.password && data.password.trim() !== '') ? data.password : undefined,
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

  static async update(orgId: string, id: string, data: any, userId: string, creatorRole: string) {
    const staff = await this.getById(orgId, id);

    // Prevent non-Product Owners from updating a Super Admin or Product Owner profile
    if (
      (staff.role?.name === 'SUPER_ADMIN' || staff.role?.name === 'PRODUCT_OWNER') &&
      creatorRole !== 'PRODUCT_OWNER'
    ) {
      throw new ForbiddenError('Only a Product Owner can update Super Admin or Product Owner profiles');
    }

    // Verify role assignment permissions if role is being changed
    if (data.roleId && data.roleId !== staff.roleId) {
      const targetRole = await prisma.role.findUnique({
        where: { id: data.roleId },
      });
      if (!targetRole) {
        throw new NotFoundError('Target role not found');
      }
      if (
        (targetRole.name === 'SUPER_ADMIN' || targetRole.name === 'PRODUCT_OWNER') &&
        creatorRole !== 'PRODUCT_OWNER'
      ) {
        throw new ForbiddenError('Only a Product Owner can assign Super Admin or Product Owner roles');
      }
    }

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
        password: (data.password && data.password.trim() !== '') ? data.password : undefined,
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

  static async listRoles(userRole: string) {
    const roles = await prisma.role.findMany();
    if (userRole === 'PRODUCT_OWNER') {
      return roles;
    }
    // Non-product-owners cannot see SUPER_ADMIN or PRODUCT_OWNER roles
    return roles.filter(r => r.name !== 'SUPER_ADMIN' && r.name !== 'PRODUCT_OWNER');
  }
}
