import { z } from "zod";

export const CommentSchema = z.object({
  content: z.string().max(512, "Comment too long.").min(3, "Comment too short."),
  replyId: z.string().uuid().nullable().optional()
});
