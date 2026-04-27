import { z } from "zod";

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));

const languageSchema = z.enum(["en", "ar"]);

export const LOGO_MAX_SIZE_BYTES = 2 * 1024 * 1024;
export const BANNER_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const createLibrarySchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  description: optionalTrimmedString(5000),
  contactEmail: z
    .email()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  contactPhone: optionalTrimmedString(30),
  address: optionalTrimmedString(500),
  languages: z.array(languageSchema).min(1).optional().default(["en"]),
});

export const updateLibrarySchema = z.object({
  libraryId: z.uuid(),
  name: z.string().trim().min(2).max(200).optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  description: optionalTrimmedString(5000),
  contactEmail: z
    .email()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  contactPhone: optionalTrimmedString(30),
  address: optionalTrimmedString(500),
  languages: z.array(languageSchema).min(1).optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),
  policies: z.record(z.string(), z.string()).optional(),
});

export const submitLibrarySchema = z.object({
  libraryId: z.uuid(),
});

export const resubmitLibrarySchema = z.object({
  libraryId: z.uuid(),
});

export const moderationSchema = z
  .object({
    libraryId: z.uuid(),
    action: z.enum([
      "approve",
      "reject",
      "suspend",
      "reactivate",
      "archive",
    ]),
    reason: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined)),
  })
  .superRefine((value, ctx) => {
    if (
      (value.action === "reject" || value.action === "suspend") &&
      !value.reason
    ) {
      ctx.addIssue({
        code: "custom",
        message: "A reason is required for this moderation action.",
        path: ["reason"],
      });
    }
  });

export const staffManagementSchema = z
  .object({
    libraryId: z.uuid(),
    action: z.enum(["invite", "remove", "promote", "demote"]),
    userId: z.uuid().optional(),
    email: z
      .email()
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined)),
  })
  .superRefine((value, ctx) => {
    if (value.action === "invite" && !value.email) {
      ctx.addIssue({
        code: "custom",
        message: "Email is required to invite staff.",
        path: ["email"],
      });
    }

    if (value.action !== "invite" && !value.userId) {
      ctx.addIssue({
        code: "custom",
        message: "User ID is required for this action.",
        path: ["userId"],
      });
    }
  });

export const librarySettingsSchema = z.object({
  libraryId: z.uuid(),
  shippingPreferences: z.record(z.string(), z.unknown()).optional(),
  returnPolicy: optionalTrimmedString(5000),
  operatingHours: z.record(z.string(), z.unknown()).optional(),
});

export const assetUploadSchema = z.object({
  type: z.enum(["logo", "banner"]),
});
