import type { PermissionMode } from "@anthropic-ai/claude-code";
import { honoClient } from "./client";

export type PermissionSettings = {
  defaultMode: PermissionMode;
  globalBypass: boolean;
};

export const permissionsApi = {
  getSettings: async (): Promise<PermissionSettings> => {
    const response = await honoClient.api.permissions.settings.$get();
    if (!response.ok) {
      throw new Error("Failed to fetch permission settings");
    }
    return response.json();
  },

  updateSettings: async (
    settings: Partial<PermissionSettings>,
  ): Promise<PermissionSettings> => {
    const response = await honoClient.api.permissions.settings.$post({
      json: settings,
    });
    if (!response.ok) {
      throw new Error("Failed to update permission settings");
    }
    const result = await response.json();
    return result.settings;
  },
};
