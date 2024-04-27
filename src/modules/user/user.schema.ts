import { z } from "zod";

export const CreateUserSchema = z.object({
  email: z
    .string({
      invalid_type_error: "Email must be a string",
      required_error: "Please provide your email."
    })
    .email({ message: "Provide a valid email" }),
  name: z
    .string({
      invalid_type_error: "Name must be a string",
      required_error: "Please provide your name."
    })
    .min(5, { message: "Name must have a minimum of 5 characters." })
    .max(64, { message: "Name must have less than 64 characters." }),
  password: z
    .string({
      invalid_type_error: "Password must be a string",
      required_error: "Please provide your password."
    })
    .min(8, "Password must contain at least 8 characters")
});

export const UpdateUserSchema = z.object({
  name: z.string().max(64).optional(),
  user_name: z.string().max(32).optional(),
  biography: z.string().max(128).optional(),
  work: z.string().max(256).optional(),
  education: z.string().max(256).optional(),
  learning: z.string().max(256).optional(),
  available: z.string().max(256).optional(),
  location: z.string().max(128).optional(),
  password: z
    .string({
      invalid_type_error: "Password must be a string"
    })
    .optional()
    .transform((data) => {
      if (data && data.length >= 8) return data;
      return undefined;
    }),
  birthday: z.string().datetime().nullable().optional(),
  profileImage: z.string().optional(),
  network: z.object({
    website: z.string().optional(),
    github: z.string().optional(),
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    linkedin: z.string().optional()
  })
});
