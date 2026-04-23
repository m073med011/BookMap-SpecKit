import "server-only";
import { envSchema, type EnvConfig } from "@/schemas/env";

export function validateEnv(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(`Invalid environment variables:\n${message}`);
  }

  return parsed.data;
}

export const env = validateEnv();
