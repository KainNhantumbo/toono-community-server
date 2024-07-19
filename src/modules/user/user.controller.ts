import * as bcrypt from "bcrypt";
import { isEmpty, isNotEmpty } from "class-validator";
import * as drizzle from "drizzle-orm";
import type { Request, Response } from "express";
import { cloudinaryAPI } from "../../config/cloudinary.config";
import { db } from "../../database/client.database";
import {
  network_urls,
  posts,
  user_profile_image,
  users
} from "../../database/schema.database";
import Exception from "../../lib/app-exception";
import { CLOUD_USER_IMAGE_REPOSITORY } from "../../shared/constants";
import { CreateUserSchema, UpdateUserSchema } from "./user.schema";

export default class UserController {
  async stats(req: Request, res: Response): Promise<void> {
    const { session } = req.body;

    const records = await db
      .select({ _count: drizzle.count(posts.id) })
      .from(posts)
      .where(drizzle.eq(posts.user_id, session.id))
      .groupBy(posts.id);

    res.status(200).json([records]);
  }

  async findOne(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (isEmpty(id)) throw new Exception("Invalid user id.", 400);

    const user = await db.query.users.findFirst({
      where: (table, fn) => fn.eq(table.id, id),
      with: {
        network: { columns: { user_id: false, id: false } },
        profile_image: { columns: { url: true } },
        posts: {
          where: (table, fn) => fn.eq(table.public, true),
          columns: {
            id: true,
            title: true,
            slug: true,
            read_time: true,
            words: true,
            tags: true,
            updated_at: true,
            created_at: true
          },
          with: {
            claps: { columns: { id: true } },
            comments: { columns: { id: true } }
          },
          orderBy: (table, fn) => {
            return fn.desc(table.created_at);
          }
        }
      },
      columns: { password: false, role: false, email: false }
    });
    if (!user) throw new Exception("User not found.", 404);
    res.status(200).json({ ...user });
  }

  async findAll(req: Request, res: Response): Promise<void> {
    const { search, offset, limit, sort, fields } = req.query;
    const defaultColumns = { password: false, role: false };

    let requestedColumns: Record<string, boolean> | undefined = undefined;
    if (isNotEmpty(fields) && typeof fields === "string") {
      requestedColumns = {
        ...fields.split(",").reduce((acc, field) => {
          if (!Object.keys(users._.columns).includes(field)) return { ...acc, [field]: true };
          return acc;
        }, {}),
        ...defaultColumns
      };
    }

    const foundUsers = await db.query.users.findMany({
      where: isEmpty(search)
        ? undefined
        : (table, fn) => {
            const query = String(search);
            if (!query) return undefined;
            return fn.or(
              fn.ilike(table.name, `%${query}%`),
              fn.ilike(table.user_name, `%${query}%`),
              fn.ilike(table.email, `%${query}%`)
            );
          },
      with: { network: true, profile_image: true },
      orderBy: (table, fn) => {
        const orderEnum = ["asc", "desc"] as const;
        const [field, order] = String(sort).split(",") as [keyof typeof table, "desc" | "asc"];

        if (!Object.keys(table).includes(field)) return fn.asc(table.created_at);
        if (!orderEnum.includes(order)) return fn.asc(table.created_at);
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
    if (user) throw new Exception("Account with provided password already exists.", 409);

    const hash = await bcrypt.hash(password, 10);
    const [record] = await db
      .insert(users)
      .values({ ...data, password: hash, email })
      .returning({ id: users.id });
    await db.insert(network_urls).values({ user_id: record.id });

    res.sendStatus(201);
  }

  async update(req: Request, res: Response): Promise<void> {
    const { session, ...rest } = req.body;
    const { profileImage, network, ...data } = await UpdateUserSchema.parseAsync(rest);

    const user = await db.query.users.findFirst({
      where: (table, fn) => fn.eq(table.id, session.id),
      with: { profile_image: { columns: { public_id: true } } },
      columns: { id: true }
    });
    if (!user) throw new Exception("User not found", 404);

    if (data.password) {
      if (data.password.length < 8) {
        throw new Exception("Password must have at least 8 characters", 400);
      }
      data.password = await bcrypt.hash(data.password, 10);
    }

    if (network) {
      await db
        .update(network_urls)
        .set(network)
        .where(drizzle.eq(network_urls.user_id, session.id));
    }

    await profileImageHandler(user, profileImage);
    await db.update(users).set(data).where(drizzle.eq(users.id, session.id));
    res.sendStatus(200);
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { session } = req.body;

    //  delete profile image or posts cover images if they exist
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

    const [record] = await db
      .delete(users)
      .where(drizzle.eq(users.id, session.id))
      .returning({ id: users.id });

    if (!record) throw new Exception("Error while deleting user.", 400);
    res.sendStatus(204);
  }
}

async function profileImageHandler(
  user: { id: string; profile_image: { public_id: string } | null },
  profileImage?: unknown
) {
  if (typeof profileImage !== "string") throw new Exception("Invalid cover image", 400);

  // if the profileImage is empty, delete image on the cloud
  if (isEmpty(profileImage) && user.profile_image) {
    await cloudinaryAPI.uploader.destroy(user.profile_image.public_id, {
      invalidate: true
    });
    await db.delete(user_profile_image).where(drizzle.eq(user_profile_image.user_id, user.id));
    return;
  }

  // if the profileImage exists, creates it (if doesn't yet) or updates
  const result = await cloudinaryAPI.uploader.upload(profileImage, {
    public_id: user.profile_image?.public_id || undefined,
    folder: CLOUD_USER_IMAGE_REPOSITORY
  });

  if (!user.profile_image) {
    return await db.insert(user_profile_image).values({
      public_id: result.public_id,
      url: result.secure_url,
      user_id: user.id
    });
  }

  return await db
    .update(user_profile_image)
    .set({ public_id: result.public_id, url: result.secure_url })
    .where(drizzle.eq(user_profile_image.user_id, user.id));
}
