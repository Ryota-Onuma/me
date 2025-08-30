## task-manage/frontend

React + TypeScript (Vite) 製フロントエンドです。`backend/` の Go サーバーが `web/` を配信します。

開発とビルドの詳細はリポジトリ直下の `task-manage/README.md` を参照してください。ここでは必要最小限のみ記載します。

### 開発

API は `http://localhost:8888` にプロキシされます。

```
cd task-manage/frontend
npm install
npm run dev
```

### ビルド（Go サーバーで配信）

```
cd task-manage/frontend
npm run build
```

ビルド成果物は `task-manage/web/` に出力され、バックエンドが配信します。

### 補足

- 旧 `frontend2` は削除済みです。必要なコンポーネントだけを `frontend` に移植しています。
- スタイルは `src/style.css` のみを利用します（テンプレ CSS は削除）。

### ルーティング

- `/` または `/tasks`: タスクボード（TaskManagePage）
- `/tasks/:taskId`: タスク詳細パネルを開いた状態
- `/settings`: 設定モーダルを開いた状態で表示
- `/agent`: エージェント実行モーダルを開いた状態で表示
- `/attempts/new?taskId=...`: 実行作成モーダルを開いた状態（taskId 指定）

バックエンドは `index.html` へのフォールバックを実装済みのため、直接アクセス/リロードが可能です。
