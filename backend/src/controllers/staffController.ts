import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { StaffService } from '../services/staffService';
import { sendResponse } from '../utils/response';

export class StaffController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const branchId = req.branchId; // locked from tenant isolation
      const roleId = req.query.roleId as string;
      const search = req.query.search as string;
      const status = req.query.status as string;

      const staff = await StaffService.list(orgId, branchId, { roleId, search, status });
      return sendResponse(res, 200, 'Staff directory retrieved successfully', staff);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params;

      const staff = await StaffService.getById(orgId, id);
      return sendResponse(res, 200, 'Staff details retrieved successfully', staff);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const userId = req.user!.id;

      const staff = await StaffService.create(orgId, req.body, userId);
      return sendResponse(res, 201, 'Staff onboarded successfully', staff);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params;
      const userId = req.user!.id;

      const staff = await StaffService.update(orgId, id, req.body, userId);
      return sendResponse(res, 200, 'Staff profile updated successfully', staff);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params;
      const userId = req.user!.id;

      await StaffService.delete(orgId, id, userId);
      return sendResponse(res, 200, 'Staff account deactivated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async listRoles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const roles = await StaffService.listRoles();
      return sendResponse(res, 200, 'Roles retrieved successfully', roles);
    } catch (error) {
      next(error);
    }
  }
}
