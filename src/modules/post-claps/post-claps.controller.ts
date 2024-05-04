import * as drizzle from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../../database/client.database";
import { claps } from "../../database/schema.database";
import Exception from "../../lib/app-exception";

export default class PostClapsController {
  async create(req: Request, res: Response): Promise<void> {
    const { session } = req.body;
    const { id: postId } = req.params;

    const clapRecord = await db.query.claps.findFirst({
      where: (table, fn) =>
        fn.and(fn.eq(table.user_id, session.id), fn.eq(table.post_id, postId))
    });
    if (clapRecord) throw new Exception("Clap already added.", 400);

    await db.insert(claps).values({ user_id: session.id, post_id: postId });
    res.sendStatus(201);
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { session } = req.body;
    const { id: postId } = req.params;

    const clapRecord = await db.query.claps.findFirst({
      where: (table, fn) =>
        fn.and(fn.eq(table.user_id, session.id), fn.eq(table.post_id, postId))
    });
    if (!clapRecord) throw new Exception("Clap not found.", 404);

    await db
      .delete(claps)
      .where(
        drizzle.and(drizzle.eq(claps.post_id, postId), drizzle.eq(claps.user_id, session.id))
      );
    res.sendStatus(204);
  }
}
