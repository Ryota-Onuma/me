import type { FC } from "react";
import type { UserMessageInputPayload } from "@/lib/api/types";
import { ChatInput, useNewChatMutation } from "../chatForm";

export const NewChat: FC<{
  projectId: string;
  onSuccess?: () => void;
}> = ({ projectId, onSuccess }) => {
  const startNewChat = useNewChatMutation(projectId, onSuccess);

  const handleSubmit = async (input: UserMessageInputPayload) => {
    await startNewChat.mutateAsync({ input });
  };

  return (
    <ChatInput
      projectId={projectId}
      onSubmit={handleSubmit}
      isPending={startNewChat.isPending}
      error={startNewChat.error}
      placeholder="Type your message here... (Start with / for commands, @ for files, Shift+Enter to send)"
      buttonText="Start Chat"
      minHeight="min-h-[200px]"
      containerClassName="space-y-4"
    />
  );
};
