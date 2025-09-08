export type SupportedImageMimeType = "image/png" | "image/jpeg" | "image/webp";

export type ImageAttachmentPayload = {
  data: string; // base64 without data URL prefix
  mimeType: SupportedImageMimeType;
};

export type UserMessageInputPayload = {
  text?: string;
  images?: ImageAttachmentPayload[];
};
