import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export const checkPermission = (requiredPermission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User authentication context is missing');
      }

      // Super admin can do everything
      if (req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      // Check if user has the specific required permission
      if (req.user.permissions.includes(requiredPermission)) {
        return next();
      }

      throw new ForbiddenError(`You do not have the required permission: ${requiredPermission}`);
    } catch (error) {
      next(error);
    }
  };
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User authentication context is missing');
      }

      if (allowedRoles.includes(req.user.role)) {
        return next();
      }

      throw new ForbiddenError('You do not have permission to access this resource');
    } catch (error) {
      next(error);
    }
  };
};
