import { z } from "zod";

export const sendInvitationSchema = z.object({
  email: z.string().email(),
  libraryId: z.string().uuid(),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1),
});

export const revokeInvitationSchema = z.object({
  invitationId: z.string().uuid(),
});
