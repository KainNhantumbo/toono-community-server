import { Request, Response } from 'express';
import xlsx from 'xlsx';
import { db } from '../../database/client.database';
import Exception from '../../lib/app-exception';

export default class BackupController {
  async export(req: Request, res: Response): Promise<void> {
    const { session } = req.body;
    const posts = await db.query.posts.findMany({
      where: (table, fn) => fn.eq(table.user_id, session.id)
    });

    const sheet = xlsx.utils.json_to_sheet(posts)
    if (posts.length < 1) throw new Exception('No posts to export.', 404);
    res.status(200).json(sheet);
  }
}
