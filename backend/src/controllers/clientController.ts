import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ClientService } from '../services/clientService';
import { sendResponse } from '../utils/response';

export class ClientController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const clients = await ClientService.list();
      return sendResponse(res, 200, 'Clients retrieved successfully', clients);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { orgName, adminName, adminEmail, adminPassword } = req.body;
      const client = await ClientService.create({ orgName, adminName, adminEmail, adminPassword });
      return sendResponse(res, 201, 'Client organization and Super Admin created successfully', client);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await ClientService.delete(id);
      return sendResponse(res, 200, 'Client organization deactivated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async enable(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await ClientService.enable(id);
      return sendResponse(res, 200, 'Client organization enabled successfully');
    } catch (error) {
      next(error);
    }
  }
}
