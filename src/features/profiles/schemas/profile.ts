import { z } from "zod";

export const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const AVATAR_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  displayName: z.string().max(100).optional(),
  preferredLocale: z.enum(["en", "ar"]).optional(),
});

export const avatarUploadSchema = z
  .object({
    size: z.number().max(AVATAR_MAX_SIZE_BYTES),
    type: z.string(),
  })
  .superRefine(({ type }, context) => {
    if (
      !AVATAR_ALLOWED_MIME_TYPES.includes(
        type as (typeof AVATAR_ALLOWED_MIME_TYPES)[number],
      )
    ) {
      context.addIssue({
        code: "custom",
        message: "Unsupported file type.",
        path: ["type"],
      });
    }
  });
