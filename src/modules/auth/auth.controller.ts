import 'dotenv/config';
import { Request, Response } from 'express';
import Exception from '../../lib/app-exception';
import { createToken, verifyToken } from '../../lib/utils';

export default class AuthController {
  async login(req: Request, res: Response): Promise<void> {}
  async logout(req: Request, res: Response): Promise<void> {}
  async refresh(req: Request, res: Response): Promise<void> {}
}
