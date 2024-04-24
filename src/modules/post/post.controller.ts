import { isEmpty, isNotEmpty, isUUID } from "class-validator";
import { randomUUID } from "crypto";
import * as drizzle from "drizzle-orm";
import type { Request, Response } from "express";
import { cloudinaryAPI } from "../../config/cloudinary.config";
import { db } from "../../database/client.database";
import { post_cover_image, posts } from "../../database/schema.database";
import Exception from "../../lib/app-exception";
import { generatePostSlug } from "../../lib/utils";
import { CLOUD_POSTS_IMAGE_REPOSITORY } from "../../shared/constants";
import { createPostSchema, updatePostSchema } from "./post.schema";

export default class PostController {
  async findOnePublicPost(req: Request, res: Response): Promise<void> {
    const { slug } = req.params;
    const post = await db.query.posts.findFirst({
      where: (table, fn) => fn.and(fn.eq(table.slug, slug), fn.eq(table.public, true)),
      with: {
        claps: true,
        coverImage: true,
        user: { columns: { name: true, user_name: true } }
      }
    });
    if (!post) throw new Exception("Post not found.", 404);
    res.status(200).json(post);
  }

  async findOneUserPost(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const post = await db.query.posts.findFirst({
      where: (table, fn) => fn.eq(table.id, id),
      with: { coverImage: true }
    });
    if (!post) throw new Exception("Post not found.", 404);
    res.status(200).json(post);
  }

  async findAll(req: Request, res: Response): Promise<void> {
    const { search, offset, limit, sort, fields, userId } = req.query;
    const columns = ["id", "title", "tags", "created_at", "updated_at"];
    let requestedColumns: Record<string, boolean> | undefined = undefined;

    if (isNotEmpty(fields) && typeof fields === "string") {
      requestedColumns = fields.split(",").reduce((acc, field) => {
        if (!Object.keys(columns).includes(field)) return { ...acc, [field]: true };
        return acc;
      }, {});
    }

    const records = await db.query.posts.findMany({
      where: isEmpty(search)
        ? undefined
        : (table, fn) => {
            const query = String(search);
            const defaultSearch = fn.or(
              fn.ilike(table.title, `%${query}%`),
              fn.ilike(table.content, `%${query}%`),
              fn.ilike(table.tags, `%${query}%`)
            );

            if (typeof userId === "string" && isUUID(userId))
              return fn.and(fn.eq(table.user_id, userId), defaultSearch);
            return defaultSearch;
          },
      with: { claps: true, coverImage: true },
      orderBy: (table, fn) => {
        const orderEnum = ["asc", "desc"] as const;
        const [field, order] = String(sort).split(",") as [keyof typeof table, "desc" | "asc"];

        if (!Object.keys(table).includes(field)) return fn.asc(table.title);
        if (!orderEnum.includes(order)) return fn.asc(table.title);
        return fn[order](table[field]);
      },
      columns: requestedColumns,
      offset: offset ? +offset : undefined,
      limit: limit ? +limit : undefined
    });
    res.status(200).json(records);
  }

  async create(req: Request, res: Response): Promise<void> {
    const { session, ...rest } = req.body;
    const { coverImage, title, ...data } = await createPostSchema.parseAsync(rest);
    const slug = generatePostSlug(title);

    const postRecord = await db.query.posts.findFirst({
      where: (table, fn) => fn.eq(table.slug, slug)
    });
    if (postRecord) throw new Exception("A post with provided title, already found.", 409);

    const [post] = await db
      .insert(posts)
      .values({ ...data, title, slug, user_id: session.id })
      .returning({ id: posts.id });

    if (coverImage) await this.coverImageProcessor(post.id, coverImage);
    res.sendStatus(201);
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id: postId } = req.params;
    const { coverImage, ...data } = await updatePostSchema.parseAsync(req.body);

    const post = await db.query.posts.findFirst({
      where: (table, fn) => fn.eq(table.id, postId),
      columns: { id: true }
    });
    if (!post) throw new Exception("Post not found.", 404);

    await db.update(posts).set(data).where(drizzle.eq(posts.id, postId));
    if (coverImage) await this.coverImageProcessor(postId, coverImage);
    res.sendStatus(200);
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id: postId } = req.params;
    const post = await db.query.posts.findFirst({
      where: (table, fn) => fn.eq(table.id, postId),
      columns: { id: true },
      with: { coverImage: true }
    });
    if (!post) throw new Exception("Post not found.", 404);

    //  delete posts cover images if exist
    if (process.env.NODE_ENV === "production" && post.coverImage) {
      await cloudinaryAPI.uploader.destroy(post.coverImage.public_id, { invalidate: true });
    }

    const [record] = await db
      .delete(posts)
      .where(drizzle.eq(posts.id, postId))
      .returning({ id: posts.id });

    if (!record) throw new Exception("Error while deleting your post.", 400);
    res.sendStatus(204);
  }

  private async coverImageProcessor(postId: string, coverImage: unknown) {
    const foundImage = await db.query.post_cover_image.findFirst({
      where: (table, fn) => fn.eq(table.post_id, postId)
    });

    if (process.env.NODE_ENV !== "production") {
      if (typeof coverImage === "string" && isNotEmpty(coverImage)) {
        if (!foundImage) {
          await db
            .insert(post_cover_image)
            .values({ public_id: randomUUID(), url: coverImage, post_id: postId });
        } else {
          await db
            .update(post_cover_image)
            .set({ public_id: randomUUID(), url: coverImage })
            .where(drizzle.eq(post_cover_image.post_id, postId));
        }
      }

      if (typeof coverImage === "string" && isEmpty(coverImage)) {
        await db.delete(post_cover_image).where(drizzle.eq(post_cover_image.post_id, postId));
      }
    }

    if (process.env.NODE_ENV === "production") {
      // if the coverImage exists, creates it (if doesn't yet) or updates
      if (typeof coverImage === "string" && isNotEmpty(coverImage)) {
        const result = await cloudinaryAPI.uploader.upload(coverImage, {
          public_id: foundImage?.public_id || undefined,
          folder: CLOUD_POSTS_IMAGE_REPOSITORY
        });

        if (!foundImage) {
          await db.insert(post_cover_image).values({
            public_id: result.public_id,
            url: result.secure_url,
            post_id: postId
          });
        } else {
          await db
            .update(post_cover_image)
            .set({ public_id: result.public_id, url: result.secure_url })
            .where(drizzle.eq(post_cover_image.post_id, postId));
        }

        // if the coverImage is empty, delete image on the cloud
        if (typeof coverImage === "string" && isEmpty(coverImage) && foundImage) {
          await cloudinaryAPI.uploader.destroy(foundImage.public_id, {
            invalidate: true
          });
          await db
            .delete(post_cover_image)
            .where(drizzle.eq(post_cover_image.post_id, postId));
        }
      }
    }
  }
}
