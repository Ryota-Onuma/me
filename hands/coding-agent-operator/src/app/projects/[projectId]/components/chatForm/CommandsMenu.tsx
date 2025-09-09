"use client";

import { useQuery } from "@tanstack/react-query";
import { TerminalIcon } from "lucide-react";
import { useState } from "react";
import { honoClient } from "@/lib/api/client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select";

type Props = {
  projectId: string;
  onInsert: (commandText: string) => void;
};

export function CommandsMenu({ projectId, onInsert }: Props) {
  const [current, setCurrent] = useState<string>("");

  const { data } = useQuery({
    queryKey: ["claude-commands", projectId],
    queryFn: async () => {
      const res = await honoClient.api.projects[":projectId"][
        "claude-commands"
      ].$get({ param: { projectId } });
      if (!res.ok) throw new Error("Failed to fetch commands");
      return res.json() as Promise<{
        defaultCommands: string[];
        globalCommands: string[];
        projectCommands: string[];
      }>;
    },
    staleTime: 1000 * 60 * 5,
  });

  const insert = (cmd: string) => {
    setCurrent(cmd);
    onInsert(`/${cmd} `);
  };

  const defaults = data?.defaultCommands ?? [];
  const globals = data?.globalCommands ?? [];
  const projects = data?.projectCommands ?? [];

  const disabled = defaults.length + globals.length + projects.length === 0;

  return (
    <div className="flex items-center gap-2">
      <Select
        value={current || undefined}
        onValueChange={(v) => insert(v)}
        disabled={disabled}
      >
        <SelectTrigger className="w-44" aria-label="Commands">
          <div className="flex items-center gap-1 text-muted-foreground">
            <TerminalIcon className="w-4 h-4" />
            <SelectValue placeholder="Commands" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {defaults.length > 0 && (
            <SelectGroup>
              <SelectLabel>Default</SelectLabel>
              {defaults.map((c) => (
                <SelectItem key={`d-${c}`} value={c}>
                  /{c}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          {projects.length > 0 && (
            <SelectGroup>
              <SelectLabel>Project</SelectLabel>
              {projects.map((c) => (
                <SelectItem key={`p-${c}`} value={c}>
                  /{c}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          {globals.length > 0 && (
            <SelectGroup>
              <SelectLabel>Global</SelectLabel>
              {globals.map((c) => (
                <SelectItem key={`g-${c}`} value={c}>
                  /{c}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
