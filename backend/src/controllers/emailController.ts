import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { MailtrapClient } from 'mailtrap';
import { sendResponse } from '../utils/response';
import { BadRequestError } from '../utils/errors';

export class EmailController {
  static async sendEmail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { to, subject, message, html } = req.body;

      if (!to) {
        throw new BadRequestError('Recipient email address (to) is required');
      }

      const token = process.env.MAILTRAP_TOKEN || 'e1732e4cd27af3782cae55dd51c3cfb4';
      const client = new MailtrapClient({ token });

      const sender = {
        email: process.env.MAILTRAP_SENDER_EMAIL || 'hello@demomailtrap.co',
        name: process.env.MAILTRAP_SENDER_NAME || 'Rudreshwar Dance Academy',
      };

      const recipients = [{ email: to }];
      const emailSubject = subject || 'Notification from Rudreshwar Dance Academy';
      const emailText = message || (html ? html.replace(/<[^>]+>/g, '') : 'Notification from Rudreshwar Dance Academy');

      const response = await client.send({
        from: sender,
        to: recipients,
        subject: emailSubject,
        text: emailText,
        html: html || (message ? `<p>${message.replace(/\n/g, '<br/>')}</p>` : undefined),
        category: 'Student Notification',
      });

      return sendResponse(res, 200, 'Email sent successfully via Mailtrap', response);
    } catch (error) {
      console.error('[Mailtrap API Error]:', error);
      next(error);
    }
  }
}
