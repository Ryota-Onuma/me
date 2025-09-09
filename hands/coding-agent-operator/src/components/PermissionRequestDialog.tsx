"use client";

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileEdit,
  Globe,
  Shield,
  Terminal,
  X,
} from "lucide-react";
import { useId, useState } from "react";
import type {
  PermissionRequest,
  PermissionResponse,
} from "@/lib/types/permission";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";

type Props = {
  request: PermissionRequest | null;
  isOpen: boolean;
  onResponse: (response: PermissionResponse) => void;
  onClose: () => void;
};

const TOOL_ICONS: Record<string, React.ReactNode> = {
  Edit: <FileEdit className="h-5 w-5" />,
  Read: <FileEdit className="h-5 w-5" />,
  Write: <FileEdit className="h-5 w-5" />,
  Bash: <Terminal className="h-5 w-5" />,
  WebFetch: <Globe className="h-5 w-5" />,
  default: <Shield className="h-5 w-5" />,
};

const SEVERITY_CONFIG = {
  low: {
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/20",
    border: "border-green-200 dark:border-green-800",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  medium: {
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-orange-200 dark:border-orange-800",
    icon: <Clock className="h-4 w-4" />,
  },
  high: {
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-200 dark:border-red-800",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
};

export function PermissionRequestDialog({
  request,
  isOpen,
  onResponse,
  onClose,
}: Props) {
  const rememberCheckboxId = useId();
  const reasonTextareaId = useId();
  const [remember, setRemember] = useState(false);
  const [reason, setReason] = useState("");

  if (!request) return null;

  const severityConfig = SEVERITY_CONFIG[request.severity];
  const toolIcon = TOOL_ICONS[request.toolName] || TOOL_ICONS['default'];

  const handleResponse = (decision: "allow" | "deny") => {
    onResponse({
      requestId: request.id,
      decision,
      remember,
      reason: reason.trim() || undefined,
    });

    // Reset form
    setRemember(false);
    setReason("");
    onClose();
  };

  const formatToolInput = (input: Record<string, unknown>) => {
    return Object.entries(input)
      .slice(0, 3) // Show only first 3 parameters
      .map(([key, value]) => {
        let displayValue = String(value);
        if (displayValue.length > 100) {
          displayValue = `${displayValue.slice(0, 100)}...`;
        }
        return `${key}: ${displayValue}`;
      })
      .join("\\n");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${severityConfig.bg}`}>
              {toolIcon}
            </div>
            <div className="flex-1">
              <div>Permission Request</div>
              <div className="text-sm font-normal text-muted-foreground">
                Claude Code wants to use:{" "}
                <span className="font-mono font-medium">
                  {request.toolName}
                </span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Severity Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${severityConfig.color} ${severityConfig.bg} ${severityConfig.border} border`}
          >
            {severityConfig.icon}
            <span className="capitalize">{request.severity} Risk</span>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-medium text-sm mb-2">
              What Claude wants to do:
            </h4>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm leading-relaxed">{request.description}</p>
            </div>
          </div>

          {/* Tool Details */}
          <div>
            <h4 className="font-medium text-sm mb-2">Tool Details:</h4>
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="text-xs text-muted-foreground">Tool Name:</div>
              <div className="font-mono text-sm">{request.toolName}</div>

              {Object.keys(request.toolInput).length > 0 && (
                <>
                  <div className="text-xs text-muted-foreground mt-2">
                    Parameters:
                  </div>
                  <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-32 whitespace-pre-wrap break-words">
                    {formatToolInput(request.toolInput)}
                  </pre>
                </>
              )}
            </div>
          </div>

          {/* Reason from Claude */}
          {request.reason && (
            <div>
              <h4 className="font-medium text-sm mb-2">Claude's Reasoning:</h4>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed break-words">
                  {request.reason}
                </p>
              </div>
            </div>
          )}

          {/* Remember Choice */}
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id={rememberCheckboxId}
              checked={remember}
              onCheckedChange={(checked) => setRemember(!!checked)}
            />
            <label
              htmlFor={rememberCheckboxId}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Remember this decision for similar requests in this session
            </label>
          </div>

          {/* Optional Reason */}
          <div>
            <label
              htmlFor={reasonTextareaId}
              className="text-sm font-medium mb-2 block"
            >
              Add a note (optional):
            </label>
            <Textarea
              id={reasonTextareaId}
              placeholder="Why are you allowing/denying this request?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-sm"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleResponse("deny")}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <X className="h-4 w-4" />
            Deny
          </Button>
          <Button
            onClick={() => handleResponse("allow")}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Allow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
