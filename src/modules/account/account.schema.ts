import { z } from "zod";

export const ForgotPasswordEmailSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email({ message: "Please enter a valid email." })
    .trim()
    .toLowerCase()
});

export const UpdateCredentialsSchema = z.object({
  password: z
    .string({
      invalid_type_error: "Password must be a string",
      required_error: "Please provide your password."
    })
    .min(8, "Password must contain at least 8 characters"),
  token: z.string({
    invalid_type_error: "Invalid token.",
    required_error: "Please provide a token"
  })
});
