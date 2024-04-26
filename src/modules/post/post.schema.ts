import { z } from "zod";

export const createPostSchema = z.object({
  title: z
    .string({ required_error: "Title content is required" })
    .max(256, "Only 256 characters are allowed for titles.")
    .min(12, "Post title must have 12 or greater characters."),
  content: z
    .string({ required_error: "Post content is required" })
    .min(32, "Post content must be greater than 32 characters.")
    .max(24000, "Post content too long."),
  public: z.boolean().default(true),
  tags: z
    .array(z.string({ invalid_type_error: "Tags must be a string." }))
    .max(4, { message: "Only 4 tags are allowed." })
    .default([]),
  coverImage: z.string().optional()
});

export const updatePostSchema = z.object({
  title: z
    .string({ required_error: "Title content is required." })
    .max(256, "Only 256 characters are allowed for titles.")
    .min(12, "Post title must have 12 or greater characters.")
    .optional(),
  content: z
    .string({ required_error: "Post content is required." })
    .min(32, "Post content must be greater than 32 characters.")
    .max(24000, "Post content too long."),
  public: z.boolean().default(true).optional(),
  tags: z
    .array(z.string({ invalid_type_error: "Tags must be a string." }))
    .max(4, { message: "Only 4 tags are allowed." })
    .optional(),
  coverImage: z.string().optional()
});
