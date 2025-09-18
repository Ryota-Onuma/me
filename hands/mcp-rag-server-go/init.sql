-- PostgreSQL初期化スクリプト
-- pgvector拡張を有効化

-- pgvector拡張を作成
CREATE EXTENSION IF NOT EXISTS vector;

-- 必要に応じて追加の初期化処理をここに記述
-- 例: ユーザー作成、権限設定など

-- 動作確認用クエリ
SELECT 'pgvector extension loaded successfully!' as status;