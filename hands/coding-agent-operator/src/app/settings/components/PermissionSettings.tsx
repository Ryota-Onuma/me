"use client";

import type { PermissionMode } from "@anthropic-ai/claude-code";
import { AlertTriangle, CheckCircle, Settings, Shield } from "lucide-react";
import { useId } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermissionMode } from "@/hooks/usePermissionSettings";

const PERMISSION_MODE_OPTIONS: Array<{
  value: PermissionMode;
  label: string;
  description: string;
  icon: React.ReactNode;
  variant: "default" | "secondary" | "destructive";
}> = [
  {
    value: "default",
    label: "Default",
    description: "Ask for permission on each action",
    icon: <Shield className="h-4 w-4" />,
    variant: "default",
  },
  {
    value: "acceptEdits",
    label: "Accept Edits",
    description: "Auto-approve file edits, ask for other actions",
    icon: <CheckCircle className="h-4 w-4" />,
    variant: "secondary",
  },
  {
    value: "bypassPermissions",
    label: "Bypass Permissions",
    description: "Auto-approve all actions (use with caution)",
    icon: <AlertTriangle className="h-4 w-4" />,
    variant: "destructive",
  },
  {
    value: "plan",
    label: "Plan Mode",
    description: "Generate plans without executing actions",
    icon: <Settings className="h-4 w-4" />,
    variant: "secondary",
  },
];

export function PermissionSettings() {
  const globalBypassId = useId();
  const {
    settings,
    effectiveMode,
    setPermissionMode,
    setGlobalBypass,
    isLoading,
    error,
  } = usePermissionMode();

  const currentOption = PERMISSION_MODE_OPTIONS.find(
    (option) => option.value === settings?.defaultMode,
  );

  const effectiveOption = PERMISSION_MODE_OPTIONS.find(
    (option) => option.value === effectiveMode,
  );

  if (!settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permission Settings
          </CardTitle>
          <CardDescription>Loading permission settings...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permission Settings
          </CardTitle>
          <CardDescription>
            Control how Claude Code handles permission requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* 現在の有効モード表示 */}
          <div className="p-6 border-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <div className="text-center space-y-3">
              <div className="text-sm text-muted-foreground font-medium">
                Currently Active Mode
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="p-3 rounded-full bg-background shadow-sm">
                  {effectiveOption?.icon}
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-foreground">
                    {effectiveOption?.label}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {effectiveOption?.description}
                  </div>
                </div>
              </div>
              {settings.globalBypass && (
                <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-orange-700 bg-orange-100 border border-orange-300 rounded-full dark:text-orange-300 dark:bg-orange-900/30 dark:border-orange-700">
                  <AlertTriangle className="h-3 w-3" />
                  Global Override Active
                </div>
              )}
            </div>
          </div>

          {/* グローバルバイパス設定 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-semibold">Quick Override</h3>
            </div>
            <div className="p-4 border rounded-lg space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id={globalBypassId}
                  checked={settings.globalBypass}
                  onCheckedChange={(checked) => setGlobalBypass(!!checked)}
                  disabled={isLoading}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <label
                    htmlFor={globalBypassId}
                    className="text-sm font-medium leading-none cursor-pointer hover:underline"
                  >
                    Always bypass all permissions (Dangerous)
                  </label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    When enabled, this overrides any setting below and
                    automatically approves <strong>ALL</strong> Claude Code
                    actions without asking. This includes file modifications,
                    command execution, and network requests.
                  </p>
                </div>
              </div>
              {settings.globalBypass && (
                <div className="flex items-start gap-3 p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md dark:text-red-200 dark:bg-red-950/30 dark:border-red-800">
                  <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <div className="font-semibold">⚠️ Security Warning</div>
                    <div>
                      Claude Code will automatically approve ALL actions without
                      confirmation. Use this only in trusted environments where
                      you understand the risks.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* デフォルトモード設定 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Default Permission Mode</h3>
              {settings.globalBypass && (
                <Badge variant="outline" className="text-xs bg-muted">
                  Overridden by Quick Override
                </Badge>
              )}
            </div>
            <div className="p-4 border rounded-lg space-y-3">
              <p className="text-sm text-muted-foreground">
                Choose how Claude Code should handle permission requests when
                not overridden.
              </p>
              <Select
                value={settings.defaultMode}
                onValueChange={(value) =>
                  setPermissionMode(value as PermissionMode)
                }
                disabled={isLoading || settings.globalBypass}
              >
                <SelectTrigger
                  className={`${settings.globalBypass ? "opacity-50" : ""}`}
                >
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {currentOption?.icon}
                      <span className="font-medium">
                        {currentOption?.label}
                      </span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PERMISSION_MODE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-3 py-1">
                        <div className="flex-shrink-0">{option.icon}</div>
                        <div className="flex flex-col text-left">
                          <span className="font-medium text-sm">
                            {option.label}
                          </span>
                          <span className="text-xs text-muted-foreground leading-tight">
                            {option.description}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {settings.globalBypass && (
                <div className="text-xs text-muted-foreground italic">
                  This setting is currently disabled because "Always bypass all
                  permissions" is enabled above.
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md dark:text-red-300 dark:bg-red-950/30 dark:border-red-800">
              <AlertTriangle className="h-4 w-4" />
              Failed to update settings: {error.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 説明カード */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permission Modes Guide
          </CardTitle>
          <CardDescription>
            Understanding how each mode affects Claude Code's behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            {PERMISSION_MODE_OPTIONS.map((option) => (
              <div
                key={option.value}
                className="group hover:bg-muted/30 transition-colors p-4 border-2 rounded-xl"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-background shadow-sm group-hover:shadow-md transition-shadow">
                    {option.icon}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-semibold">{option.label}</h4>
                      <Badge
                        variant={option.variant}
                        className="text-xs font-medium"
                      >
                        {option.value}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {option.description}
                    </p>
                    {/* より詳しい説明を追加 */}
                    <div className="text-xs text-muted-foreground/70 space-y-1">
                      {option.value === "default" && (
                        <div>
                          • Best for beginners or when working with sensitive
                          files
                        </div>
                      )}
                      {option.value === "acceptEdits" && (
                        <div>
                          • Good balance between productivity and safety
                        </div>
                      )}
                      {option.value === "bypassPermissions" && (
                        <div>
                          • Use only in trusted environments or for repetitive
                          tasks
                        </div>
                      )}
                      {option.value === "plan" && (
                        <div>
                          • Perfect for reviewing what Claude would do before
                          execution
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/20 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <div className="font-semibold text-blue-800 dark:text-blue-200">
                  💡 Pro Tip
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                  Start with <strong>Default</strong> mode to understand what
                  Claude is doing, then switch to <strong>Accept Edits</strong>{" "}
                  for better productivity. Use <strong>Plan</strong> mode when
                  you want to review complex changes before execution.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
