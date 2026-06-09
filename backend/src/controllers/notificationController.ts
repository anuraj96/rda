import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../prisma/client';
import { sendResponse } from '../utils/response';
import { NotFoundError } from '../utils/errors';

export class NotificationController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const userId = req.user!.id;

      const notifications = await prisma.notification.findMany({
        where: {
          organizationId: orgId,
          userId,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return sendResponse(res, 200, 'Notifications retrieved successfully', notifications);
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const userId = req.user!.id;
      const { id } = req.params;

      const notification = await prisma.notification.findFirst({
        where: { id, organizationId: orgId, userId, isActive: true },
      });

      if (!notification) {
        throw new NotFoundError('Notification not found');
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { read: true },
      });

      return sendResponse(res, 200, 'Notification marked as read', updated);
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const userId = req.user!.id;

      await prisma.notification.updateMany({
        where: { organizationId: orgId, userId, read: false, isActive: true },
        data: { read: true },
      });

      return sendResponse(res, 200, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }
}
