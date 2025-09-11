import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ExecuteAgentSchema = z.object({
  agentType: z.enum([
    "general-purpose",
    "statusline-setup",
    "output-style-setup",
  ]),
  description: z.string(),
  prompt: z.string(),
  project: z.object({
    id: z.string(),
    name: z.string(),
    path: z.string().nullable(),
  }).nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentType, description, prompt, project } = ExecuteAgentSchema.parse(body);

    // Task toolを使用してSubAgentを呼び出し
    // 注意: 実際のClaude Code環境では、Task toolが利用可能である必要があります
    const result = await executeSubAgent(agentType, description, prompt, project);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Agent execution error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// SubAgent実行のシミュレーション関数
// 実際の環境では、Claude CodeのTask toolを使用する
async function executeSubAgent(
  agentType: string,
  description: string,
  prompt: string,
  project?: { id: string; name: string; path: string | null } | null,
): Promise<string> {
  // 開発環境での模擬実装
  // 実際の本番環境では、ここでTask toolを呼び出す

  await new Promise((resolve) => setTimeout(resolve, 2000)); // 実行時間のシミュレーション

  const projectInfo = project 
    ? `\n\n📁 実行環境:\n- プロジェクト: ${project.name}\n- パス: ${project.path || project.id}`
    : "\n\n📁 実行環境: プロジェクト未選択";

  switch (agentType) {
    case "general-purpose":
      return `[General Purpose Agent実行結果]${projectInfo}\n\nタスク: ${description}\n\n以下のタスクを段階的に実行しました：\n\n1. プロジェクト構造の調査\n2. 関連ファイルの検索\n3. コード解析の実行\n4. 結果の整理\n\n詳細:\n${prompt}\n\n実行が完了しました。さらに詳しい分析が必要な場合はお知らせください。`;

    case "statusline-setup":
      return `[Statusline Setup Agent実行結果]${projectInfo}\n\nタスク: ${description}\n\nステータスライン設定を以下の通り更新しました：\n\n- プロジェクト情報表示の追加\n- Git状態の表示設定\n- ファイル情報の表示形式変更\n\n設定内容:\n${prompt}\n\n設定ファイルが正常に更新されました。`;

    case "output-style-setup":
      return `[Output Style Setup Agent実行結果]${projectInfo}\n\nタスク: ${description}\n\n出力スタイルを以下の仕様で作成しました：\n\n- カスタムテーマの適用\n- コードハイライト設定の最適化\n- 表示フォーマットの改善\n\n仕様:\n${prompt}\n\nスタイルファイルが正常に作成されました。`;

    default:
      return "未知のエージェントタイプです。";
  }
}

// 実際のClaude Code環境での実装例（参考）
/*
async function executeSubAgentReal(
  agentType: string,
  description: string,
  prompt: string
): Promise<string> {
  try {
    // Task toolを使用してSubAgentを呼び出し
    const result = await claudeCode.invokeTask({
      subagent_type: agentType,
      description: description,
      prompt: prompt,
    });
    
    return result;
  } catch (error) {
    console.error("Task tool execution failed:", error);
    throw new Error("SubAgent実行に失敗しました");
  }
}
*/
