import { z } from "zod";

export const InputImageContentSchema = z.object({
  type: z.literal("image"),
  source: z.object({
    type: z.literal("base64"),
    data: z.string(),
    media_type: z.enum(["image/png", "image/jpeg", "image/webp"]),
  }),
});

export type InputImageContent = z.infer<typeof InputImageContentSchema>;
