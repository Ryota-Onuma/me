import { QueryClient } from "@tanstack/react-query";
import { HistoryIcon, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { ProjectList } from "./components/ProjectList";
import { projetsQueryConfig } from "./hooks/useProjects";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function ProjectsPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: projetsQueryConfig.queryKey,
    queryFn: projetsQueryConfig.queryFn,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <HistoryIcon className="w-8 h-8" />
            CodingAgentOperator
          </h1>
          <Button variant="outline" asChild>
            <Link href="/settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground">
          Browse your Claude Code conversation history and project interactions
        </p>
      </header>

      <main>
        <section>
          <h2 className="text-xl font-semibold mb-4">Your Projects</h2>

          <ProjectList />
        </section>
      </main>
    </div>
  );
}
