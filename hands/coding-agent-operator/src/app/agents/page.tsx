import { Bot, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { AgentList } from "./components/AgentList";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function AgentsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="w-8 h-8" />
            Sub Agent 窓口
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/projects">Projects</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          各専門エージェントの窓口から直接相談・指示を行えます
        </p>
      </header>

      <main>
        <section>
          <h2 className="text-xl font-semibold mb-6">利用可能なエージェント</h2>
          <AgentList />
        </section>
      </main>
    </div>
  );
}
