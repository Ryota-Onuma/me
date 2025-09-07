-- 初回起動（クラスタ初期化）時に自動実行されるSQL
-- 既存ボリュームではこのファイルは実行されません（その場合は compose の db-init サービスが担当）

-- public スキーマを明示的に確保
CREATE SCHEMA IF NOT EXISTS public;

-- pgvector 拡張を public に作成（存在すれば何もしない）
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

