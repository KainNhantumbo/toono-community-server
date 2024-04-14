import type { NextFunction, Request, Response } from 'express';
import Exception from '../lib/app-exception';
import { asyncWrapper, verifyToken } from '../lib/utils';
import { Server } from '../types';

export const authenticate = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
      throw new Exception('Invalid authorization header.', 400);
    const token = authHeader.split(' ')[1];
    const decodedPayload = (await verifyToken(
      token,
      process.env.ACCESS_TOKEN || ''
    )) as Server.DecodedPayload;

    if (!decodedPayload) throw new Exception('Access denied.', 401);
    req.body.session = { id: decodedPayload.id, role: decodedPayload.role };
    next();
  }
);
