#!/usr/bin/env python
"""
MCP RAG Server CLI

インデックスのクリアとインデックス化を行うためのコマンドラインインターフェース
"""

import sys
import os
import argparse
import logging
import json
from pathlib import Path
from typing import List, Optional

from .config_loader import load_project_config


def _ensure_docker_only() -> None:
    """Dockerコンテナ内でのみ実行を許可。

    - /.dockerenv の存在で判定
    - それ以外（ホスト直実行など）は明確に中止
    """
    try:
        if not os.path.exists("/.dockerenv"):
            print(
                "このCLIはDockerコンテナ内でのみ実行可能です。\n"
                "docker compose run --rm mcp-server uv run python -m src.cli <args> を使用してください。",
                file=sys.stderr,
            )
            sys.exit(2)
    except Exception:
        # 判定に失敗した場合も安全側で中止
        print(
            "実行環境を確認できませんでした。Dockerコンテナ内で実行してください。",
            file=sys.stderr,
        )
        sys.exit(2)


def _config_paths() -> List[Path]:
    candidates: List[Path] = []
    # 既定の集中管理ファイル
    candidates.append(Path("config") / "project.json")
    candidates.append(Path("config.json"))
    return candidates


def _load_projects_from_json() -> List[str]:
    for p in _config_paths():
        if p.exists():
            try:
                data = json.loads(p.read_text(encoding="utf-8"))
                projects = data.get("projects")
                if isinstance(projects, dict):
                    return sorted(projects.keys())
            except Exception:
                continue
    return []


def _ensure_config_loaded(project: Optional[str] = None, *, override_env: bool = True):
    """JSON読込→ENV反映。

    デフォルトは JSON を真実とみなし、既存ENVを上書き（override_env=True）。
    Compose等の外部ENVを優先したい場合は False を指定。
    """
    loaded = load_project_config(project=os.environ.get("PROJECT", project), override_env=override_env)
    if not loaded:
        print("設定ファイルが見つかりません。config/project.json を用意してください。")
        sys.exit(1)


def _ensure_dirs(source_dir: str, processed_dir: str):
    Path(source_dir).mkdir(parents=True, exist_ok=True)
    Path(processed_dir).mkdir(parents=True, exist_ok=True)


def project_init_interactive(
    project: Optional[str] = None,
    source_dir: Optional[str] = None,
    processed_dir: Optional[str] = None,
) -> None:
    """プロジェクト初期化（DB固定・スキーマ分離）。"""

    def _prompt(prompt: str, default: str) -> str:
        """TTYがない/EOFでもデフォルトを返す堅牢な入力関数。"""
        # 既に引数で与えられていればそのまま使うため、呼び出し側で制御
        try:
            if sys.stdin is not None and sys.stdin.isatty():
                try:
                    v = input(prompt)
                except EOFError:
                    v = ""
            else:
                # 非対話（パイプ/CI等）は即デフォルト
                v = ""
        except Exception:
            # isatty 判定失敗時も安全側でデフォルト
            v = ""
        v = (v or "").strip()
        return v or default

    print("[project:init] プロジェクト設定とスキーマを作成します。空Enterでデフォルト。")

    name = project or _prompt("- プロジェクト名 [alpha]: ", "alpha")
    default_src = f"/app/data/source/{name}"
    src = source_dir or _prompt(f"- SOURCE_DIR [{default_src}]: ", default_src)
    proc = processed_dir or _prompt("- PROCESSED_DIR [data/processed]: ", "data/processed")
    # スキーマ名（デフォルトはプロジェクト名をそのまま使用）
    schema = _prompt(f"- スキーマ名 [{name}]: ", name)

    # 設定ファイルを更新
    cfg_dir = Path("config")
    cfg_dir.mkdir(exist_ok=True)
    cfg_path = cfg_dir / "project.json"
    data = {"projects": {}}
    if cfg_path.exists():
        try:
            data = json.loads(cfg_path.read_text(encoding="utf-8"))
        except Exception:
            pass
    data.setdefault("projects", {})

    # 既存defaultを尊重しつつ、projectセクションを上書き
    data["projects"][name] = {
        "paths": {"source_dir": src, "processed_dir": proc},
        "postgres": {"schema": schema},
    }
    cfg_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[project:init] 設定を更新しました: {cfg_path}")

    # ディレクトリ用意
    _ensure_dirs(src, proc)

    # スキーマを初期化（固定DBに対して）
    # Compose等の外部ENV（例: POSTGRES_HOST=postgres, POSTGRES_DB=ragdb）を尊重
    _ensure_config_loaded(project=name, override_env=False)
    os.environ["POSTGRES_SCHEMA"] = schema
    _initialize_project_schema(project=name)
    print(f"[project:init] プロジェクト '{name}' の初期化が完了しました（schema={schema}）。")


def _initialize_project_schema(project: str) -> None:
    """固定DB上でプロジェクト用スキーマを初期化する。"""
    from .vector_database import VectorDatabase

    host = os.environ.get("POSTGRES_HOST", "localhost")
    port = int(os.environ.get("POSTGRES_PORT", "5432"))
    user = os.environ.get("POSTGRES_USER", "postgres")
    password = os.environ.get("POSTGRES_PASSWORD", "password")
    dbname = os.environ.get("POSTGRES_DB", "ragdb")

    vdb = VectorDatabase({"host": host, "port": port, "user": user, "password": password, "database": dbname}, project=project)
    vdb.initialize_database()


def project_choose() -> str:
    """プロジェクト選択（/dev/tty経由で確実に対話可能）。

    - 対話UIは /dev/tty に出力し、選択結果のみを stdout に出す。
    - 非対話時は安全なフォールバックを使用。
    """
    projects = _load_projects_from_json()
    if not projects:
        print("プロジェクトが見つかりません。先に 'project init' を実行してください。", file=sys.stderr)
        sys.exit(1)

    # 非対話/TTYなし時のフォールバック
    def _fallback() -> str:
        if "alpha" in projects:
            return "alpha"
        return projects[0]

    # 対話入出力先の決定
    # 1) sys.stdin/sys.stderr が使えるならそれを優先（`< /dev/tty` でのリダイレクト対応）
    # 2) それが不可なら /dev/tty を直接開く
    # 3) どちらも不可ならフォールバック
    use_stdio = False
    tty_in = None
    tty_out = None

    try:
        if sys.stdin is not None and sys.stdin.readable():
            # プロンプトはstdoutに混ざらないようstderrへ出す
            use_stdio = True
    except Exception:
        use_stdio = False

    if not use_stdio:
        try:
            tty_in = open("/dev/tty", "r")
            tty_out = open("/dev/tty", "w")
        except Exception:
            # TTYが使えない場合はフォールバック
            choice = _fallback()
            print(choice)
            return choice

    # 実際の入出力対象を決定
    in_fp = sys.stdin if use_stdio else tty_in
    out_fp = sys.stderr if use_stdio else tty_out

    try:
        print("プロジェクトを選択してください:", file=out_fp)
        for i, name in enumerate(projects, 1):
            print(f"  [{i}] {name}", file=out_fp)
        out_fp.flush()

        while True:
            print(f"選択 (1-{len(projects)}): ", end="", file=out_fp, flush=True)
            sel = in_fp.readline()
            if not sel:
                # EOFなど
                choice = _fallback()
                print(choice)
                return choice
            sel = sel.strip()
            try:
                idx = int(sel)
                if 1 <= idx <= len(projects):
                    choice = projects[idx - 1]
                    # 結果は標準出力へ（1行のみ）
                    print(choice)
                    return choice
            except Exception:
                pass
            print("無効な入力です。もう一度。", file=out_fp)
            out_fp.flush()
    finally:
        if not use_stdio:
            try:
                tty_in.close()  # type: ignore[union-attr]
            except Exception:
                pass
            try:
                tty_out.close()  # type: ignore[union-attr]
            except Exception:
                pass


def _read_full_config() -> dict:
    for p in _config_paths():
        if p.exists():
            try:
                return json.loads(p.read_text(encoding="utf-8"))
            except Exception:
                pass
    return {}


def _print_mcp_profiles() -> None:
    """MCP接続用のプロファイル一覧（JSON）を標準出力に出す。"""
    cfg = _read_full_config()
    projects = sorted((cfg.get("projects") or {}).keys())
    res = []
    for name in projects:
        p = cfg["projects"][name]
        # プロジェクト設定のみを使用
        pg = p.get("postgres") or {}
        paths = p.get("paths") or {}
        emb = p.get("embedding") or {}
        log = p.get("logging") or {}

        env = {
            "POSTGRES_HOST": str(pg.get("host", "localhost")),
            "POSTGRES_PORT": str(pg.get("port", 5432)),
            "POSTGRES_USER": str(pg.get("user", "postgres")),
            "POSTGRES_PASSWORD": str(pg.get("password", "password")),
            # DBは固定。ENVのみ（なければ 'ragdb'）
            "POSTGRES_DB": str(os.environ.get("POSTGRES_DB", "ragdb")),
            # スキーマはプロジェクトごとに（未指定ならプロジェクト名）
            "POSTGRES_SCHEMA": str(pg.get("schema", name)),
            "PROJECT": name,
            "SOURCE_DIR": str(paths.get("source_dir", "data/source")),
            "PROCESSED_DIR": str(paths.get("processed_dir", "data/processed")),
            "EMBEDDING_MODEL": str(emb.get("model", "intfloat/multilingual-e5-large")),
            "EMBEDDING_DIM": str(emb.get("dim", 1024)),
            "EMBEDDING_PREFIX_QUERY": str(emb.get("prefix_query", "")),
            "EMBEDDING_PREFIX_EMBEDDING": str(emb.get("prefix_embedding", "")),
            "ENABLE_FILE_LOGGING": str(log.get("enable_file_logging", False)).lower(),
        }

        res.append(
            {
                "name": name,
                "env": env,
                "command": ["uv", "run", "python", "-m", "src.main", "--project", name],
                "type": "stdio",
            }
        )

    print(json.dumps({"profiles": res}, ensure_ascii=False, indent=2))


def _project_delete(
    *,
    name: Optional[str],
    drop_db: bool,
    delete_processed: bool,
    delete_source: bool,
    assume_yes: bool,
) -> None:
    cfg_path = None
    for p in _config_paths():
        if p.exists():
            cfg_path = p
            break
    if not cfg_path:
        print("設定ファイルが見つかりません。config/project.json を用意してください。")
        sys.exit(1)

    cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    projects = sorted((cfg.get("projects") or {}).keys())
    if not projects:
        print("削除対象のプロジェクトがありません。")
        return

    target = name or project_choose()
    if target not in (cfg.get("projects") or {}):
        print(f"プロジェクト '{target}' は見つかりません。")
        sys.exit(1)

    # 設定の解決（paths, postgres）
    proj = cfg["projects"][target]
    paths = proj.get("paths") or {}
    pg = proj.get("postgres") or {}

    proc_base = paths.get("processed_dir", "data/processed")
    processed_project_dir = str(Path(proc_base) / target)
    source_dir = paths.get("source_dir", "data/source")
    # スキーマ名（設定になければプロジェクト名）
    schema_name = str(pg.get("schema") or target)

    # 確認
    if not assume_yes:
        print("以下を削除します:")
        if delete_processed:
            print(f"- processed: {processed_project_dir}")
        if delete_source:
            print(f"- source:    {source_dir} (注意: 共有の可能性)")
        if drop_db:
            print(f"- schema:    {schema_name}")
        ans = input("続行しますか? [y/N]: ").strip().lower()
        if ans not in ("y", "yes"):
            print("中止しました。")
            return

    # 削除処理
    if delete_processed:
        pdir = Path(processed_project_dir)
        if pdir.exists():
            import shutil

            shutil.rmtree(pdir, ignore_errors=True)
            print(f"削除: {pdir}")

    if delete_source:
        sdir = Path(source_dir)
        if sdir.exists():
            import shutil

            shutil.rmtree(sdir, ignore_errors=True)
            print(f"削除: {sdir}")

    if drop_db:
        try:
            import psycopg2
            from psycopg2 import sql

            conn = psycopg2.connect(
                host=str(pg.get("host", "localhost")),
                port=int(pg.get("port", 5432)),
                user=str(pg.get("user", "postgres")),
                password=str(pg.get("password", "password")),
                dbname=str(os.environ.get("POSTGRES_DB", "ragdb")),
            )
            conn.autocommit = True
            cur = conn.cursor()
            cur.execute(sql.SQL("DROP SCHEMA IF EXISTS {} CASCADE;").format(sql.Identifier(schema_name)))
            cur.close()
            conn.close()
            print(f"DROP SCHEMA: {schema_name}")
        except Exception as e:
            print(f"スキーマ削除に失敗しました: {e}")

    # 設定から削除
    del cfg["projects"][target]
    cfg_path.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"設定から削除: {target}")


def setup_logging():
    """
    ロギングの設定
    """
    # ログファイル出力の制御
    enable_file_logging = os.environ.get("ENABLE_FILE_LOGGING", "false").lower() == "true"

    # 必要な場合のみログディレクトリを作成
    if enable_file_logging:
        os.makedirs("logs", exist_ok=True)

    # ハンドラーの設定
    handlers = [logging.StreamHandler(sys.stdout)]
    if enable_file_logging:
        handlers.append(logging.FileHandler(os.path.join("logs", "mcp_rag_cli.log"), encoding="utf-8"))

    # ロギングの設定
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=handlers,
    )
    return logging.getLogger("cli")


def clear_index():
    """
    インデックスをクリアする
    """
    logger = setup_logging()
    logger.info("インデックスをクリアしています...")

    # JSON設定の読み込み
    # Docker Compose等の外部ENV（POSTGRES_HOST=postgres など）を優先し、不足分のみJSONで補完
    project = os.environ.get("PROJECT") or os.environ.get("PROJECT_NAME")
    _ensure_config_loaded(project=project, override_env=False)
    # クリア処理では JSON の paths.processed_dir を明示優先で採用する
    resolved = load_project_config(project=project, override_env=False)

    # RAGサービスの作成（設定適用後に遅延インポート）
    from .rag_tools import create_rag_service_from_env

    rag_service = create_rag_service_from_env()

    # 処理済みディレクトリのパス（優先度: JSON > ENV > 既定）
    processed_dir = resolved.get("PROCESSED_DIR") or os.environ.get("PROCESSED_DIR", "data/processed")
    # プロジェクト別ディレクトリ
    project = os.environ.get("PROJECT")
    if not project:
        logger.error("PROJECT が未設定です。--project または環境変数 PROJECT を指定してください。")
        print("エラー: PROJECT が未設定です。--project または環境変数 PROJECT を指定してください。")
        sys.exit(2)
    processed_dir = os.path.join(processed_dir, project)

    # ファイルレジストリの削除
    registry_path = Path(processed_dir) / "file_registry.json"
    if registry_path.exists():
        try:
            registry_path.unlink()
            logger.info(f"ファイルレジストリを削除しました: {registry_path}")
            print(f"ファイルレジストリを削除しました: {registry_path}")
        except Exception as e:
            logger.error(f"ファイルレジストリの削除に失敗しました: {str(e)}")
            print(f"ファイルレジストリの削除に失敗しました: {str(e)}")

    # インデックスをクリア
    result = rag_service.clear_index()

    if result["success"]:
        logger.info(f"インデックスをクリアしました（{result['deleted_count']} ドキュメントを削除）")
        print(f"インデックスをクリアしました（{result['deleted_count']} ドキュメントを削除）")
    else:
        logger.error(f"インデックスのクリアに失敗しました: {result.get('error', '不明なエラー')}")
        print(f"インデックスのクリアに失敗しました: {result.get('error', '不明なエラー')}")
        sys.exit(1)


def index_documents(directory_path, chunk_size=500, chunk_overlap=100, incremental=False):
    """
    ドキュメントをインデックス化する

    Args:
        directory_path: インデックス化するドキュメントが含まれるディレクトリのパス
        chunk_size: チャンクサイズ（文字数）
        chunk_overlap: チャンク間のオーバーラップ（文字数）
        incremental: 差分のみをインデックス化するかどうか
    """
    logger = setup_logging()
    if incremental:
        logger.info(f"ディレクトリ '{directory_path}' 内の差分ファイルをインデックス化しています...")
    else:
        logger.info(f"ディレクトリ '{directory_path}' 内のドキュメントをインデックス化しています...")

    # JSON設定の読み込み
    # Docker Compose等の外部ENV（POSTGRES_HOST=postgres など）を優先し、不足分のみJSONで補完
    project = os.environ.get("PROJECT") or os.environ.get("PROJECT_NAME")
    _ensure_config_loaded(project=project, override_env=False)
    # JSON優先で processed_dir ベースを解決
    resolved_env = load_project_config(project=project, override_env=False)

    # ディレクトリの存在確認
    if not os.path.exists(directory_path):
        logger.error(f"ディレクトリ '{directory_path}' が見つかりません")
        print(f"エラー: ディレクトリ '{directory_path}' が見つかりません")
        sys.exit(1)

    if not os.path.isdir(directory_path):
        logger.error(f"'{directory_path}' はディレクトリではありません")
        print(f"エラー: '{directory_path}' はディレクトリではありません")
        sys.exit(1)

    # RAGサービスの作成（設定適用後に遅延インポート）
    from .rag_tools import create_rag_service_from_env

    rag_service = create_rag_service_from_env()

    # 処理済みディレクトリのパス
    processed_dir = resolved_env.get("PROCESSED_DIR") or os.environ.get("PROCESSED_DIR", "data/processed")

    # インデックス化を実行
    if incremental:
        print(f"ディレクトリ '{directory_path}' 内の差分ファイルをインデックス化しています...")
    else:
        print(f"ディレクトリ '{directory_path}' 内のドキュメントをインデックス化しています...")

    # 進捗状況を表示するためのカウンタ
    processed_files = 0

    # 処理前にファイル数を取得
    total_files = 0
    for root, _, files in os.walk(directory_path):
        for file in files:
            file_path = os.path.join(root, file)
            ext = os.path.splitext(file_path)[1].lower()
            if ext in [".md", ".markdown", ".txt", ".pdf", ".ppt", ".pptx", ".doc", ".docx"]:
                total_files += 1

    print(f"合計 {total_files} 個のファイルを検索しました...")

    # 元のRAGServiceのindex_documentsメソッドを呼び出す前に、
    # DocumentProcessorのprocess_directoryメソッドをオーバーライドして進捗を表示
    original_process_directory = rag_service.document_processor.process_directory

    def process_directory_with_progress(source_dir, processed_dir, chunk_size=500, overlap=100, incremental=False):
        nonlocal processed_files
        results = []
        source_directory = Path(source_dir)

        if not source_directory.exists() or not source_directory.is_dir():
            logger.error(f"ディレクトリ '{source_dir}' が見つからないか、ディレクトリではありません")
            raise FileNotFoundError(f"ディレクトリ '{source_dir}' が見つからないか、ディレクトリではありません")

        # サポートするファイル拡張子を全て取得
        all_extensions = []
        for ext_list in rag_service.document_processor.SUPPORTED_EXTENSIONS.values():
            all_extensions.extend(ext_list)

        # ファイルを検索
        files = []
        for ext in all_extensions:
            files.extend(list(source_directory.glob(f"**/*{ext}")))

        logger.info(f"ディレクトリ '{source_dir}' 内に {len(files)} 個のファイルが見つかりました")

        # 差分処理の場合、ファイルレジストリを読み込む
        if incremental:
            file_registry = rag_service.document_processor.load_file_registry(processed_dir)
            logger.info(f"ファイルレジストリから {len(file_registry)} 個のファイル情報を読み込みました")

            # 処理対象のファイルを特定
            files_to_process = []
            for file_path in files:
                str_path = str(file_path)
                # ファイルのメタデータを取得
                current_metadata = rag_service.document_processor.get_file_metadata(str_path)

                # レジストリに存在しない、またはハッシュ値が変更されている場合のみ処理
                if (
                    str_path not in file_registry
                    or file_registry[str_path]["hash"] != current_metadata["hash"]
                    or file_registry[str_path]["mtime"] != current_metadata["mtime"]
                    or file_registry[str_path]["size"] != current_metadata["size"]
                ):
                    files_to_process.append(file_path)
                    # レジストリを更新
                    file_registry[str_path] = current_metadata

            print(f"処理対象のファイル数: {len(files_to_process)} / {len(files)}")

            # 各ファイルを処理
            for i, file_path in enumerate(files_to_process):
                try:
                    file_results = rag_service.document_processor.process_file(
                        str(file_path), processed_dir, chunk_size, overlap
                    )
                    results.extend(file_results)
                    processed_files += 1
                    print(
                        f"処理中... {processed_files}/{len(files_to_process)} ファイル ({(processed_files / len(files_to_process) * 100):.1f}%): {file_path}"
                    )
                except Exception as e:
                    logger.error(f"ファイル '{file_path}' の処理中にエラーが発生しました: {str(e)}")
                    # エラーが発生しても処理を続行
                    continue

            # ファイルレジストリを保存
            rag_service.document_processor.save_file_registry(processed_dir, file_registry)
        else:
            # 差分処理でない場合は全てのファイルを処理
            for i, file_path in enumerate(files):
                try:
                    file_results = rag_service.document_processor.process_file(
                        str(file_path), processed_dir, chunk_size, overlap
                    )
                    results.extend(file_results)
                    processed_files += 1
                    print(
                        f"処理中... {processed_files}/{total_files} ファイル ({(processed_files / total_files * 100):.1f}%): {file_path}"
                    )
                except Exception as e:
                    logger.error(f"ファイル '{file_path}' の処理中にエラーが発生しました: {str(e)}")
                    # エラーが発生しても処理を続行
                    continue

            # 全ファイル処理の場合も、新しいレジストリを作成して保存
            file_registry = {}
            for file_path in files:
                str_path = str(file_path)
                file_registry[str_path] = rag_service.document_processor.get_file_metadata(str_path)
            rag_service.document_processor.save_file_registry(processed_dir, file_registry)

        logger.info(f"ディレクトリ '{source_dir}' 内のファイルを処理しました（合計 {len(results)} チャンク）")
        return results

    # 進捗表示付きの処理メソッドに置き換え
    rag_service.document_processor.process_directory = process_directory_with_progress

    # インデックス化を実行
    result = rag_service.index_documents(directory_path, processed_dir, chunk_size, chunk_overlap, incremental)

    # 元のメソッドに戻す
    rag_service.document_processor.process_directory = original_process_directory

    if result["success"]:
        incremental_text = "差分" if incremental else "全て"
        logger.info(
            f"インデックス化が完了しました（{incremental_text}のファイルを処理、{result['document_count']} ドキュメント、{result['processing_time']:.2f} 秒）"
        )
        print(
            f"インデックス化が完了しました（{incremental_text}のファイルを処理）\n"
            f"- ドキュメント数: {result['document_count']}\n"
            f"- 処理時間: {result['processing_time']:.2f} 秒\n"
            f"- メッセージ: {result.get('message', '')}"
        )
    else:
        logger.error(f"インデックス化に失敗しました: {result.get('error', '不明なエラー')}")
        print(
            f"インデックス化に失敗しました\n"
            f"- エラー: {result.get('error', '不明なエラー')}\n"
            f"- 処理時間: {result['processing_time']:.2f} 秒"
        )
        sys.exit(1)


def get_document_count():
    """
    インデックス内のドキュメント数を取得する
    """
    logger = setup_logging()
    logger.info("インデックス内のドキュメント数を取得しています...")

    # JSON設定の読み込み（ENVは上書きせず、戻り値を優先参照）
    project = os.environ.get("PROJECT") or os.environ.get("PROJECT_NAME")
    _ensure_config_loaded(project=project, override_env=False)
    resolved = load_project_config(project=project, override_env=False)

    # Embedding等の重い初期化を避け、DBに直接問い合わせる
    from .vector_database import VectorDatabase

    project = os.environ.get("PROJECT") or os.environ.get("PROJECT_NAME")
    if not project:
        logger.error("PROJECT が未設定です。--project または環境変数 PROJECT を指定してください。")
        print("エラー: PROJECT が未設定です。--project または環境変数 PROJECT を指定してください。")
        sys.exit(2)

    host = resolved.get("POSTGRES_HOST") or os.environ.get("POSTGRES_HOST", "localhost")
    port = int(resolved.get("POSTGRES_PORT") or os.environ.get("POSTGRES_PORT", "5432"))
    user = resolved.get("POSTGRES_USER") or os.environ.get("POSTGRES_USER", "postgres")
    password = resolved.get("POSTGRES_PASSWORD") or os.environ.get("POSTGRES_PASSWORD", "password")
    dbname = resolved.get("POSTGRES_DB") or os.environ.get("POSTGRES_DB", "ragdb")

    conn_params = {
        "host": host,
        "port": port,
        "user": user,
        "password": password,
        "dbname": dbname,
    }

    # スキーマもJSONがあれば優先（VectorDatabaseはENVから参照するため反映）
    if resolved.get("POSTGRES_SCHEMA"):
        os.environ["POSTGRES_SCHEMA"] = resolved["POSTGRES_SCHEMA"]

    # psycopg2.connectのキーワードは dbname だが、VectorDatabase は database キーを想定
    # VectorDatabase に渡すために変換
    vdb_params = {
        "host": conn_params["host"],
        "port": conn_params["port"],
        "user": conn_params["user"],
        "password": conn_params["password"],
        "database": conn_params["dbname"],
    }

    try:
        vdb = VectorDatabase(vdb_params, project=project)
        count = vdb.get_document_count()
        logger.info(f"インデックス内のドキュメント数: {count}")
        print(f"インデックス内のドキュメント数: {count}")
    except Exception as e:
        logger.error(f"ドキュメント数の取得中にエラーが発生しました: {str(e)}")
        print(f"ドキュメント数の取得中にエラーが発生しました: {str(e)}")
        sys.exit(1)


def main():
    """
    メイン関数

    コマンドライン引数を解析し、適切な処理を実行します。
    """
    # Docker限定実行
    _ensure_docker_only()

    # コマンドライン引数の解析
    parser = argparse.ArgumentParser(
        description="MCP RAG Server CLI - インデックスのクリアとインデックス化を行うためのコマンドラインインターフェース"
    )
    parser.add_argument(
        "--project",
        "-p",
        default=os.environ.get("PROJECT") or os.environ.get("PROJECT_NAME"),
        help="対象プロジェクト名（必須。--project または環境変数 PROJECT）",
    )
    subparsers = parser.add_subparsers(dest="command", help="実行するコマンド")

    # clearコマンド
    subparsers.add_parser("clear", help="インデックスをクリアする")

    # indexコマンド
    index_parser = subparsers.add_parser("index", help="ドキュメントをインデックス化する")
    index_parser.add_argument(
        "--directory",
        "-d",
        default=None,  # 既定はparse後にプロジェクト設定から解決
        help=(
            "インデックス化するドキュメントが含まれるディレクトリのパス"
            "（未指定時は config の paths.source_dir > 環境変数 SOURCE_DIR > ./data/source の順で採用）"
        ),
    )
    index_parser.add_argument("--chunk-size", "-s", type=int, default=500, help="チャンクサイズ（文字数）")
    index_parser.add_argument("--chunk-overlap", "-o", type=int, default=100, help="チャンク間のオーバーラップ（文字数）")
    index_parser.add_argument("--incremental", "-i", action="store_true", help="差分のみをインデックス化する")

    # countコマンド
    subparsers.add_parser("count", help="インデックス内のドキュメント数を取得する")

    # projectコマンド
    project_parser = subparsers.add_parser("project", help="プロジェクト管理コマンド")
    project_sub = project_parser.add_subparsers(dest="project_cmd")

    p_init = project_sub.add_parser("init", help="プロジェクトを初期化（設定+スキーマ作成）")
    p_init.add_argument("--name", "-n")
    p_init.add_argument("--source-dir")
    p_init.add_argument("--processed-dir")

    project_sub.add_parser("list", help="定義済みプロジェクト一覧を表示")
    project_sub.add_parser("choose", help="対話的に選択し、標準出力に名前を出力")

    p_profiles = project_sub.add_parser("profiles", help="MCP接続用のプロファイル一覧（JSON）")
    p_profiles.add_argument("--format", choices=["json"], default="json")

    p_delete = project_sub.add_parser("delete", help="プロジェクト削除（設定/スキーマ/ドキュメント）")
    p_delete.add_argument("--name", "-n", help="削除するプロジェクト名（未指定なら選択）")
    p_delete.add_argument("--drop-db", action="store_true", help="スキーマをDROPする（DBは固定）")
    p_delete.add_argument("--delete-processed", action="store_true", help="processedデータを削除（プロジェクト配下）")
    p_delete.add_argument("--delete-source", action="store_true", help="sourceディレクトリも削除（注意）")
    p_delete.add_argument("--yes", "-y", action="store_true", help="確認なしで実行")

    args = parser.parse_args()

    # コマンドに応じた処理を実行
    # プロジェクトを環境変数に反映（サービス作成で参照、未指定なら設定しない）
    if args.project:
        os.environ["PROJECT"] = args.project

    def _require_project():
        proj = os.environ.get("PROJECT") or os.environ.get("PROJECT_NAME")
        if not proj:
            print("エラー: PROJECT が未設定です。--project または環境変数 PROJECT を指定してください。", file=sys.stderr)
            sys.exit(2)
        return proj

    if args.command == "clear":
        _require_project()
        clear_index()
    elif args.command == "index":
        # PROJECT確定と設定読込（外部ENV優先で補完）
        proj = _require_project()
        # 設定を読み込み、ENVは上書きしない（戻り値から明示的に参照する）
        resolved = load_project_config(project=proj, override_env=False)

        # ディレクトリ解決: 引数 > JSON設定(paths.source_dir) > 環境変数 > 既定
        directory = args.directory or resolved.get("SOURCE_DIR") or os.environ.get("SOURCE_DIR") or "./data/source"

        index_documents(directory, args.chunk_size, args.chunk_overlap, args.incremental)
    elif args.command == "count":
        _require_project()
        get_document_count()
    elif args.command == "project":
        if args.project_cmd == "init":
            project_init_interactive(args.name, args.source_dir, args.processed_dir)
        elif args.project_cmd == "list":
            names = _load_projects_from_json()
            if not names:
                print("(none)")
            else:
                print("\n".join(names))
        elif args.project_cmd == "choose":
            project_choose()
        elif args.project_cmd == "profiles":
            _print_mcp_profiles()
        elif args.project_cmd == "delete":
            _project_delete(
                name=args.name,
                drop_db=args.drop_db,
                delete_processed=args.delete_processed,
                delete_source=args.delete_source,
                assume_yes=args.yes,
            )
        else:
            project_parser.print_help()
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
