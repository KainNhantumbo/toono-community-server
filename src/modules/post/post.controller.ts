import Exception from '../../lib/app-exception';
import { db } from '../../database/client.database';
import { posts } from '../../database/schema.database';
import { cloudinaryAPI } from '../../config/cloudinary.config';
import type { Request, Response } from 'express';
import { isEmpty, isNotEmpty } from 'class-validator';

export default class PostController {

  async create(req: Request, res: Response): Promise<void> {
const { password, email, ...data } = await CreateUserSchema.parseAsync(req.body);
  }

  async update(req: Request, res: Response): Promise<void> {}
  async delete(req: Request, res: Response): Promise<void> {}
}
