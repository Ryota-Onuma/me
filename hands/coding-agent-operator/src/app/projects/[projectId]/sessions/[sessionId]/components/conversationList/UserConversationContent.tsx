import { Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import type { FC } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UserMessageContent } from "@/lib/conversation-schema/message/UserMessageSchema";
import { UserTextContent } from "./UserTextContent";

export const UserConversationContent: FC<{
  content: UserMessageContent;
  id?: string;
}> = ({ content, id }) => {
  if (typeof content === "string") {
    return <UserTextContent text={content} id={id} />;
  }

  if (content.type === "text") {
    return <UserTextContent text={content.text} id={id} />;
  }

  if (content.type === "image") {
    // Handle both formats: { source: {...} } and { data: "..." }
    const imageData =
      "source" in content
        ? content.source.data
        : "data" in content
          ? content.data
          : null;
    const mediaType =
      "source" in content ? content.source.media_type : "image/png"; // default for legacy format

    if (
      imageData &&
      ("source" in content ? content.source.type === "base64" : true)
    ) {
      return (
        <Card
          className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20"
          id={id}
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <CardTitle className="text-sm font-medium">Image</CardTitle>
              <Badge
                variant="outline"
                className="border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-300"
              >
                {mediaType}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              User uploaded image content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden bg-background">
              <Image
                src={`data:${mediaType};base64,${imageData}`}
                alt="User uploaded content"
                width={500}
                height={300}
                className="max-w-full h-auto max-h-96 object-contain"
                style={{ width: "auto", height: "auto" }}
              />
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  return (
    <Card
      className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
      id={id}
    >
      <CardHeader>
        <CardTitle className="text-sm text-red-600 dark:text-red-400">
          Unsupported content type
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs text-muted-foreground overflow-auto">
          {JSON.stringify(content, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
};
