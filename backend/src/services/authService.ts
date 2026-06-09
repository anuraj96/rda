import prisma from '../prisma/client';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, NotFoundError } from '../utils/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'rda-secret-key-123456';

export class AuthService {
  static async login(email: string, password?: string) {
    const user = await prisma.user.findFirst({
      where: { email, isActive: true },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        branch: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User account not found or is deactivated');
    }

    if (!password || user.password !== password) {
      throw new UnauthorizedError('Incorrect password');
    }

    // Map permissions
    const permissions = user.role.permissions.map((rp) => rp.permission.name);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        organizationId: user.organizationId,
        branchId: user.branchId,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Record Audit Log for login
    await prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        branchId: user.branchId,
        userId: user.id,
        action: 'LOGIN',
        entityName: 'User',
        entityId: user.id,
        details: JSON.stringify({ email: user.email }),
      },
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        permissions,
        organizationId: user.organizationId,
        branchId: user.branchId,
        branchName: user.branch?.name || null,
      },
    };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, isActive: true },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const permissions = user.role.permissions.map((rp) => rp.permission.name);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
      permissions,
      organizationId: user.organizationId,
      branchId: user.branchId,
      branchName: user.branch?.name || null,
    };
  }
}
