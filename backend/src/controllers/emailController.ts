import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { Resend } from 'resend';
import { sendResponse } from '../utils/response';
import { BadRequestError } from '../utils/errors';

export class EmailController {
  static async sendEmail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { to, subject, message, html } = req.body;

      if (!to) {
        throw new BadRequestError('Recipient email address (to) is required');
      }

      const apiKey = process.env.RESEND_API_KEY || 're_xxxxxxxxx';
      const resend = new Resend(apiKey);

      const emailSubject = subject || 'Notification from Rudreshwar Dance Academy';
      const emailContent = html || (message ? `<p>${message.replace(/\n/g, '<br/>')}</p>` : '<p>Hello from Rudreshwar Dance Academy!</p>');
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

      const data = await resend.emails.send({
        from: fromEmail,
        to: to,
        subject: emailSubject,
        html: emailContent,
      });

      return sendResponse(res, 200, 'Email sent successfully', data);
    } catch (error) {
      next(error);
    }
  }
}
