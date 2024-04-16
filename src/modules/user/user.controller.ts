import * as bcrypt from 'bcrypt';
import { isEmpty, isNotEmpty } from 'class-validator';
import { randomUUID } from 'crypto';
import * as drizzle from 'drizzle-orm';
import type { Request, Response } from 'express';
import { cloudinaryAPI } from '../../config/cloudinary.config';
import { db } from '../../database/client.database';
import { user_profile_image, users } from '../../database/schema.database';
import Exception from '../../lib/app-exception';
import { CLOUD_USER_IMAGE_REPOSITORY } from '../../shared/constants';
import { CreateUserSchema, UpdateUserSchema } from './user.schema';

export default class UserController {
  async findOne(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const user = await db.query.users.findFirst({
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
          if (!Object.keys(users._.columns).includes(field)) return { ...acc, [field]: true };
          return acc;
        }, {}),
        ...defaultColumns
      };
    }

    const foundUsers = await db.query.users.findMany({
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
        // @ts-expect-error(order is not a function)
        return fn[order](table[field]);
      },
      columns: requestedColumns ?? defaultColumns,
      offset: offset ? +offset : undefined,
      limit: limit ? +limit : undefined
    });
    res.status(200).json(foundUsers);
  }

  async create(req: Request, res: Response): Promise<void> {
    const { password, email, ...data } = await CreateUserSchema.parseAsync(req.body);

    const user = await db.query.users.findFirst({
      where: (table, fn) => fn.eq(table.email, email),
      columns: { email: true }
    });
    if (user) throw new Exception('Account with provided password already exists.', 409);

    const hash = await bcrypt.hash(password, 10);
    await db.insert(users).values({ ...data, password: hash, email });
    res.sendStatus(201);
  }

  async update(req: Request, res: Response): Promise<void> {
    const { session, ...rest } = req.body;
    const { profileImage, ...data } = await UpdateUserSchema.parseAsync(rest);

    const user = await db.query.users.findFirst({
      where: (table, fn) => fn.eq(table.id, session.id),
      with: { profile_image: { columns: { public_id: true } } },
      columns: { id: true }
    });
    if (!user) throw new Exception('User not found', 404);

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    await this.profileImageProcessor(session, user, profileImage);
    await db.update(users).set(data).where(drizzle.eq(users.id, session.id));
    res.sendStatus(200);
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { session } = req.body;

    //  delete profile image or posts cover images if they exist
    if (process.env.NODE_ENV === 'production') {
      const posts = await db.query.posts.findMany({
        where: (table, fn) => fn.eq(table.user_id, users.id),
        columns: { id: true },
        with: { coverImage: true }
      });

      const profileImage = await db.query.user_profile_image.findFirst({
        where: (table, fn) => fn.eq(table.user_id, session.id)
      });

      if (profileImage && profileImage.public_id) {
        await cloudinaryAPI.uploader.destroy(profileImage.public_id, {
          invalidate: true
        });
      }

      if (posts.length > 0) {
        const images = posts.map(({ coverImage }) =>
          coverImage ? coverImage.public_id : undefined
        );

        for (const id of images) {
          if (id) {
            await cloudinaryAPI.uploader.destroy(id, {
              invalidate: true
            });
          }
        }
      }
    }

    const [deletedUser] = await db
      .delete(users)
      .where(drizzle.eq(users.id, session.id))
      .returning({ id: users.id });

    if (!deletedUser) throw new Exception('Error while deleting user.', 400);
    res.sendStatus(204);
  }

  private async profileImageProcessor(
    { id: userId }: { id: string },
    user: { id: string; profile_image: { public_id: string } | null },
    profileImage?: unknown
  ) {
    if (process.env.NODE_ENV !== 'production') {
      if (typeof profileImage === 'string' && isNotEmpty(profileImage)) {
        if (!user.profile_image) {
          await db
            .insert(user_profile_image)
            .values({ public_id: randomUUID(), url: profileImage, user_id: userId });
        } else {
          await db
            .update(user_profile_image)
            .set({ public_id: randomUUID(), url: profileImage })
            .where(drizzle.eq(user_profile_image.user_id, userId));
        }
      }

      if (typeof profileImage === 'string' && isEmpty(profileImage)) {
        await db
          .delete(user_profile_image)
          .where(drizzle.eq(user_profile_image.user_id, userId));
      }
    } else {
      // if the profileImage exists, creates it (if doesn't yet) or updates
      if (typeof profileImage === 'string' && isNotEmpty(profileImage)) {
        const result = await cloudinaryAPI.uploader.upload(profileImage, {
          public_id: user.profile_image?.public_id || undefined,
          folder: CLOUD_USER_IMAGE_REPOSITORY
        });

        if (!user.profile_image) {
          await db.insert(user_profile_image).values({
            public_id: result.public_id,
            url: result.secure_url,
            user_id: user.id
          });
        } else {
          await db
            .update(user_profile_image)
            .set({ public_id: result.public_id, url: result.secure_url })
            .where(drizzle.eq(user_profile_image.user_id, userId));
        }

        // if the profileImage is empty, delete image on the cloud
        if (typeof profileImage === 'string' && isEmpty(profileImage) && user.profile_image) {
          await cloudinaryAPI.uploader.destroy(user.profile_image.public_id, {
            invalidate: true
          });
          await db
            .delete(user_profile_image)
            .where(drizzle.eq(user_profile_image.user_id, userId));
        }
      }
    }
  }
}
