import { z } from "zod";

export const LoginValidationSchema = z.object({
  email: z
    .string({
      invalid_type_error: "Email must be a string",
      required_error: "Please provide your email."
    })
    .email({ message: "Provide a valid email" }),
  password: z
    .string({
      invalid_type_error: "Password must be a string",
      required_error: "Please provide your password."
    })
    .min(8, "Password must contain at least 8 characters")
});
