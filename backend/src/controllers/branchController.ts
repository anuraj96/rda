import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { BranchService } from '../services/branchService';
import { sendResponse } from '../utils/response';

export class BranchController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const search = req.query.search as string;
      const status = req.query.status as string;

      const branches = await BranchService.list(orgId, { search, status });
      return sendResponse(res, 200, 'Branches retrieved successfully', branches);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params;

      const branch = await BranchService.getById(orgId, id);
      return sendResponse(res, 200, 'Branch retrieved successfully', branch);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const userId = req.user!.id;

      const branch = await BranchService.create(orgId, req.body, userId);
      return sendResponse(res, 201, 'Branch created successfully', branch);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params;
      const userId = req.user!.id;

      const branch = await BranchService.update(orgId, id, req.body, userId);
      return sendResponse(res, 200, 'Branch updated successfully', branch);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params;
      const userId = req.user!.id;

      await BranchService.delete(orgId, id, userId);
      return sendResponse(res, 200, 'Branch deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
