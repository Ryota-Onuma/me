import { useCallback, useMemo } from "react";
import { useSessionQuery } from "./useSessionQuery";

export const useSession = (projectId: string, sessionId: string) => {
  const query = useSessionQuery(projectId, sessionId);

  const toolResultMap = useMemo(() => {
    const entries = query.data.session.conversations.flatMap((conversation) => {
      if (conversation.type !== "user") return [] as Array<[string, any]>;
      const c = conversation.message.content as unknown;
      const list = Array.isArray(c) ? c : typeof c === "string" ? [] : [c];
      return list.flatMap((message: any) =>
        message && message.type === "tool_result"
          ? ([[message.tool_use_id, message] as const] as const)
          : [],
      );
    });
    return new Map(entries);
  }, [query.data.session.conversations]);

  const getToolResult = useCallback(
    (toolUseId: string) => {
      return toolResultMap.get(toolUseId);
    },
    [toolResultMap],
  );

  return {
    session: query.data.session,
    conversations: query.data.session.conversations,
    getToolResult,
  };
};
