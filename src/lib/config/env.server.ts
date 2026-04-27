import "server-only";
import { serverEnvSchema, type ServerEnvConfig } from "@/schemas/env";

export function validateServerEnv(): ServerEnvConfig {
  const parsed = serverEnvSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPERADMIN_EMAIL: process.env.SUPERADMIN_EMAIL,
  });

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(`Invalid environment variables:\n${message}`);
  }

  return parsed.data;
}

export const serverEnv = validateServerEnv();
