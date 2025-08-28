# Claude Code カスタムスラッシュコマンド

このディレクトリには、GitHub作業分析と日報生成のためのカスタムスラッシュコマンドが含まれています。

## 使い方

**基本（推奨）**:
```bash
/daily-report             # 完全自動日報作成
```

**個別実行**:
```bash
/github-work              # GitHub作業分析のみ
/pr 7                     # 特定PRの詳細分析
```

## 利用可能なコマンド

### `/daily-report [date]`
**日報作成の完全自動化**

実行内容:
1. `go run main.go create` - 日報テンプレート作成
2. `/github-work collect` - GitHub作業収集・分析
3. `/pr` - 全PR詳細分析
4. 統合日報生成

### `/github-work [action] [date]`
**GitHub作業の収集・分析**

**アクション**:
- `collect` (デフォルト): データ収集 + `/pr`自動実行 + 分析
- `analyze`: 既存データの分析 + `/pr`自動実行
- `report`: 日報生成のみ

**使用例**:
```bash
/daily-report             # 今日の完全日報作成（推奨）
/daily-report 2025-08-23  # 特定日の完全日報作成
/github-work              # GitHub作業分析のみ
/github-work analyze      # 既存データの再分析
```

### `/pr [target] [date]`
**PR分析コマンド**

**ターゲット**:
- 引数なし / `all`: 全PRを分析
- PR番号: 特定PRを分析

**使用例**:
```bash
/pr                       # 今日の全PRを分析
/pr 7                     # PR #7を分析
/pr all 2025-08-23        # 特定日の全PR分析
/pr 7 2025-08-23          # 特定日の特定PR分析
```

## 推奨ワークフローと使用順序

### 基本的な使用方法

**通常はこれだけ**:
```bash
/daily-report             # 全自動実行
```

### 使用パターン別ガイド

**パターン1: 日常的な使用（推奨）**
```bash
/daily-report             # 完全自動
```

**パターン2: 段階的に実行したい場合**
```bash
/github-work              # 1. GitHub作業分析
/pr 7                     # 2. 特定PRの追加分析（必要時）
go run main.go create     # 3. 日報テンプレート作成
```

**パターン3: データが既にある場合**
```bash
/pr 7                     # データが既にあれば直接分析可能
/github-work report       # 新しい情報を日報に反映
```

**パターン4: 過去のデータを再利用**
```bash
/github-work analyze 2025-08-20    # 過去データの再分析
/pr all 2025-08-20                 # 過去の全PRを詳細分析
```

### ⚠️ 重要な注意点

**実行内容**:
```
/daily-report: テンプレート作成 → データ収集 → 全PR分析 → 統合日報生成
/github-work: データ収集 → /pr自動実行 → 分析
```

**データの依存関係**:
- `/daily-report`は完全自動で全処理を実行
- `/pr`単体実行時は既存データが必要
- エラー時は `/daily-report` から再実行推奨

## コマンド比較

| 用途 | 旧コマンド | 新コマンド |
|-----|-----------|----------|
| **完全日報作成** | - | **`/daily-report`** |
| GitHub作業分析 | `/collect-and-analyze` | `/github-work` |
| データ再分析 | `/analyze-github-work` | `/github-work analyze` |
| 日報生成のみ | `/generate-daily-report` | `/github-work report` |
| 全PR分析 | `/summarize-pr` | `/pr` |
| 個別PR分析 | `/summarize-pr 7` | `/pr 7` |

## 設定

監視したいリポジトリを含む `.github-repos.json` 設定ファイルが設定されていることを確認してください：

```json
{
  "repositories": [
    {
      "owner": "your-username",
      "repo": "your-repo", 
      "description": "プロジェクトの説明"
    }
  ],
  "settings": {
    "include_private": true,
    "max_repos": 50,
    "include_periods": ["created_today", "updated_today"]
  }
}
```

## 出力構造

コマンドは以下の構造で整理された出力を生成します：
```
reports/YYYY/YYYY-MM-DD/
├── github-work/
│   ├── pr-X-repo/
│   │   ├── metadata.json        # PRメタデータ
│   │   ├── description.md       # PR説明
│   │   ├── diff.patch          # コード変更
│   │   ├── conversation.json    # 会話データ
│   │   └── conversation.md      # 会話履歴
│   └── summary.md              # 要約
└── daily-report.md             # 日報
```

この構造はAI分析と人間の可読性の両方に最適化されています。