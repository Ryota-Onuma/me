import { z } from "zod";
import { ImageContentSchema } from "../content/ImageContentSchema";
import { InputImageContentSchema } from "../content/InputImageContentSchema";
import { TextContentSchema } from "../content/TextContentSchema";
import { ToolResultContentSchema } from "../content/ToolResultContentSchema";

const UserMessageContentSchema = z.union([
  z.string(),
  TextContentSchema,
  ToolResultContentSchema,
  ImageContentSchema,
  InputImageContentSchema,
]);

export type UserMessageContent = z.infer<typeof UserMessageContentSchema>;

export const UserMessageSchema = z.object({
  role: z.literal("user"),
  content: z.union([
    z.string(),
    // Claude Code may serialize single block as object, or blocks as array
    UserMessageContentSchema,
    z.array(z.union([z.string(), UserMessageContentSchema])),
  ]),
});
