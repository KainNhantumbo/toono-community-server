import type { Request, Response } from 'express';
import Exception from '../../lib/app-exception';
import { db } from '../../database/client.database';
import { user as User } from '../../database/schema.database';
import { isNotEmpty } from 'class-validator';

export default class UserController {
  private readonly cloud_folder: string;

  constructor() {
    this.cloud_folder = '/toono-community-api/users';
  }

  async findOne(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const user = await db.query.user.findFirst({
      where: (table, fn) => fn.eq(table.id, id),
      with: { network: true, profile_image: true },
      columns: { password: false, role: false }
    });
    if (!user) throw new Exception('User not found.', 404);
    res.status(200).json({ ...user });
  }

  async findAll(req: Request, res: Response): Promise<void> {
    const { search, offset, limit, sort, fields } = req.query;
    const defaultColumns = { password: false, role: false };
    let requestedColumns: Record<string, boolean> | undefined = undefined;

    if (isNotEmpty(fields) && typeof fields === 'string') {
      requestedColumns = {
        ...fields.split(',').reduce((acc, field) => {
          if (!Object.keys(User._.columns).includes(field)) return { ...acc, [field]: true };
          return acc;
        }, {}),
        ...defaultColumns
      };
    }

    const users = await db.query.user.findMany({
      where: (table, fn) => {
        const query = String(search);
        if (!query) return undefined;
        return fn.or(
          fn.ilike(table.name, query),
          fn.ilike(table.user_name, query),
          fn.ilike(table.email, query)
        );
      },
      with: { network: true, profile_image: true },
      orderBy: (table, fn) => {
        const orderEnum = ['asc', 'desc'];
        const [field, order] = String(sort).split(',');
        if (!Object.keys(table).includes(field)) return undefined;
        if (!orderEnum.includes(order)) return undefined;
        return fn[order](table[field]);
      },
      columns: requestedColumns ?? defaultColumns,
      offset: offset ? +offset : undefined,
      limit: limit ? +limit : undefined
    });
    res.status(200).json(users);
  }

  async create(req: Request, res: Response): Promise<void> {}
  async update(req: Request, res: Response): Promise<void> {}
  async delete(req: Request, res: Response): Promise<void> {}
}
