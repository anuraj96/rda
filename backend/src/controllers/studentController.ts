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

      const students = await StudentService.list(orgId, branchId, { batchId, search, status });
      return sendResponse(res, 200, 'Students directory retrieved successfully', students);
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
}
