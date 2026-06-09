import { Response } from 'express';

export const sendResponse = (
  res: Response,
  statusCode: number,
  message: string,
  data: any = null,
  meta: any = null
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
  });
};
