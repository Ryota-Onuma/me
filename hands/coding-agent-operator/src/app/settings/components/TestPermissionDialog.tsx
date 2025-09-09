"use client";

import { AlertTriangle, FileEdit, Terminal, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePermissionRequests } from "@/hooks/usePermissionRequests";
import type { PermissionRequest } from "@/lib/types/permission";

export function TestPermissionDialog() {
  const { addRequest } = usePermissionRequests();

  const createTestRequest = (
    severity: "low" | "medium" | "high",
    toolName: string,
    description: string,
    toolInput: Record<string, unknown>,
  ): PermissionRequest => ({
    id: Math.random().toString(36).substr(2, 9),
    sessionId: "test-session",
    toolName,
    toolUseId: `test-tool-use-${Math.random().toString(36).substr(2, 9)}`,
    toolInput,
    description,
    reason: `This is a test ${severity} severity permission request to demonstrate the dialog functionality.`,
    severity,
    timestamp: new Date(),
  });

  const testFileEdit = () => {
    addRequest(
      createTestRequest(
        "medium",
        "Edit",
        "Edit the main configuration file to update API endpoint settings",
        {
          file_path: "/Users/username/project/config.json",
          old_string: '"api_url": "http://localhost:3000"',
          new_string: '"api_url": "https://api.production.com"',
        },
      ),
    );
  };

  const testBashCommand = () => {
    addRequest(
      createTestRequest(
        "high",
        "Bash",
        "Execute a shell command to install a new package dependency",
        {
          command: "npm install --save-dev typescript @types/node",
          description: "Install TypeScript development dependencies",
        },
      ),
    );
  };

  const testLowRisk = () => {
    addRequest(
      createTestRequest(
        "low",
        "Read",
        "Read the contents of a configuration file to understand the current setup",
        {
          file_path: "/Users/username/project/package.json",
          limit: 100,
        },
      ),
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Test Permission Dialog
        </CardTitle>
        <CardDescription>
          Test the permission request dialog with different scenarios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            variant="outline"
            onClick={testLowRisk}
            className="flex items-center gap-2 h-auto p-3 flex-col"
          >
            <FileEdit className="h-4 w-4" />
            <div className="text-center">
              <div className="text-sm font-medium">Low Risk</div>
              <div className="text-xs text-muted-foreground">File Read</div>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={testFileEdit}
            className="flex items-center gap-2 h-auto p-3 flex-col"
          >
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <div className="text-center">
              <div className="text-sm font-medium">Medium Risk</div>
              <div className="text-xs text-muted-foreground">File Edit</div>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={testBashCommand}
            className="flex items-center gap-2 h-auto p-3 flex-col"
          >
            <Terminal className="h-4 w-4 text-red-500" />
            <div className="text-center">
              <div className="text-sm font-medium">High Risk</div>
              <div className="text-xs text-muted-foreground">Shell Command</div>
            </div>
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Click any button above to test the permission request dialog
        </div>
      </CardContent>
    </Card>
  );
}
