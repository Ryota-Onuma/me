import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { PermissionSettings } from "./components/PermissionSettings";
import { TestPermissionDialog } from "./components/TestPermissionDialog";

export const metadata: Metadata = {
  title: "Settings | Claude Code Viewer",
  description: "Configure Claude Code permissions and settings",
};

export default function SettingsPage() {
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/projects" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </Link>
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure Claude Code permissions and behavior
          </p>
        </div>

        <div className="space-y-8">
          <PermissionSettings />
          <TestPermissionDialog />
        </div>
      </div>
    </div>
  );
}
