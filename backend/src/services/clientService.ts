import prisma from '../prisma/client';
import { NotFoundError, ConflictError } from '../utils/errors';

export class ClientService {
  static async list() {
    return prisma.organization.findMany({
      include: {
        users: {
          where: {
            role: { name: 'SUPER_ADMIN' },
          },
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async create(data: {
    orgName: string;
    adminName: string;
    adminEmail: string;
    adminPassword?: string;
  }) {
    // 1. Check if email is in use
    const existingUser = await prisma.user.findFirst({
      where: { email: data.adminEmail, isActive: true },
    });
    if (existingUser) {
      throw new ConflictError('Email is already in use by another user');
    }

    // 2. Fetch SUPER_ADMIN role id
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
    });
    if (!superAdminRole) {
      throw new NotFoundError('SUPER_ADMIN role not found in database');
    }

    // 3. Create Org and Super Admin in a transaction
    return prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: data.orgName,
        },
      });

      const random4Digit = Math.floor(1000 + Math.random() * 9000);
      const admin = await tx.user.create({
        data: {
          organizationId: org.id,
          name: data.adminName,
          email: data.adminEmail,
          password: data.adminPassword && data.adminPassword.trim() !== '' ? data.adminPassword : 'password123',
          roleId: superAdminRole.id,
          employeeId: `SA-${random4Digit}`,
          status: 'ACTIVE',
        },
      });

      return {
        orgId: org.id,
        orgName: org.name,
        adminId: admin.id,
        adminName: admin.name,
        adminEmail: admin.email,
      };
    });
  }

  static async delete(orgId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    const productOwnerRole = await prisma.role.findUnique({
      where: { name: 'PRODUCT_OWNER' },
    });
    const productOwnerRoleId = productOwnerRole?.id || '';

    return prisma.$transaction([
      prisma.organization.update({
        where: { id: orgId },
        data: { isActive: false },
      }),
      prisma.user.updateMany({
        where: { 
          organizationId: orgId,
          roleId: { not: productOwnerRoleId }
        },
        data: { isActive: false },
      }),
    ]);
  }

  static async enable(orgId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    return prisma.$transaction([
      prisma.organization.update({
        where: { id: orgId },
        data: { isActive: true },
      }),
      prisma.user.updateMany({
        where: { organizationId: orgId },
        data: { isActive: true },
      }),
    ]);
  }
}
