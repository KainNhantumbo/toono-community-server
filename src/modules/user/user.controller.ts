import { Request, Response } from 'express';
import Exception from '../../lib/app-exception';

export default class UserController {
  async findOne(req: Request, res: Response): Promise<void> {}
  async findAll(req: Request, res: Response): Promise<void> {}
  async create(req: Request, res: Response): Promise<void> {}
  async update(req: Request, res: Response): Promise<void> {}
  async delete(req: Request, res: Response): Promise<void> {}
}
