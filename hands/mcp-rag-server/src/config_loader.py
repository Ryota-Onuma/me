"""
JSONベースの設定ローダ

-.env と環境変数を補完する形で JSON 設定を読み込みます。
- 既存コードへの影響を最小化するため、既定では既存の環境変数を上書きしません。
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, Optional


def _expand_to_env(settings: Dict[str, Any]) -> Dict[str, str]:
    """
    ネスト構造の設定を既存コードが参照する環境変数キーへ展開。

    サポートするキー:
    - postgres: { host, port, user, password, db }
    - paths: { source_dir, processed_dir }
    - embedding: { model, prefix_query, prefix_embedding, dim }
    - logging: { enable_file_logging }
    - env: { 任意のENV名: 値 }（そのまま注入）
    - project/name: プロジェクト名
    さらに、フラットなキーはそのまま（ENV名前提）で扱う。
    """
    out: Dict[str, str] = {}

    # そのままenvに流用できるフラットキー
    for k, v in settings.items():
        if isinstance(v, (dict, list)):
            continue
        # 値は文字列化して保存
        out[k] = str(v)

    # 専用セクションのマッピング
    pg = settings.get("postgres", {})
    if isinstance(pg, dict):
        if "host" in pg:
            out.setdefault("POSTGRES_HOST", str(pg["host"]))
        if "port" in pg:
            out.setdefault("POSTGRES_PORT", str(pg["port"]))
        if "user" in pg:
            out.setdefault("POSTGRES_USER", str(pg["user"]))
        if "password" in pg:
            out.setdefault("POSTGRES_PASSWORD", str(pg["password"]))
        # DBは固定運用とするためJSONからは設定しない
        # スキーマはプロジェクト単位で許可
        if "schema" in pg:
            out.setdefault("POSTGRES_SCHEMA", str(pg["schema"]))

    paths = settings.get("paths", {})
    if isinstance(paths, dict):
        if "source_dir" in paths:
            out.setdefault("SOURCE_DIR", str(paths["source_dir"]))
        if "processed_dir" in paths:
            out.setdefault("PROCESSED_DIR", str(paths["processed_dir"]))

    emb = settings.get("embedding", {})
    if isinstance(emb, dict):
        if "model" in emb:
            out.setdefault("EMBEDDING_MODEL", str(emb["model"]))
        if "prefix_query" in emb:
            out.setdefault("EMBEDDING_PREFIX_QUERY", str(emb["prefix_query"]))
        if "prefix_embedding" in emb:
            out.setdefault("EMBEDDING_PREFIX_EMBEDDING", str(emb["prefix_embedding"]))
        if "dim" in emb:
            out.setdefault("EMBEDDING_DIM", str(emb["dim"]))

    log = settings.get("logging", {})
    if isinstance(log, dict) and "enable_file_logging" in log:
        out.setdefault("ENABLE_FILE_LOGGING", str(log["enable_file_logging"]).lower())

    env = settings.get("env", {})
    if isinstance(env, dict):
        for k, v in env.items():
            out.setdefault(k, str(v))

    # プロジェクト名（存在すれば）
    project = settings.get("project") or settings.get("name")
    if project is not None:
        out.setdefault("PROJECT", str(project))

    return out


def _select_settings(data: Dict[str, Any], project: Optional[str]) -> Dict[str, Any]:
    """
    ルートのJSONから対象プロジェクトの設定のみを返す。

    - projects がある場合: project が必須。見つからなければ空を返す。
    - profiles がある場合: project が必須。見つからなければ空を返す。
    - それ以外: フラット設定としてそのまま返す。
    """
    if not isinstance(data, dict):
        return {}

    projects = data.get("projects")
    if isinstance(projects, dict):
        if not project:
            return {}
        proj_settings = projects.get(project)
        return dict(proj_settings) if isinstance(proj_settings, dict) else {}

    profiles = data.get("profiles")
    if isinstance(profiles, dict):
        if not project:
            return {}
        prof_settings = profiles.get(project)
        return dict(prof_settings) if isinstance(prof_settings, dict) else {}

    # それ以外はフラットな設定とみなす
    return data


def _detect_config_path(project: Optional[str], explicit_path: Optional[str]) -> Optional[Path]:
    """設定ファイルの探索順を決める。"""
    if explicit_path:
        p = Path(explicit_path)
        return p if p.exists() else None

    # 環境変数 CONFIG_PATH 優先
    env_path = os.getenv("CONFIG_PATH")
    if env_path:
        p = Path(env_path)
        if p.exists():
            return p

    # 探索候補
    candidates = []
    if project:
        candidates.append(Path("config") / f"{project}.json")
    candidates.extend(
        [
            Path("config") / "project.json",
            Path("config.json"),
        ]
    )

    for c in candidates:
        if c.exists():
            return c
    return None


def load_project_config(
    project: Optional[str] = None,
    config_path: Optional[str] = None,
    *,
    override_env: bool = False,
) -> Dict[str, str]:
    """
    JSON設定を読み込み、環境変数へ反映。

    優先順位（高→低）: 既存環境変数/CLI > JSON > デフォルト値（コード側）

    Args:
        project: プロジェクト名（プロファイル選択に使用）
        config_path: 明示的なJSONパス（未指定なら自動探索）
        override_env: Trueなら既存の環境変数も上書き

    Returns:
        実際に注入した（または解決した）ENVマップ
    """
    path = _detect_config_path(project, config_path)
    if not path:
        return {}

    try:
        with path.open("r", encoding="utf-8") as f:
            raw = json.load(f)
    except Exception:
        # 壊れた設定は無視（安全側）
        return {}

    selected = _select_settings(raw, project)
    env_map = _expand_to_env(selected)

    for k, v in env_map.items():
        if override_env or os.getenv(k) is None:
            os.environ[k] = v

    return env_map
