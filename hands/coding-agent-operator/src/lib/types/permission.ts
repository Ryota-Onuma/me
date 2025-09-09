export type PermissionRequest = {
  id: string;
  sessionId: string;
  toolName: string;
  toolUseId: string;
  toolInput: Record<string, unknown>;
  description: string;
  reason?: string;
  severity: "low" | "medium" | "high";
  timestamp: Date;
};

export type PermissionResponse = {
  requestId: string;
  decision: "allow" | "deny";
  remember?: boolean;
  reason?: string;
};

export type PermissionRule = {
  toolName: string;
  pattern?: string;
  decision: "allow" | "deny" | "ask";
  scope: "session" | "project" | "global";
};
