import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { StudentService } from '../services/studentService';
import { sendResponse } from '../utils/response';

export class StudentController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const branchId = req.branchId; // locked from tenant isolation
      const batchId = req.query.batchId as string;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const result = await StudentService.list(orgId, branchId, { batchId, search, status, page, limit });

      if (page !== undefined && limit !== undefined && result && typeof result === 'object' && 'data' in result) {
        return sendResponse(res, 200, 'Students directory retrieved successfully', result.data, {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
        });
      }

      return sendResponse(res, 200, 'Students directory retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params;

      const student = await StudentService.getById(orgId, id);
      return sendResponse(res, 200, 'Student details retrieved successfully', student);
    } catch (error) {
      next(error);
    }
  }

  static async getPaymentDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params;

      const paymentDetails = await StudentService.getPaymentDetails(orgId, id);
      return sendResponse(res, 200, 'Student payment details retrieved successfully', paymentDetails);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const userId = req.user!.id;

      const student = await StudentService.create(orgId, req.body, userId);
      return sendResponse(res, 201, 'Student admission completed successfully', student);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params;
      const userId = req.user!.id;

      const student = await StudentService.update(orgId, id, req.body, userId);
      return sendResponse(res, 200, 'Student profile updated successfully', student);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params;
      const userId = req.user!.id;

      await StudentService.delete(orgId, id, userId);
      return sendResponse(res, 200, 'Student record deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async addDocument(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params; // studentId
      const userId = req.user!.id;
      const { name, fileUrl } = req.body;

      const doc = await StudentService.addDocument(orgId, id, name, fileUrl, userId);
      return sendResponse(res, 201, 'Student document uploaded successfully', doc);
    } catch (error) {
      next(error);
    }
  }

  static async deleteDocument(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { docId } = req.params;
      const userId = req.user!.id;

      await StudentService.deleteDocument(orgId, docId, userId);
      return sendResponse(res, 200, 'Student document deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async bulkCreate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const userId = req.user!.id;
      const { branchId, students } = req.body;

      if (!branchId) {
        return res.status(400).json({ success: false, message: 'Branch ID is required for bulk upload' });
      }

      if (!students || !Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ success: false, message: 'No student records found to import' });
      }

      const created = await StudentService.bulkCreate(orgId, branchId, students, userId);
      return sendResponse(res, 201, `${created.length} students imported successfully`, created);
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message || 'Bulk upload failed' });
    }
  }
}
