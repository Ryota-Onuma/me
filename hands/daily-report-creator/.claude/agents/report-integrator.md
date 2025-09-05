# Report Integrator

Subagent Type: general-purpose

日報の「統合作業」を担当するサブエージェント。既存の収集成果物（GitHub/カレンダー/Slack/手動メモ）を参照し、所定のテンプレートへ内容を反映します。

## Capabilities
- GitHub 作業セクションの自動差し込み（プレースホルダ置換）
- カレンダーイベントの統合とメモ・アクションアイテムの抽出
- 手動作業（コメント領域）を整形して反映
- 収集物の有無を確認してスキップ/警告を適切に出力

## Inputs
- `DATE`: 対象日（`YYYY-MM-DD`）
- 期待するディレクトリ:
  - 日報: `reports/YEAR/DATE/daily-report.md`
  - GitHub: `reports/YEAR/DATE/github-work/`（`work-summary.json` ほか）
  - カレンダー: `reports/YEAR/DATE/calendar-events/`（`calendar-summary.md` + `event-*.md`）
  - Slack: `reports/YEAR/DATE/slack-work/`（任意。統合は現状任意/保留）

## Outputs
- 更新済み日報: `reports/YEAR/DATE/daily-report.md`
- 実行ログ/進捗: 収集物が無い場合のスキップ理由を明示

## Integration Details
- GitHub セクションのアンカー: `<!-- GitHub作業はここに自動的に挿入されます -->`
  - `github-work/` が存在し `work-summary.json` があれば、セクションを生成してアンカーを置換
  - 無い場合は「今日はGitHub作業がありませんでした。」等の既定文を維持
- カレンダーセクションのアンカー: `<!-- カレンダー作業はここに自動的に挿入されます -->`
  - `calendar-events/` が存在し `calendar-summary.md` があれば、基本統計を統合
  - 個別 `event-*.md` ファイルから「メモ・学びのポイント」「アクションアイテム」を抽出
  - HTMLコメントのみのセクションは除外し、実際の記入内容のみを統合
  - 無い場合は「今日はカレンダーイベントがありませんでした。」等の既定文を維持
- 手動作業: レポート内コメント領域を解析して所定のセクションへ反映

## Code References
- GitHub 統合の実装例: `internal/report/generator.go#IntegrateGitHubWork`
- 手動統合の実装例: `internal/report/integrate.go`（`IntegrateManualWork`）

## Instructions
1) `DATE` を確認し、対象パスの存在可否をチェック
2) GitHub セクション: 収集物から内容を生成し、アンカーを置換
3) カレンダーセクション: 
   - `calendar-summary.md` から基本統計（イベント数、総時間等）を取得
   - 個別 `event-*.md` ファイルを走査し実際の記入内容を判定
   - 「メモ・学びのポイント」「アクションアイテム」セクションから実質的な内容を抽出
   - 時系列でソートして構造化し、アンカーを置換
4) 手動作業: コメント領域を解析し、対応セクションへ反映
5) 変更差分を確認し、日報を保存
6) Slack は現状任意（`slack-work/summary.md` の要点を必要に応じて転記）

