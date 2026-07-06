import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { DashboardService } from '../services/dashboardService';
import { sendResponse } from '../utils/response';

export class DashboardController {
  static async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const branchId = req.branchId;
      const userRole = req.user!.role;

      const stats = await DashboardService.getStats(orgId, branchId, userRole);
      return sendResponse(res, 200, 'Dashboard statistics fetched successfully', stats);
    } catch (error) {
      next(error);
    }
  }

  static async getCharts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const branchId = req.branchId;
      const userRole = req.user!.role;

      const charts = await DashboardService.getCharts(orgId, branchId, userRole);
      return sendResponse(res, 200, 'Dashboard analytics fetched successfully', charts);
    } catch (error) {
      next(error);
    }
  }
}
