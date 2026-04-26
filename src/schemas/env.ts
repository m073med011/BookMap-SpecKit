import { z } from "zod";

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url({ message: "NEXT_PUBLIC_SUPABASE_URL must be a valid URL" }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, { message: "NEXT_PUBLIC_SUPABASE_ANON_KEY is required" }),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url({ message: "NEXT_PUBLIC_SITE_URL must be a valid URL" })
    .default("http://localhost:3000"),
});

export const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, { message: "SUPABASE_SERVICE_ROLE_KEY is required" }),
  SUPERADMIN_EMAIL: z
    .string()
    .email({ message: "SUPERADMIN_EMAIL must be a valid email" })
    .optional(),
});

export const envSchema = serverEnvSchema;

export type PublicEnvConfig = z.infer<typeof publicEnvSchema>;
export type ServerEnvConfig = z.infer<typeof serverEnvSchema>;
export type EnvConfig = ServerEnvConfig;
