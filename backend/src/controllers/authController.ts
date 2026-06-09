import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AuthService } from '../services/authService';
import { sendResponse } from '../utils/response';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const authData = await AuthService.login(email, password);
      return sendResponse(res, 200, 'Login successful', authData);
    } catch (error) {
      next(error);
    }
  }

  static async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const meData = await AuthService.getMe(userId);
      return sendResponse(res, 200, 'Current user profile fetched successfully', meData);
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // client side deletes the token. On backend we log it
      return sendResponse(res, 200, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }
}
