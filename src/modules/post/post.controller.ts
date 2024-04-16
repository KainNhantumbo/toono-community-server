import Exception from '../../lib/app-exception';
import { db } from '../../database/client.database';
import {CLOUD_POSTS_IMAGE_REPOSITORY} from '../../shared/constants'
import { post_cover_image, posts, user_profile_image } from '../../database/schema.database';
import { cloudinaryAPI } from '../../config/cloudinary.config';
import type { Request, Response } from 'express';
import { isEmpty, isNotEmpty } from 'class-validator';
import { createPostSchema, updatePostSchema } from './post.schema';
import * as drizzle from 'drizzle-orm';
import { randomUUID } from 'crypto';

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
      columns: requestedColumns,
      offset: offset ? +offset : undefined,
      limit: limit ? +limit : undefined
    });
    res.status(200).json(posts);
  }

  async create(req: Request, res: Response): Promise<void> {
    const { session, ...rest } = req.body;
    const { coverImage, ...data } = await createPostSchema.parseAsync(rest);
    const [post] = await db
      .insert(posts)
      .values({ ...data, user_id: session.id })
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
    if (!post) throw new Exception('Post not found.', 404);

    await db.update(posts).set(data).where(drizzle.eq(posts.id, postId));
    if (coverImage) await this.coverImageProcessor(postId, coverImage);
    res.sendStatus(200);
  }

  async delete(req: Request, res: Response): Promise<void> {}

  private async coverImageProcessor(postId: string, coverImage: unknown) {
    const foundImage = await db.query.post_cover_image.findFirst({
      where: (table, fn) => fn.eq(table.post_id, postId)
    });

    if (process.env.NODE_ENV !== 'production') {
      if (typeof coverImage === 'string' && isNotEmpty(coverImage)) {
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

      if (typeof coverImage === 'string' && isEmpty(coverImage)) {
        await db.delete(post_cover_image).where(drizzle.eq(post_cover_image.post_id, postId));
      }
      return;
    }

    if (process.env.NODE_ENV === 'production') {
      // if the coverImage exists, creates it (if doesn't yet) or updates
      if (typeof coverImage === 'string' && isNotEmpty(coverImage)) {
        const result = await cloudinaryAPI.uploader.upload(coverImage, {
          public_id: foundImage?.public_id || undefined,
          folder: CLOUD_POSTS_IMAGE_REPOSITORY
        });

        if (!foundImage) {
          await db.insert(post_cover_image).values({
            public_id: result.public_id,
            url: result.secure_url,
            post_id:postId
          });
        } else {
          await db
            .update(post_cover_image)
            .set({ public_id: result.public_id, url: result.secure_url })
            .where(drizzle.eq(post_cover_image.post_id, postId));
        }

        // if the coverImage is empty, delete image on the cloud
        if (typeof coverImage === 'string' && isEmpty(coverImage) && foundImage) {
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
