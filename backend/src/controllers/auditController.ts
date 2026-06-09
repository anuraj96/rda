import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../prisma/client';
import { sendResponse } from '../utils/response';

export class AuditController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const branchId = req.branchId; // Locked from tenant isolation

      const where: any = { organizationId: orgId };
      if (branchId) {
        where.branchId = branchId;
      }

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
        take: 100, // Limit to recent 100 logs
      });

      return sendResponse(res, 200, 'Audit logs retrieved successfully', auditLogs);
    } catch (error) {
      next(error);
    }
  }
}
