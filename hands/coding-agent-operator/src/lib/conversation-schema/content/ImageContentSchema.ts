import { z } from "zod";

// Support both formats for image content:
// 1. Standard format with source object
// 2. Direct format with data field (legacy/alternative format)
export const ImageContentSchema = z.union([
  z.object({
    type: z.literal("image"),
    source: z.object({
      type: z.literal("base64"),
      data: z.string(),
      media_type: z.enum(["image/png", "image/jpeg", "image/webp"]),
    }),
  }),
  z.object({
    type: z.literal("image"),
    data: z.string(),
  }),
]);
