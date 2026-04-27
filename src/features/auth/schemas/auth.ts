import { z } from "zod";

export const passwordStrengthRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const passwordSchema = z
  .string()
  .min(8)
  .regex(passwordStrengthRegex, {
    message:
      "Password must include at least one uppercase letter, one lowercase letter, and one number.",
  });

export const signUpSchema = z.object({
  email: z.string().email(),
  locale: z.enum(["en", "ar"]),
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const resetPasswordRequestSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  code: z.string().min(1),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
  type: z.enum(["otp", "link"]),
});
