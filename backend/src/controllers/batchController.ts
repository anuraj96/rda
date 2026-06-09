import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { CourseService } from '../services/courseService';
import { sendResponse } from '../utils/response';

export class BatchController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const branchId = req.branchId; // Locked from tenant isolation
      const courseId = req.query.courseId as string;
      const instructorId = req.query.instructorId as string;
      const status = req.query.status as string;

      const batches = await CourseService.listBatches(orgId, branchId, { courseId, instructorId, status });
      return sendResponse(res, 200, 'Batches retrieved successfully', batches);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params;

      const batch = await CourseService.getBatchById(orgId, id);
      return sendResponse(res, 200, 'Batch retrieved successfully', batch);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const userId = req.user!.id;

      const batch = await CourseService.createBatch(orgId, req.body, userId);
      return sendResponse(res, 201, 'Batch created successfully', batch);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params;
      const userId = req.user!.id;

      const batch = await CourseService.updateBatch(orgId, id, req.body, userId);
      return sendResponse(res, 200, 'Batch updated successfully', batch);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params;
      const userId = req.user!.id;

      await CourseService.deleteBatch(orgId, id, userId);
      return sendResponse(res, 200, 'Batch deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async enrollStudents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params; // batchId
      const { studentIds } = req.body;

      await CourseService.enrollStudents(orgId, id, studentIds);
      return sendResponse(res, 200, 'Students enrolled in batch successfully');
    } catch (error) {
      next(error);
    }
  }

  static async unenrollStudents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params; // batchId
      const { studentIds } = req.body;

      await CourseService.unenrollStudents(orgId, id, studentIds);
      return sendResponse(res, 200, 'Students unenrolled from batch successfully');
    } catch (error) {
      next(error);
    }
  }
}
