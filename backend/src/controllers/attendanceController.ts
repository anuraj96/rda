import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AttendanceService } from '../services/attendanceService';
import { sendResponse } from '../utils/response';

export class AttendanceController {
  // Student Attendance
  static async markStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const branchId = req.branchId || req.body.branchId; // Super admin might not have default branchId in token
      const userId = req.user!.id;

      if (!branchId) {
        return res.status(400).json({ success: false, message: 'Branch ID is required to mark attendance' });
      }

      const records = await AttendanceService.markStudentAttendance(orgId, branchId, req.body, userId);
      return sendResponse(res, 200, 'Student attendance recorded successfully', records);
    } catch (error) {
      next(error);
    }
  }

  static async getBatchAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { batchId } = req.params;
      const dateStr = req.query.date as string;
      const date = dateStr ? new Date(dateStr) : new Date();

      const attendance = await AttendanceService.getBatchAttendanceForDate(orgId, batchId, date);
      return sendResponse(res, 200, 'Batch attendance fetched successfully', attendance);
    } catch (error) {
      next(error);
    }
  }

  static async getStudentSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { studentId } = req.params;

      const summary = await AttendanceService.getStudentAttendanceSummary(orgId, studentId);
      return sendResponse(res, 200, 'Student attendance summary retrieved successfully', summary);
    } catch (error) {
      next(error);
    }
  }

  // Staff Attendance
  static async checkIn(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const branchId = req.branchId;
      const userId = req.user!.id;

      if (!branchId) {
        return res.status(400).json({ success: false, message: 'Branch assignment is required to check in' });
      }

      const record = await AttendanceService.staffCheckIn(orgId, branchId, userId);
      return sendResponse(res, 200, 'Checked in successfully', record);
    } catch (error) {
      next(error);
    }
  }

  static async checkOut(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const userId = req.user!.id;

      const record = await AttendanceService.staffCheckOut(orgId, userId);
      return sendResponse(res, 200, 'Checked out successfully', record);
    } catch (error) {
      next(error);
    }
  }

  static async getStaffReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const branchId = req.branchId;
      const month = req.query.month ? Number(req.query.month) : undefined;
      const year = req.query.year ? Number(req.query.year) : undefined;

      const report = await AttendanceService.getStaffAttendanceReport(orgId, branchId, month, year);
      return sendResponse(res, 200, 'Staff attendance summary retrieved successfully', report);
    } catch (error) {
      next(error);
    }
  }
}
