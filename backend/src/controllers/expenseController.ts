import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { FinanceService } from '../services/financeService';
import { sendResponse } from '../utils/response';

export class ExpenseController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const branchId = req.branchId; // Locked from tenant isolation
      const category = req.query.category as string;
      const startStr = req.query.start as string;
      const endStr = req.query.end as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const start = startStr ? new Date(startStr) : undefined;
      const end = endStr ? new Date(endStr) : undefined;

      const { data, total } = await FinanceService.listExpenses(orgId, branchId, { category, start, end, page, limit });
      return sendResponse(res, 200, 'Expenses list retrieved successfully', data, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const branchId = req.branchId || req.body.branchId;
      const userId = req.user!.id;

      if (!branchId) {
        return res.status(400).json({ success: false, message: 'Branch ID is required to log an expense' });
      }

      const expense = await FinanceService.createExpense(orgId, { ...req.body, branchId }, userId);
      return sendResponse(res, 201, 'Expense record created successfully', expense);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params;
      const userId = req.user!.id;

      const expense = await FinanceService.updateExpense(orgId, id, req.body, userId);
      return sendResponse(res, 200, 'Expense record updated successfully', expense);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params;
      const userId = req.user!.id;

      await FinanceService.deleteExpense(orgId, id, userId);
      return sendResponse(res, 200, 'Expense record deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getProfitLoss(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const branchId = req.branchId;
      const year = req.query.year ? Number(req.query.year) : undefined;

      const report = await FinanceService.getProfitLossReport(orgId, branchId, year);
      return sendResponse(res, 200, 'Profit and loss monthly trend report retrieved successfully', report);
    } catch (error) {
      next(error);
    }
  }
}
