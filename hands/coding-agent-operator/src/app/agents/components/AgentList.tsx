"use client";

import { Palette, Search, Settings } from "lucide-react";
import Link from "next/link";
import { Badge } from "../../../components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { getAllAgents } from "../lib/agents";

const ICON_MAP = {
  search: <Search className="w-6 h-6" />,
  settings: <Settings className="w-6 h-6" />,
  palette: <Palette className="w-6 h-6" />,
};

function getIcon(iconKey: string) {
  return ICON_MAP[iconKey as keyof typeof ICON_MAP];
}

export function AgentList() {
  const agents = getAllAgents();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {agents.map((agent) => (
        <Link key={agent.id} href={`/agents/${agent.id}`}>
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    {getIcon(agent.icon)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm text-muted-foreground">
                        稼働中
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <CardDescription className="mb-4 leading-relaxed">
                {agent.description}
              </CardDescription>

              <div className="flex flex-wrap gap-1">
                {agent.capabilities.slice(0, 3).map((capability) => (
                  <Badge
                    key={capability}
                    variant="secondary"
                    className="text-xs"
                  >
                    {capability}
                  </Badge>
                ))}
                {agent.capabilities.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{agent.capabilities.length - 3}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
