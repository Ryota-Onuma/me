import type { PermissionMode } from "@anthropic-ai/claude-code";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type PermissionSettings, permissionsApi } from "@/lib/api/permissions";

export const usePermissionSettings = () => {
  return useQuery({
    queryKey: ["permission-settings"],
    queryFn: permissionsApi.getSettings,
    staleTime: 1000 * 60 * 5, // 5分間キャッシュ
  });
};

export const useUpdatePermissionSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<PermissionSettings>) =>
      permissionsApi.updateSettings(settings),
    onSuccess: (newSettings) => {
      queryClient.setQueryData(["permission-settings"], newSettings);
    },
    onError: (error) => {
      console.error("Failed to update permission settings:", error);
    },
  });
};

export const usePermissionMode = () => {
  const { data: settings } = usePermissionSettings();
  const updateMutation = useUpdatePermissionSettings();

  const setPermissionMode = (mode: PermissionMode) => {
    updateMutation.mutate({ defaultMode: mode });
  };

  const setGlobalBypass = (bypass: boolean) => {
    updateMutation.mutate({ globalBypass: bypass });
  };

  const effectiveMode = settings?.globalBypass
    ? "bypassPermissions"
    : settings?.defaultMode;

  return {
    settings,
    effectiveMode,
    setPermissionMode,
    setGlobalBypass,
    isLoading: updateMutation.isPending,
    error: updateMutation.error,
  };
};
