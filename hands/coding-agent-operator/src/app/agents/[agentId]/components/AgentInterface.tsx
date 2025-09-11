"use client";

import { ArrowLeft, Loader2, Palette, Search, Send, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Textarea } from "../../../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import type { ClaudeSubAgent } from "../../lib/agents";
import { useProjects } from "../../../projects/hooks/useProjects";

const ICON_MAP = {
  search: <Search className="w-6 h-6" />,
  settings: <Settings className="w-6 h-6" />,
  palette: <Palette className="w-6 h-6" />,
};

function getIcon(iconKey: string) {
  return ICON_MAP[iconKey as keyof typeof ICON_MAP];
}

interface Props {
  agent: ClaudeSubAgent;
}

export function AgentInterface({ agent }: Props) {
  const [task, setTask] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>("");
  
  const { data: projects } = useProjects();

  const handleExecute = async () => {
    if (!task.trim()) return;

    setIsExecuting(true);
    setError(null);
    setResult(null);

    try {
      // Task toolを使用してSubAgentを呼び出す
      const prompt = agent.promptTemplate
        ? agent.promptTemplate
            .replace("{task}", task)
            .replace("{requirements}", task)
            .replace("{specifications}", task)
        : task;

      const selectedProjectData = projects.find(p => p.id === selectedProject);
      
      const response = await fetch("/api/agents/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentType: agent.id,
          description: `${agent.name}タスク実行`,
          prompt: prompt,
          project: selectedProjectData ? {
            id: selectedProjectData.id,
            name: selectedProjectData.meta.projectName ?? selectedProjectData.claudeProjectPath,
            path: selectedProjectData.meta.projectPath,
          } : null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/agents" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              エージェント一覧
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">{getIcon(agent.icon)}</div>
            <div>
              <h1 className="text-2xl font-bold">{agent.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground">稼働中</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-muted-foreground">{agent.longDescription}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* メインエリア */}
        <div className="lg:col-span-2 space-y-6">
          {/* プロジェクト選択 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                実行環境
              </CardTitle>
              <CardDescription>
                Sub Agentを実行するプロジェクトディレクトリを選択してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label htmlFor="project-select" className="text-sm font-medium">
                  プロジェクト
                </label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger id="project-select">
                    <SelectValue placeholder="プロジェクトを選択..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {project.meta.projectName ?? project.claudeProjectPath}
                          </span>
                          {project.meta.projectPath && (
                            <span className="text-xs text-muted-foreground">
                              {project.meta.projectPath}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* タスク入力 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                タスクを実行
              </CardTitle>
              <CardDescription>
                {agent.name}に実行させたいタスクを入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="例: プロジェクトの設定ファイルを調査して、テストの実行方法を教えて"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                rows={4}
                className="min-h-[100px]"
              />
              <Button
                onClick={handleExecute}
                disabled={!task.trim() || !selectedProject || isExecuting}
                className="w-full sm:w-auto"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    実行中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    実行
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 実行結果 */}
          {(result || error) && (
            <Card>
              <CardHeader>
                <CardTitle
                  className={error ? "text-destructive" : "text-foreground"}
                >
                  {error ? "エラー" : "実行結果"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`p-4 rounded-lg ${error ? "bg-destructive/10" : "bg-muted"}`}
                >
                  <pre className="whitespace-pre-wrap text-sm">
                    {error || result}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* 機能一覧 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">主な機能</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {agent.capabilities.map((capability) => (
                  <Badge
                    key={capability}
                    variant="secondary"
                    className="block w-full text-center"
                  >
                    {capability}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 利用可能ツール */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">利用可能ツール</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {agent.tools.map((tool) => (
                  <Badge
                    key={tool}
                    variant="outline"
                    className="block w-full text-center"
                  >
                    {tool}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 使用例 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">使用例</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                {agent.useCases.map((useCase) => (
                  <li key={useCase} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    {useCase}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
