import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, UserContext } from '../types';
import prisma from '../prisma/client';
import { UnauthorizedError } from '../utils/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'rda-secret-key-123456';

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Development bypass or test user header if no token is provided
    if (!token && process.env.NODE_ENV !== 'production') {
      const testEmail = req.headers['x-test-email'] as string;
      if (testEmail) {
        const user = await prisma.user.findFirst({
          where: { email: testEmail, isActive: true },
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
          },
        });

        if (user) {
          const permissions = user.role.permissions.map((rp) => rp.permission.name);
          req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role.name,
            permissions,
            organizationId: user.organizationId,
            branchId: user.branchId,
          };
          req.orgId = user.organizationId;
          req.branchId = user.branchId || undefined;
          return next();
        }
      }
    }

    if (!token) {
      throw new UnauthorizedError('No authentication token provided');
    }

    // Decode token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired authentication token');
    }

    // Load user and permissions from database
    const userId = decoded.id || decoded.sub; // sub is standard Supabase field
    const userEmail = decoded.email;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { email: userEmail }
        ],
        isActive: true,
      },
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
      },
    });

    if (!user) {
      throw new UnauthorizedError('User account not found or is deactivated');
    }

    const permissions = user.role.permissions.map((rp) => rp.permission.name);

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
      permissions,
      organizationId: user.organizationId,
      branchId: user.branchId,
    };
    req.orgId = user.organizationId;
    req.branchId = user.branchId || undefined;

    next();
  } catch (error) {
    next(error);
  }
};
