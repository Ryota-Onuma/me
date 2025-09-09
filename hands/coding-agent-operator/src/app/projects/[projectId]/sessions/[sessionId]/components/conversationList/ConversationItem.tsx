import type { FC } from "react";
import type { Conversation } from "@/lib/conversation-schema";
import type { ToolResultContent } from "@/lib/conversation-schema/content/ToolResultContentSchema";
import { SidechainConversationModal } from "../conversationModal/SidechainConversationModal";
import { AssistantConversationContent } from "./AssistantConversationContent";
import { MetaConversationContent } from "./MetaConversationContent";
import { SummaryConversationContent } from "./SummaryConversationContent";
import { SystemConversationContent } from "./SystemConversationContent";
import { UserConversationContent } from "./UserConversationContent";

export const ConversationItem: FC<{
  conversation: Conversation;
  getToolResult: (toolUseId: string) => ToolResultContent | undefined;
  isRootSidechain: (conversation: Conversation) => boolean;
  getSidechainConversations: (rootUuid: string) => Conversation[];
}> = ({
  conversation,
  getToolResult,
  isRootSidechain,
  getSidechainConversations,
}) => {
  if (conversation.type === "summary") {
    return (
      <SummaryConversationContent>
        {conversation.summary}
      </SummaryConversationContent>
    );
  }

  if (conversation.type === "system") {
    return (
      <SystemConversationContent>
        {conversation.content}
      </SystemConversationContent>
    );
  }

  // sidechain = サブタスクのこと
  if (conversation.isSidechain) {
    // Root 以外はモーダルで中身を表示するのでここでは描画しない
    if (!isRootSidechain(conversation)) {
      return null;
    }

    return (
      <SidechainConversationModal
        conversation={conversation}
        sidechainConversations={getSidechainConversations(
          conversation.uuid,
        ).map((original) => {
          if (original.type === "summary") return original;
          return {
            ...original,
            isSidechain: false,
          };
        })}
        getToolResult={getToolResult}
      />
    );
  }

  if (conversation.type === "user") {
    const content = conversation.message.content;
    const userConversationJsx = (() => {
      if (typeof content === "string") {
        return (
          <UserConversationContent
            content={content}
            id={`message-${conversation.uuid}`}
          />
        );
      }
      if (Array.isArray(content)) {
        return (
          <ul className="w-full" id={`message-${conversation.uuid}`}>
            {content.map((c, index) => (
              <li
                key={
                  typeof c === "string"
                    ? `${index}-${c}`
                    : `${index}-${JSON.stringify(c).slice(0, 50)}`
                }
              >
                <UserConversationContent content={c} />
              </li>
            ))}
          </ul>
        );
      }
      return (
        <UserConversationContent
          content={content}
          id={`message-${conversation.uuid}`}
        />
      );
    })();

    return conversation.isMeta === true ? (
      // 展開可能にしてデフォで非展開
      <MetaConversationContent>{userConversationJsx}</MetaConversationContent>
    ) : (
      userConversationJsx
    );
  }

  if (conversation.type === "assistant") {
    return (
      <ul className="w-full">
        {conversation.message.content.map((content) => (
          <li key={content.toString()}>
            <AssistantConversationContent
              content={content}
              getToolResult={getToolResult}
            />
          </li>
        ))}
      </ul>
    );
  }

  return null;
};
