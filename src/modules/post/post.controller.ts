import Exception from '../../lib/app-exception';
import { db } from '../../database/client.database';
import { posts } from '../../database/schema.database';
import { cloudinaryAPI } from '../../config/cloudinary.config';
import type { Request, Response } from 'express';
import { isEmpty, isNotEmpty } from 'class-validator';

export default class PostController {
  async findOne(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const post = await db.query.posts.findFirst({
      where: (table, fn) => fn.eq(table.id, id),
      with: {
        claps: true,
        coverImage: true,
        user: { columns: { name: true, user_name: true } }
      }
    });
    if (!post) throw new Exception('Post not found.', 404);
    res.status(200).json(post);
  }

  async findAll(req: Request, res: Response): Promise<void> {
    const { search, offset, limit, sort, fields } = req.query;
    let requestedColumns: Record<string, boolean> | undefined = undefined;
    if (isNotEmpty(fields) && typeof fields === 'string') {
      requestedColumns = fields.split(',').reduce((acc, field) => {
        if (!Object.keys(posts._.columns).includes(field)) return { ...acc, [field]: true };
        return acc;
      }, {});
    }

    const posts = await db.query.posts.findMany({
      where: (table, fn) => {
        const query = String(search);
        if (!query) return undefined;
        return fn.or(
          fn.ilike(table.title, query),
          fn.ilike(table.content, query),
          fn.ilike(table.tags, query)
        );
      },
      with: { claps: true, coverImage: true },
      orderBy: (table, fn) => {
        const orderEnum = ['asc', 'desc'];
        const [field, order] = String(sort).split(',');
        if (!Object.keys(table).includes(field)) return undefined;
        if (!orderEnum.includes(order)) return undefined;
        return fn[order](table[field]);
      },
      columns: requestedColumns ,
      offset: offset ? +offset : undefined,
      limit: limit ? +limit : undefined
    });
    res.status(200).json(posts);
  }

  async create(req: Request, res: Response): Promise<void> {
// const { password, email, ...data } = await CreateUserSchema.parseAsync(req.body);
  }

  async update(req: Request, res: Response): Promise<void> {}
  async delete(req: Request, res: Response): Promise<void> {}
}
