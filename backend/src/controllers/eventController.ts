import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { EventService } from '../services/eventService';
import { sendResponse } from '../utils/response';

export class EventController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const branchId = req.branchId; // Locked from tenant isolation
      const status = req.query.status as string;

      const events = await EventService.list(orgId, branchId, { status });
      return sendResponse(res, 200, 'Events list retrieved successfully', events);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params;

      const event = await EventService.getById(orgId, id);
      return sendResponse(res, 200, 'Event details retrieved successfully', event);
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
        return res.status(400).json({ success: false, message: 'Branch ID is required to create an event' });
      }

      const event = await EventService.create(orgId, { ...req.body, branchId }, userId);
      return sendResponse(res, 201, 'Event created successfully', event);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params;
      const userId = req.user!.id;

      const event = await EventService.update(orgId, id, req.body, userId);
      return sendResponse(res, 200, 'Event updated successfully', event);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params;
      const userId = req.user!.id;

      await EventService.delete(orgId, id, userId);
      return sendResponse(res, 200, 'Event deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async registerParticipant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params; // eventId
      const { studentId } = req.body;

      const registration = await EventService.registerParticipant(orgId, id, studentId);
      return sendResponse(res, 200, 'Student registered for event successfully', registration);
    } catch (error) {
      next(error);
    }
  }

  static async updateAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.orgId!;
      const { id } = req.params; // eventId
      const { studentId, status } = req.body;

      const record = await EventService.updateParticipantAttendance(orgId, id, studentId, status);
      return sendResponse(res, 200, 'Participant event attendance updated successfully', record);
    } catch (error) {
      next(error);
    }
  }
}
