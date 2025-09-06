#!/usr/bin/env python
"""
MCP RAG Server

Model Context Protocol (MCP)に準拠したRAG機能を持つPythonサーバー
"""

import sys
import os
import argparse
import importlib
import logging

from .mcp_server import MCPServer
from .config_loader import load_project_config


def main():
    """
    メイン関数

    コマンドライン引数を解析し、MCPサーバーを起動します。
    """
    # Docker限定実行
    try:
        if not os.path.exists("/.dockerenv"):
            print(
                "このサーバーはDockerコンテナ内でのみ起動可能です。\n"
                "docker compose run --rm mcp-server uv run python -m src.main --project <name> を使用してください。",
                file=sys.stderr,
            )
            sys.exit(2)
    except Exception:
        print("実行環境を確認できませんでした。Dockerコンテナ内で起動してください。", file=sys.stderr)
        sys.exit(2)

    # コマンドライン引数の解析
    parser = argparse.ArgumentParser(
        description="MCP RAG Server - Model Context Protocol (MCP)に準拠したRAG機能を持つPythonサーバー"
    )
    parser.add_argument("--name", default="mcp-rag-server", help="サーバー名")
    parser.add_argument("--version", default="0.1.0", help="サーバーバージョン")
    parser.add_argument("--description", default="MCP RAG Server - 複数形式のドキュメントのRAG検索", help="サーバーの説明")
    parser.add_argument("--module", help="追加のツールモジュール（例: myapp.tools）")
    parser.add_argument(
        "--project",
        "-p",
        default=os.environ.get("PROJECT") or os.environ.get("PROJECT_NAME"),
        help="プロジェクト名（必須。--project または環境変数 PROJECT）",
    )
    args = parser.parse_args()

    # 選択されたプロジェクトを環境変数へ反映（未指定なら終了）
    if args.project:
        os.environ["PROJECT"] = args.project
    else:
        print("エラー: PROJECT が未設定です。--project または環境変数 PROJECT を指定してください。", file=sys.stderr)
        sys.exit(2)

    # JSON設定の読み込み
    # Composeなど外部ENVを優先し、不足分だけJSONで補完（override_env=False）
    loaded = load_project_config(project=os.environ.get("PROJECT"), override_env=False)
    if not loaded:
        print("設定ファイルが見つかりません。config/project.json を用意してください。", file=sys.stderr)
        sys.exit(1)

    # ディレクトリの作成
    enable_file_logging = os.environ.get("ENABLE_FILE_LOGGING", "false").lower() == "true"
    if enable_file_logging:
        os.makedirs("logs", exist_ok=True)

    os.makedirs(os.environ.get("SOURCE_DIR", "data/source"), exist_ok=True)
    # プロジェクト別の処理済みディレクトリを作成
    processed_base = os.environ.get("PROCESSED_DIR", "data/processed")
    os.makedirs(os.path.join(processed_base, os.environ.get("PROJECT")), exist_ok=True)

    # ロギングの設定
    handlers = [logging.StreamHandler(sys.stderr)]
    if enable_file_logging:
        handlers.append(logging.FileHandler(os.path.join("logs", "mcp_rag_server.log"), encoding="utf-8"))

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=handlers,
    )
    logger = logging.getLogger("main")

    try:
        # MCPサーバーの作成
        server = MCPServer()

        # RAGサービスの作成と登録（設定読み込み後に遅延インポート）
        from .rag_tools import register_rag_tools, create_rag_service_from_env

        logger.info("RAGサービスを初期化しています...")
        rag_service = create_rag_service_from_env()
        register_rag_tools(server, rag_service)
        logger.info("RAGツールを登録しました")

        # 追加のツールモジュールがある場合は読み込む
        if args.module:
            try:
                module = importlib.import_module(args.module)
                if hasattr(module, "register_tools"):
                    module.register_tools(server)
                    print(f"モジュール '{args.module}' からツールを登録しました", file=sys.stderr)
                else:
                    print(f"警告: モジュール '{args.module}' に register_tools 関数が見つかりません", file=sys.stderr)
            except ImportError as e:
                print(f"警告: モジュール '{args.module}' の読み込みに失敗しました: {str(e)}", file=sys.stderr)

        # MCPサーバーの起動
        server.start(args.name, args.version, args.description)

    except KeyboardInterrupt:
        print("サーバーを終了します。", file=sys.stderr)
        sys.exit(0)

    except Exception as e:
        print(f"エラーが発生しました: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
