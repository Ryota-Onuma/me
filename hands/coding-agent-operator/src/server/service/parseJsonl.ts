import { ConversationSchema } from "../../lib/conversation-schema";
import type { ErrorJsonl } from "./types";

export const parseJsonl = (content: string) => {
  const lines = content
    .trim()
    .split("\n")
    .filter((line) => line.trim() !== "");

  return lines.map((line, index) => {
    let data: unknown;
    try {
      data = JSON.parse(line);
    } catch (jsonError) {
      console.warn(
        `Failed to parse JSON on line ${index + 1}:`,
        jsonError instanceof Error ? jsonError.message : String(jsonError),
      );
      const errorData: ErrorJsonl = {
        type: "x-error",
        line,
      };
      return errorData;
    }

    const parsed = ConversationSchema.safeParse(data);
    if (!parsed.success) {
      const errors = parsed.error.issues || [];
      console.warn(
        `Failed to validate line ${index + 1} (type: ${(data as { type?: string })?.type || "unknown"}):`,
        errors
          .slice(0, 5)
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", "),
      );
      console.warn(
        "Specific errors:",
        JSON.stringify(errors.slice(0, 3), null, 2),
      );
      console.warn(
        "Raw data:",
        JSON.stringify(data, null, 2).slice(0, 500) +
          (JSON.stringify(data).length > 500 ? "..." : ""),
      );
      const errorData: ErrorJsonl = {
        type: "x-error",
        line,
      };
      return errorData;
    }

    return parsed.data;
  });
};
