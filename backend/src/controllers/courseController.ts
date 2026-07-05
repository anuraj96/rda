import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { CourseService } from '../services/courseService';
import { sendResponse } from '../utils/response';

export class CourseController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const status = req.query.status as string;
      const branchId = req.query.branchId as string || req.branchId;

      const courses = await CourseService.listCourses(orgId, branchId, status);
      return sendResponse(res, 200, 'Courses retrieved successfully', courses);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params;

      const course = await CourseService.getCourseById(orgId, id);
      return sendResponse(res, 200, 'Course retrieved successfully', course);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const userId = req.user!.id;

      const course = await CourseService.createCourse(orgId, req.body, userId);
      return sendResponse(res, 201, 'Course created successfully', course);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params;
      const userId = req.user!.id;

      const course = await CourseService.updateCourse(orgId, id, req.body, userId);
      return sendResponse(res, 200, 'Course updated successfully', course);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params;
      const userId = req.user!.id;

      await CourseService.deleteCourse(orgId, id, userId);
      return sendResponse(res, 200, 'Course deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
