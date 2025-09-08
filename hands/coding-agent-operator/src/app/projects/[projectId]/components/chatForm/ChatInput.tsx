import {
  AlertCircleIcon,
  Image as ImageIcon,
  LoaderIcon,
  SendIcon,
  XIcon,
} from "lucide-react";
import NextImage from "next/image";
import { type FC, useCallback, useId, useRef, useState } from "react";
import type { UserMessageInputPayload } from "@/lib/api/types";
import { Button } from "../../../../../components/ui/button";
import { Textarea } from "../../../../../components/ui/textarea";
import type { CommandCompletionRef } from "./CommandCompletion";
import { CommandsMenu } from "./CommandsMenu";
import type { FileCompletionRef } from "./FileCompletion";
import { InlineCompletion } from "./InlineCompletion";

export interface ChatInputProps {
  projectId: string;
  onSubmit: (input: UserMessageInputPayload) => Promise<void>;
  isPending: boolean;
  error?: Error | null;
  placeholder: string;
  buttonText: string;
  minHeight?: string;
  containerClassName?: string;
  disabled?: boolean;
  buttonSize?: "sm" | "default" | "lg";
}

export const ChatInput: FC<ChatInputProps> = ({
  projectId,
  onSubmit,
  isPending,
  error,
  placeholder,
  buttonText,
  minHeight = "min-h-[100px]",
  containerClassName = "",
  disabled = false,
  buttonSize = "lg",
}) => {
  const [message, setMessage] = useState("");
  const [droppedImages, setDroppedImages] = useState<
    {
      id: string;
      name: string;
      dataUrl: string;
      base64: string;
      mimeType: "image/png" | "image/jpeg" | "image/webp";
    }[]
  >([]);
  const [localErrors, setLocalErrors] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState<{
    relative: { top: number; left: number };
    absolute: { top: number; left: number };
  }>({ relative: { top: 0, left: 0 }, absolute: { top: 0, left: 0 } });

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commandCompletionRef = useRef<CommandCompletionRef>(null);
  const fileCompletionRef = useRef<FileCompletionRef>(null);
  const helpId = useId();

  const handleSubmit = async () => {
    const text = message.trim();
    if (!text && droppedImages.length === 0) return;

    const input: UserMessageInputPayload = {
      text: text || undefined,
      images:
        droppedImages.length > 0
          ? droppedImages.map((img) => ({
              data: img.base64,
              mimeType: img.mimeType,
            }))
          : undefined,
    };

    await onSubmit(input);
    setMessage("");
    setDroppedImages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (fileCompletionRef.current?.handleKeyDown(e)) {
      return;
    }

    if (commandCompletionRef.current?.handleKeyDown(e)) {
      return;
    }

    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const ALLOWED_MIME: ReadonlyArray<"image/png" | "image/jpeg" | "image/webp"> =
    ["image/png", "image/jpeg", "image/webp"];
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

  const handleFiles = async (files: File[]) => {
    const errors: string[] = [];
    const valid = files.filter((f) => {
      if (!ALLOWED_MIME.includes(f.type as (typeof ALLOWED_MIME)[number])) {
        errors.push(`${f.name}: 未対応形式 (${f.type || "unknown"})`);
        return false;
      }
      if (f.size > MAX_IMAGE_BYTES) {
        errors.push(
          `${f.name}: サイズ超過 (${(f.size / (1024 * 1024)).toFixed(1)}MB)`,
        );
        return false;
      }
      return true;
    });

    if (valid.length === 0) {
      if (errors.length > 0) setLocalErrors(errors);
      return;
    }

    const toDataUrl = (file: File) =>
      new Promise<{ dataUrl: string; base64: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = String(reader.result);
          const base64 = dataUrl.split(",")[1] || "";
          resolve({ dataUrl, base64 });
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

    const results = await Promise.all(valid.map((f) => toDataUrl(f)));
    const newItems: {
      id: string;
      name: string;
      dataUrl: string;
      base64: string;
      mimeType: (typeof ALLOWED_MIME)[number];
    }[] = [];
    for (const [i, f] of valid.entries()) {
      const r = results[i];
      if (!r) continue;
      newItems.push({
        id: `${f.name}-${f.size}-${i}-${Date.now()}`,
        name: f.name,
        dataUrl: r.dataUrl,
        base64: r.base64,
        mimeType: f.type as (typeof ALLOWED_MIME)[number],
      });
    }
    setDroppedImages((prev) => [...prev, ...newItems]);

    if (errors.length > 0) setLocalErrors(errors);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  };

  const removeImage = (id: string) => {
    setDroppedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const getCursorPosition = useCallback(() => {
    const textarea = textareaRef.current;
    const container = containerRef.current;
    if (textarea === null || container === null) return undefined;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPos);
    const textAfterCursor = textarea.value.substring(cursorPos);

    const pre = document.createTextNode(textBeforeCursor);
    const post = document.createTextNode(textAfterCursor);
    const caret = document.createElement("span");
    caret.innerHTML = "&nbsp;";

    const mirrored = document.createElement("div");

    mirrored.innerHTML = "";
    mirrored.append(pre, caret, post);

    const textareaStyles = window.getComputedStyle(textarea);
    for (const property of [
      "border",
      "boxSizing",
      "fontFamily",
      "fontSize",
      "fontWeight",
      "letterSpacing",
      "lineHeight",
      "padding",
      "textDecoration",
      "textIndent",
      "textTransform",
      "whiteSpace",
      "wordSpacing",
      "wordWrap",
    ] as const) {
      mirrored.style[property] = textareaStyles[property];
    }

    mirrored.style.visibility = "hidden";
    container.prepend(mirrored);

    const caretRect = caret.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    container.removeChild(mirrored);

    return {
      relative: {
        top: caretRect.top - containerRect.top - textarea.scrollTop,
        left: caretRect.left - containerRect.left - textarea.scrollLeft,
      },
      absolute: {
        top: caretRect.top - textarea.scrollTop,
        left: caretRect.left - textarea.scrollLeft,
      },
    };
  }, []);

  const handleCommandSelect = (command: string) => {
    setMessage(command);
    textareaRef.current?.focus();
  };

  const handleFileSelect = (filePath: string) => {
    setMessage(filePath);
    textareaRef.current?.focus();
  };

  const runCommandNow = async (cmdText: string) => {
    if (isPending || disabled) return;
    await onSubmit({ text: cmdText });
  };

  return (
    <section
      className={containerClassName}
      onDragOver={(e) => {
        // 画像ドロップのために必要
        e.preventDefault();
      }}
      onDrop={handleDrop}
      aria-label="Message input area"
    >
      {(error || localErrors.length > 0) && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md mb-4">
          <AlertCircleIcon className="w-4 h-4" />
          <span>
            {error ? "Failed to send message. Please try again." : null}
            {localErrors.length > 0 ? (
              <>
                {error ? " " : null}
                {localErrors.join(" / ")}
              </>
            ) : null}
          </span>
        </div>
      )}

      <div className="space-y-3">
        <div className="relative" ref={containerRef}>
          <Textarea
            ref={textareaRef}
            value={message}
            onPaste={async (e) => {
              const files = Array.from(e.clipboardData?.files ?? []);
              if (files.length > 0) {
                e.preventDefault();
                await handleFiles(files);
              }
            }}
            onChange={(e) => {
              if (
                e.target.value.endsWith("@") ||
                e.target.value.endsWith("/")
              ) {
                const position = getCursorPosition();
                if (position) {
                  setCursorPosition(position);
                }
              }

              setMessage(e.target.value);
              if (localErrors.length > 0) setLocalErrors([]);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`${minHeight} resize-none`}
            disabled={isPending || disabled}
            maxLength={4000}
            aria-label="Message input with completion support"
            aria-describedby={helpId}
            aria-expanded={message.startsWith("/") || message.includes("@")}
            aria-haspopup="listbox"
            role="combobox"
            aria-autocomplete="list"
          />
          {droppedImages.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {droppedImages.map((img) => (
                <li
                  key={img.id}
                  className="relative w-24 h-24 border rounded overflow-hidden bg-background list-none"
                >
                  <NextImage
                    src={img.dataUrl}
                    alt={img.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1 right-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/60 text-white"
                    aria-label={`Remove ${img.name}`}
                    title="Remove"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <InlineCompletion
            projectId={projectId}
            message={message}
            commandCompletionRef={commandCompletionRef}
            fileCompletionRef={fileCompletionRef}
            handleCommandSelect={handleCommandSelect}
            handleFileSelect={handleFileSelect}
            cursorPosition={cursorPosition}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground" id={helpId}>
            {message.length}/4000 characters " • Use arrow keys to navigate
            completions • PNG/JPEG/WebP ≤ 5MB • Drag & drop or paste"
          </span>

          <div className="flex items-center gap-2">
            <CommandsMenu
              projectId={projectId}
              onInsert={handleCommandSelect}
              onRun={runCommandNow}
            />
            <Button
              onClick={handleSubmit}
              disabled={
                (message.trim() === "" && droppedImages.length === 0) ||
                isPending ||
                disabled
              }
              size={buttonSize}
              className="gap-2"
            >
              {isPending ? (
                <>
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                  Sending... This may take a while.
                </>
              ) : (
                <>
                  {droppedImages.length > 0 ? (
                    <ImageIcon className="w-4 h-4" />
                  ) : (
                    <SendIcon className="w-4 h-4" />
                  )}
                  {buttonText}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
