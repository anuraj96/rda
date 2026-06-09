import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export const tenantMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User authentication context is missing');
    }

    // Always set organization ID from the authenticated user
    req.orgId = req.user.organizationId;

    // Determine branch isolation
    if (req.user.role === 'SUPER_ADMIN') {
      // Super Admin can view/modify all branches or narrow down to a specific branch via header or query param
      const headerBranchId = req.headers['x-branch-id'] as string;
      const queryBranchId = req.query.branchId as string;
      const targetBranchId = headerBranchId || queryBranchId;

      if (targetBranchId) {
        req.branchId = targetBranchId;
      } else {
        req.branchId = undefined; // Nullable/undefined implies organization-wide scope
      }
    } else {
      // Non-super-admins are strictly isolated to their assigned branch
      if (!req.user.branchId) {
        throw new ForbiddenError('User does not have an assigned branch');
      }

      const headerBranchId = req.headers['x-branch-id'] as string;
      const queryBranchId = req.query.branchId as string;
      const targetBranchId = headerBranchId || queryBranchId;

      // If they try to request a different branch, reject it or force overwrite
      if (targetBranchId && targetBranchId !== req.user.branchId) {
        throw new ForbiddenError('Unauthorized access to this branch data');
      }

      req.branchId = req.user.branchId;
    }

    next();
  } catch (error) {
    next(error);
  }
};
