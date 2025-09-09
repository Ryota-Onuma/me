"use client";

import type { PermissionMode } from "@anthropic-ai/claude-code";
import { AlertTriangle, CheckCircle, Settings, Shield } from "lucide-react";
import { useId } from "react";
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
      <div className="space-y-1">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Permission Settings
        </h2>
        <p className="text-sm text-muted-foreground">Loading permission settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5" />
          Permission Settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Control how Claude Code handles permission requests
        </p>
      </div>

      {/* Current Active Mode */}
      <div className="border rounded-lg p-6">
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground font-medium">
            Currently Active Mode
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="p-3 rounded-lg bg-muted">
              {effectiveOption?.icon}
            </div>
            <div className="text-left">
              <div className="text-lg font-semibold">
                {effectiveOption?.label}
              </div>
              <div className="text-sm text-muted-foreground">
                {effectiveOption?.description}
              </div>
            </div>
          </div>
          {settings.globalBypass && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-800 bg-orange-100 rounded-full dark:text-orange-200 dark:bg-orange-900/30">
              <AlertTriangle className="h-3 w-3" />
              Override Active
            </div>
          )}
        </div>
      </div>

      {/* Quick Override Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <h3 className="font-semibold">Quick Override</h3>
        </div>
        
        <div className="border rounded-lg p-5">
          <div className="flex items-start gap-4">
            <Checkbox
              id={globalBypassId}
              checked={settings.globalBypass}
              onCheckedChange={(checked) => setGlobalBypass(!!checked)}
              disabled={isLoading}
              className="mt-0.5 cursor-pointer"
            />
            <div className="flex-1 space-y-2">
              <label
                htmlFor={globalBypassId}
                className="text-sm font-medium cursor-pointer hover:text-foreground transition-colors"
              >
                Always bypass all permissions (Dangerous)
              </label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automatically approves all Claude Code actions without asking. 
                Use only in trusted environments.
              </p>
            </div>
          </div>
          
          {settings.globalBypass && (
            <div className="mt-4 p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg dark:text-red-200 dark:bg-red-950/30 dark:border-red-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Security Warning</div>
                  <div>
                    All actions will be automatically approved without confirmation.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Default Permission Mode */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-blue-500" />
          <h3 className="font-semibold">Default Permission Mode</h3>
          {settings.globalBypass && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
              Overridden
            </span>
          )}
        </div>
        
        <div className="border rounded-lg p-5 space-y-4">
          <p className="text-sm text-muted-foreground text-left">
            Choose how Claude Code should handle permission requests when not overridden.
          </p>
          
          <Select
            value={settings.defaultMode}
            onValueChange={(value) => setPermissionMode(value as PermissionMode)}
            disabled={isLoading || settings.globalBypass}
          >
            <SelectTrigger className={`cursor-pointer ${settings.globalBypass ? "opacity-50 cursor-not-allowed" : ""}`}>
              <SelectValue>
                <div className="flex items-center gap-3">
                  {currentOption?.icon}
                  <span className="font-medium">{currentOption?.label}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PERMISSION_MODE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-shrink-0">{option.icon}</div>
                    <div className="text-left">
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {settings.globalBypass && (
            <p className="text-xs text-muted-foreground text-left">
              This setting is disabled while "Always bypass all permissions" is enabled.
            </p>
          )}
        </div>
      </div>

      {/* Permission Modes Guide */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Permission Modes Guide
        </h3>
        
        <div className="space-y-3">
          {PERMISSION_MODE_OPTIONS.map((option) => (
            <div key={option.value} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-default">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-md bg-muted">
                  {option.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{option.label}</h4>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md font-mono">
                      {option.value}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {option.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/20 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <div className="font-semibold text-blue-800 dark:text-blue-200 text-sm mb-1">
                💡 Tip
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Start with <strong>Default</strong> mode to understand Claude's actions, 
                then switch to <strong>Accept Edits</strong> for faster workflows.
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg dark:text-red-300 dark:bg-red-950/30 dark:border-red-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Failed to update settings: {error.message}</span>
        </div>
      )}
    </div>
  );
}