import { isEmpty, isNotEmpty, isUUID } from "class-validator";
import * as drizzle from "drizzle-orm";
import type { Request, Response } from "express";
import slugify from "slugify";
import { cloudinaryAPI } from "../../config/cloudinary.config";
import { db } from "../../database/client.database";
import { post_cover_image, posts } from "../../database/schema.database";
import Exception from "../../lib/app-exception";
import { readTime, sanitizer } from "../../lib/utils";
import { CLOUD_POSTS_IMAGE_REPOSITORY, POSTS_COLUMN_FIELDS } from "../../shared/constants";
import { createPostSchema, updatePostSchema } from "./post.schema";

export default class PostController {
  async findOnePublicPost(req: Request, res: Response): Promise<void> {
    const { slug } = req.params;
    const record = await db.query.posts.findFirst({
      where: (table, fn) => fn.and(fn.eq(table.slug, slug), fn.eq(table.public, true)),
      with: {
        claps: true,
        coverImage: { columns: { url: true } },
        user: {
          columns: { user_name: true, name: true, id: true },
          with: { profile_image: { columns: { url: true } } }
        },
        comments: { columns: { id: true } }
      }
    });

    if (!record) throw new Exception("Post not found.", 404);

    // update the number of visits
    await db
      .update(posts)
      .set({ visits: record.visits + 1 })
      .where(drizzle.eq(posts.slug, slug));

    res.status(200).json(record);
  }

  async findOneUserPost(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { session } = req.body;
    const post = await db.query.posts.findFirst({
      where: (table, fn) => fn.and(fn.eq(table.id, id), fn.eq(table.user_id, session.id)),
      with: { coverImage: { columns: { url: true } } }
    });
    if (!post) throw new Exception("Post not found.", 404);
    res.status(200).json(post);
  }

  async findAllUserPosts(req: Request, res: Response): Promise<void> {
    const { fields } = req.query;
    const { session } = req.body;
    let requestedColumns: Record<string, boolean> | undefined = {};

    if (isNotEmpty(fields) && typeof fields === "string") {
      requestedColumns = fields.split(",").reduce((acc, field) => {
        if (!Object.keys(POSTS_COLUMN_FIELDS).includes(field))
          return { ...acc, [field]: true };
        return acc;
      }, {});
    }
    const records = await db.query.posts.findMany({
      where: (table, fn) => fn.eq(table.user_id, session.id),
      orderBy: (table, fn) => fn.desc(table.updated_at),
      columns: { ...requestedColumns, public: true }
    });
    res.status(200).json(records);
  }

  async findAllPublicPosts(req: Request, res: Response): Promise<void> {
    const { search, offset, limit, sort, fields, userId } = req.query;
    let requestedColumns: Record<string, boolean> | undefined = {};

    if (isNotEmpty(fields) && typeof fields === "string") {
      requestedColumns = fields.split(",").reduce((acc, field) => {
        if (!Object.keys(POSTS_COLUMN_FIELDS).includes(field))
          return { ...acc, [field]: true };
        return acc;
      }, {});
    }

    const records = await db.query.posts.findMany({
      where:
        typeof search !== "string" || search === ""
          ? (table, fn) => fn.eq(table.public, true)
          : (table, fn) => {
              const arg = String(search);
              const query = fn.and(
                fn.or(fn.ilike(table.title, `%${arg}%`), fn.ilike(table.content, `%${arg}%`)),
                fn.eq(table.public, true)
              );

              if (typeof userId === "string" && isUUID(userId))
                return fn.and(fn.eq(table.user_id, userId), query);
              return query;
            },
      with: {
        claps: { columns: { id: true } },
        coverImage: { columns: { url: true } },
        user: {
          columns: { name: true, id: true },
          with: { profile_image: { columns: { url: true } } }
        },
        comments: { columns: { id: true } }
      },
      orderBy: (table, fn) => {
        const option = String(sort);
        switch (option) {
          case "popular":
            return fn.desc(table.visits);
          default:
            return fn.desc(table.created_at);
        }
      },
      columns: requestedColumns,
      offset: offset ? +offset : undefined,
      limit: limit ? +limit : undefined
    });
    res.status(200).json(records);
  }

  async create(req: Request, res: Response): Promise<void> {
    const { session, ...rest } = req.body;
    const { coverImage, content, title, ...data } = await createPostSchema.parseAsync(rest);

    const cleanContent = await sanitizer(content);
    const slug = slugify(title, { lower: true, locale: "en", trim: true });
    const { words: wordCount, text: readingTimeString } = await readTime(
      cleanContent.concat(title)
    );

    const postRecord = await db.query.posts.findFirst({
      where: (table, fn) => fn.eq(table.slug, slug)
    });
    if (postRecord) throw new Exception("A post with provided title, already found.", 409);

    const [post] = await db
      .insert(posts)
      .values({
        ...data,
        title,
        slug,
        content: cleanContent,
        user_id: session.id,
        read_time: readingTimeString,
        words: wordCount
      })
      .returning({ id: posts.id });

    await coverImageHandler(post.id, coverImage);
    res.sendStatus(201);
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id: postId } = req.params;
    const { session, ...rest } = req.body;
    const { coverImage, content, ...data } = await updatePostSchema.parseAsync(rest);

    const cleanContent = await sanitizer(content);
    const { words: wordCount, text: readingTimeString } = await readTime(
      cleanContent.concat(data.title ?? "")
    );

    const post = await db.query.posts.findFirst({
      where: (table, fn) => fn.and(fn.eq(table.id, postId), fn.eq(table.user_id, session.id)),
      columns: { id: true }
    });
    if (!post) throw new Exception("Post not found.", 404);

    await db
      .update(posts)
      .set({ ...data, words: wordCount, read_time: readingTimeString, content: cleanContent })
      .where(drizzle.and(drizzle.eq(posts.id, postId), drizzle.eq(posts.user_id, session.id)));

    await coverImageHandler(postId, coverImage);
    res.sendStatus(200);
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id: postId } = req.params;
    const { session } = req.body;
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
      .where(drizzle.and(drizzle.eq(posts.id, postId), drizzle.eq(posts.user_id, session.id)))
      .returning({ id: posts.id });

    if (!record) throw new Exception("Error while deleting your post.", 400);
    res.sendStatus(204);
  }
}

async function coverImageHandler(postId: string, coverImage: unknown) {
  if (typeof coverImage !== "string") throw new Exception("Invalid cover image", 400);

  const foundImage = await db.query.post_cover_image.findFirst({
    where: (table, fn) => fn.eq(table.post_id, postId)
  });

  // if the coverImage is empty, delete image on the cloud
  if (isEmpty(coverImage) && foundImage) {
    await cloudinaryAPI.uploader.destroy(foundImage.public_id, {
      invalidate: true
    });
    await db.delete(post_cover_image).where(drizzle.eq(post_cover_image.post_id, postId));
    return;
  }

  const res = await cloudinaryAPI.uploader.upload(coverImage, {
    public_id: foundImage?.public_id || undefined,
    folder: CLOUD_POSTS_IMAGE_REPOSITORY
  });

  if (!foundImage) {
    return await db.insert(post_cover_image).values({
      public_id: res.public_id,
      url: res.secure_url,
      post_id: postId
    });
  }
  return await db
    .update(post_cover_image)
    .set({ public_id: res.public_id, url: res.secure_url })
    .where(drizzle.eq(post_cover_image.post_id, postId));
}
