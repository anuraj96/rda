import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { FinanceService } from '../services/financeService';
import { sendResponse } from '../utils/response';

export class FeeController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const branchId = req.branchId; // Locked from tenant isolation
      const status = req.query.status as string;
      const studentId = req.query.studentId as string;
      const search = req.query.search as string;

      const fees = await FinanceService.listFees(orgId, branchId, { status, studentId, search });
      return sendResponse(res, 200, 'Fees list retrieved successfully', fees);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params;

      const fee = await FinanceService.getFeeById(orgId, id);
      return sendResponse(res, 200, 'Fee details retrieved successfully', fee);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const userId = req.user!.id;

      const fee = await FinanceService.createFee(orgId, req.body, userId);
      return sendResponse(res, 201, 'Fee invoice generated successfully', fee);
    } catch (error) {
      next(error);
    }
  }

  static async collect(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const userId = req.user!.id;

      const paymentResult = await FinanceService.collectFee(orgId, req.body, userId);
      return sendResponse(res, 200, 'Fee payment logged successfully', paymentResult);
    } catch (error) {
      next(error);
    }
  }

  static async getDefaulters(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const branchId = req.branchId;

      const defaulters = await FinanceService.getDefaulters(orgId, branchId);
      return sendResponse(res, 200, 'Overdue fees and defaulters list retrieved successfully', defaulters);
    } catch (error) {
      next(error);
    }
  }
}
