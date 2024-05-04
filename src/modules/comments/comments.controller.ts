import * as drizzle from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../../database/client.database";
import { comment } from "../../database/schema.database";
import Exception from "../../lib/app-exception";
import { CommentSchema } from "./comments.schema";

export default class CommentController {
  async findAll(req: Request, res: Response): Promise<void> {
    const { limit, offset } = req.query;
    const { postId } = req.params;

    const data = await db.query.comment.findMany({
      where:
        postId && typeof postId === "string"
          ? (table, fn) => fn.eq(table.post_id, postId)
          : undefined,
      with: {
        user: {
          columns: { name: true, id: true },
          with: { profile_image: { columns: { url: true } } }
        }
      },
      offset: offset ? +offset : undefined,
      limit: limit ? +limit : undefined
    });

    res.status(200).json(data);
  }

  async create(req: Request, res: Response): Promise<void> {
    const { session, ...rest } = req.body;
    const { id: postId } = req.params;
    const { content, replyId } = await CommentSchema.parseAsync(rest);

    const postRecord = await db.query.posts.findFirst({
      where: (table, fn) => fn.eq(table.id, postId)
    });
    if (!postRecord) throw new Exception("Post not found.", 404);

    await db.insert(comment).values({
      user_id: session.id,
      post_id: postId,
      content,
      reply_comment: replyId ? replyId : null
    });
    res.sendStatus(201);
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id: commentId } = req.params;
    const { session } = req.body;
    const { content, replyId } = await CommentSchema.parseAsync(req.body);

    const record = await db.query.comment.findFirst({
      where: (table, fn) => fn.eq(table.id, commentId)
    });
    if (!record) throw new Exception("Comment not found.", 400);

    await db
      .update(comment)
      .set({ content, reply_comment: replyId || null })
      .where(
        drizzle.and(drizzle.eq(comment.id, commentId), drizzle.eq(comment.user_id, session.id))
      );
    res.sendStatus(200);
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id: commentId } = req.params;

    const [record] = await db
      .delete(comment)
      .where(drizzle.eq(comment.id, commentId))
      .returning({ id: comment.id });

    if (!record) throw new Exception("Failed to delete comment.", 500);
    res.sendStatus(204);
  }
}
