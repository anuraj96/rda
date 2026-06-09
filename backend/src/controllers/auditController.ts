import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../prisma/client';
import { sendResponse } from '../utils/response';

export class AuditController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const branchId = req.branchId; // Locked from tenant isolation

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const skip = (page - 1) * limit;

      const where: any = { organizationId: orgId };
      if (branchId) {
        where.branchId = branchId;
      }

      const total = await prisma.auditLog.count({ where });

      const auditLogs = await prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, employeeId: true },
          },
          branch: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      return sendResponse(res, 200, 'Audit logs retrieved successfully', auditLogs, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  }
}
