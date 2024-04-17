import * as drizzle from 'drizzle-orm';
import type { Request, Response } from 'express';
import { db } from '../../database/client.database';
import { comment } from '../../database/schema.database';
import Exception from '../../lib/app-exception';
import { isNotEmpty } from 'class-validator';
import { CommentSchema } from './comments.schema';

export default class CommentController {
  async findAll(req: Request, res: Response): Promise<void> {
    const { postId, userId, limit, offset } = req.params;
    const data = db.query.comment.findMany({
      where: (table, fn) => {
        if (isNotEmpty(postId) && isNotEmpty(userId)) {
          return fn.and(fn.eq(table.user_id, userId), fn.eq(table.post_id, postId));
        }
        return undefined;
      },
      offset: isNotEmpty(offset) ? +offset : undefined,
      limit: isNotEmpty(limit) ? +limit : undefined
    });
    res.status(200).json(data);
  }

  async create(req: Request, res: Response): Promise<void> {
    const { session, ...rest } = req.body;
    const { id: postId } = req.params;
    const { content } = await CommentSchema.parseAsync(rest);

    const postRecord = await db.query.posts.findFirst({
      where: (table, fn) => fn.eq(table.id, postId)
    });
    if (!postRecord) throw new Exception('Post not found.', 404);

    await db.insert(comment).values({ user_id: session.id, post_id: postId, content });
    res.sendStatus(201);
  }

  async update(req: Request, res: Response): Promise<void> {}
  async delete(req: Request, res: Response): Promise<void> {}
}
