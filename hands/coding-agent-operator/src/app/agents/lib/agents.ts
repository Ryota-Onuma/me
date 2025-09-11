export interface ClaudeSubAgent {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  icon: string;
  tools: string[];
  capabilities: string[];
  useCases: string[];
  promptTemplate?: string;
}

export const claudeSubAgents: ClaudeSubAgent[] = [
  {
    id: "general-purpose",
    name: "General Purpose Agent",
    description: "複雑な質問の調査、コード検索、多段階タスクを自律実行",
    longDescription:
      "複雑で多段階にわたるタスクを自律的に処理する汎用エージェント。コードベースの調査、ファイル検索、複数ステップにわたるタスクの実行が可能です。キーワードやファイルの検索で最初の試行で適切な結果が得られない可能性がある場合に最適です。",
    icon: "search",
    tools: ["*"],
    capabilities: [
      "複雑な質問の調査",
      "コード検索・解析",
      "多段階タスク実行",
      "ファイル検索・操作",
      "全ツールアクセス",
    ],
    useCases: [
      "大規模なコードベースでの情報検索",
      "複数ステップにわたる調査・分析",
      "不確実な検索条件での探索",
      "アーキテクチャの理解・解析",
    ],
    promptTemplate:
      "以下のタスクを自律的に実行してください：\n\n{task}\n\n必要に応じて複数のツールを組み合わせて、段階的にタスクを完了してください。",
  },
  {
    id: "statusline-setup",
    name: "Statusline Setup Agent",
    description: "Claude Codeのステータスライン設定を構成・カスタマイズ",
    longDescription:
      "Claude Codeのステータスライン表示をカスタマイズする専門エージェント。プロジェクト情報、Git状態、ファイル情報などの表示項目を設定できます。",
    icon: "settings",
    tools: ["Read", "Edit"],
    capabilities: [
      "ステータスライン設定",
      "表示項目カスタマイズ",
      "設定ファイル編集",
      "プロジェクト情報表示",
    ],
    useCases: [
      "ステータスライン表示のカスタマイズ",
      "プロジェクト固有の情報表示",
      "開発環境の視認性向上",
    ],
    promptTemplate:
      "Claude Codeのステータスライン設定を以下の要件に従って構成してください：\n\n{requirements}\n\n設定ファイルの読み取り・編集を行い、適切なステータスライン表示を実現してください。",
  },
  {
    id: "output-style-setup",
    name: "Output Style Setup Agent",
    description: "Claude Codeの出力スタイルを作成・カスタマイズ",
    longDescription:
      "Claude Codeの出力表示スタイルをカスタマイズする専門エージェント。コードハイライト、テーマ設定、表示フォーマットなどを調整できます。",
    icon: "palette",
    tools: ["Read", "Write", "Edit", "Glob", "Grep"],
    capabilities: [
      "出力スタイル作成",
      "テーマ設定",
      "コードハイライト設定",
      "表示フォーマット調整",
    ],
    useCases: [
      "カスタム出力スタイルの作成",
      "テーマ・カラースキームの設定",
      "コード表示の見た目改善",
    ],
    promptTemplate:
      "Claude Codeの出力スタイルを以下の仕様で作成してください：\n\n{specifications}\n\nスタイルファイルの作成・編集を行い、指定された見た目を実現してください。",
  },
];

export function getAgentById(id: string): ClaudeSubAgent | undefined {
  return claudeSubAgents.find((agent) => agent.id === id);
}

export function getAllAgents(): ClaudeSubAgent[] {
  return claudeSubAgents;
}
