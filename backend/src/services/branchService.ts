import prisma from '../prisma/client';
import { NotFoundError } from '../utils/errors';

export class BranchService {
  static async list(orgId: string, query: { search?: string; status?: string }) {
    const whereClause: any = {
      organizationId: orgId,
      isActive: true,
    };

    if (query.status) {
      whereClause.status = query.status;
    }

    if (query.search) {
      whereClause.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return prisma.branch.findMany({
      where: whereClause,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(orgId: string, id: string) {
    const branch = await prisma.branch.findFirst({
      where: { id, organizationId: orgId, isActive: true },
      include: {
        manager: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!branch) {
      throw new NotFoundError('Branch not found');
    }

    return branch;
  }

  static async create(orgId: string, data: any, userId: string) {
    return prisma.branch.create({
      data: {
        organizationId: orgId,
        name: data.name,
        code: data.code,
        address: data.address,
        phone: data.phone,
        email: data.email,
        capacity: data.capacity,
        managerId: data.managerId || null,
        status: data.status || 'ACTIVE',
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  static async update(orgId: string, id: string, data: any, userId: string) {
    await this.getById(orgId, id); // Verify branch exists

    return prisma.branch.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        address: data.address,
        phone: data.phone,
        email: data.email,
        capacity: data.capacity,
        managerId: data.managerId !== undefined ? data.managerId : undefined,
        status: data.status,
        updatedBy: userId,
      },
    });
  }

  static async delete(orgId: string, id: string, userId: string) {
    await this.getById(orgId, id); // Verify branch exists

    // Perform soft delete
    return prisma.branch.update({
      where: { id },
      data: {
        isActive: false,
        updatedBy: userId,
      },
    });
  }
}
