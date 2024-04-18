import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z
    .string({
      invalid_type_error: 'Email must be a string',
      required_error: 'Please provide your email.'
    })
    .email({ message: 'Provide a valid email' }),
  name: z
    .string({
      invalid_type_error: 'Name must be a string',
      required_error: 'Please provide your name.'
    })
    .min(5, { message: 'Name must have a minimum of 5 characters.' })
    .max(64, { message: 'Name must have less than 64 characters.' }),
  password: z
    .string({
      invalid_type_error: 'Password must be a string',
      required_error: 'Please provide your password.'
    })
    .min(8, 'Password must contain at least 8 characters')
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
      invalid_type_error: 'Password must be a string',
      required_error: 'Please provide your password.'
    })
    .min(8, 'Password must contain at least 8 characters')
    .optional(),
  birthday: z.coerce.string({ invalid_type_error: 'Invalid birthday value' }).optional(),
  profileImage: z.string().optional(),
  network: z.object({
    website: z.string().url('Please insert valid url.').optional().default(''),
    github: z.string().url('Please insert valid url.').optional().default(''),
    facebook: z.string().url('Please insert valid url.').optional().default(''),
    instagram: z.string().url('Please insert valid url.').optional().default(''),
    linkedin: z.string().url('Please insert valid url.').optional().default('')
  })
});
