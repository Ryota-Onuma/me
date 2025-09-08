import { z } from "zod";
import { ImageContentSchema } from "./ImageContentSchema";
import { InputImageContentSchema } from "./InputImageContentSchema";
import { TextContentSchema } from "./TextContentSchema";

export const ToolResultContentSchema = z.object({
  type: z.literal("tool_result"),
  tool_use_id: z.string(),
  content: z.union([
    z.string(),
    z.array(
      z.union([TextContentSchema, ImageContentSchema, InputImageContentSchema]),
    ),
  ]),
  is_error: z.boolean().optional(),
});

export type ToolResultContent = z.infer<typeof ToolResultContentSchema>;
