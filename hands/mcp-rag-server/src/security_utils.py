"""ログ出力の機密情報をマスキングするユーティリティ。"""

import re
from typing import Any, Dict


def mask_sensitive_data(data: str) -> str:
    """
    機密情報をマスキングします。

    Args:
        data: マスキング対象の文字列

    Returns:
        機密情報がマスキングされた文字列
    """
    if not isinstance(data, str):
        return str(data)

    masked = data

    masked = re.sub(r'(password["\s]*[:=]["\s]*)([^"\s,}]+)', r"\1***", masked, flags=re.IGNORECASE)
    masked = re.sub(r'(token["\s]*[:=]["\s]*)([^"\s,}]+)', r"\1***", masked, flags=re.IGNORECASE)
    masked = re.sub(r'(api[_-]?key["\s]*[:=]["\s]*)([^"\s,}]+)', r"\1***", masked, flags=re.IGNORECASE)
    masked = re.sub(r"(://[^:]+:)([^@]+)(@)", r"\1***\3", masked)
    masked = re.sub(r"(/Users/[^/]+)", r"/Users/***", masked)
    masked = re.sub(r"(/home/[^/]+)", r"/home/***", masked)

    return masked


def safe_log_dict(data: Dict[str, Any], max_value_length: int = 100) -> Dict[str, Any]:
    """
    ログ出力用に辞書データを安全化します。

    Args:
        data: 安全化する辞書
        max_value_length: 値の最大長

    Returns:
        安全化された辞書
    """
    safe_dict = {}

    for key, value in data.items():
        if any(sensitive in key.lower() for sensitive in ["password", "token", "key", "secret", "auth"]):
            safe_dict[key] = "***"
        elif isinstance(value, str):
            masked_value = mask_sensitive_data(value)
            if len(masked_value) > max_value_length:
                safe_dict[key] = masked_value[:max_value_length] + "..."
            else:
                safe_dict[key] = masked_value
        elif isinstance(value, dict):
            safe_dict[key] = safe_log_dict(value, max_value_length)
        elif isinstance(value, list):
            if len(value) > 5:
                safe_dict[key] = f"[{len(value)} items]"
            else:
                safe_dict[key] = [
                    safe_log_dict(item, max_value_length)
                    if isinstance(item, dict)
                    else mask_sensitive_data(str(item))[:max_value_length]
                    if isinstance(item, str)
                    else item
                    for item in value
                ]
        else:
            safe_dict[key] = value

    return safe_dict


def safe_log_string(text: str, max_length: int = 200) -> str:
    """
    ログ出力用に文字列を安全化します。

    Args:
        text: 安全化する文字列
        max_length: 最大長

    Returns:
        安全化された文字列
    """
    if not isinstance(text, str):
        text = str(text)

    masked = mask_sensitive_data(text)
    if len(masked) > max_length:
        return masked[:max_length] + "..."

    return masked


def create_safe_logger_wrapper(logger):
    """
    ロガーのラッパーを作成して機密情報を自動的にマスキングします。

    Args:
        logger: 元のロガーインスタンス

    Returns:
        セキュアなロガーラッパー
    """

    class SafeLoggerWrapper:
        def __init__(self, original_logger):
            self._logger = original_logger

        def _safe_format(self, message: str, *args) -> str:
            """メッセージを安全にフォーマットします"""
            try:
                if args:
                    safe_args = []
                    for arg in args:
                        if isinstance(arg, dict):
                            safe_args.append(safe_log_dict(arg))
                        elif isinstance(arg, str):
                            safe_args.append(safe_log_string(arg))
                        else:
                            safe_args.append(arg)
                    formatted = message % tuple(safe_args)
                else:
                    formatted = message
                return safe_log_string(formatted)
            except Exception:
                return safe_log_string(str(message))

        def debug(self, message, *args):
            self._logger.debug(self._safe_format(message, *args))

        def info(self, message, *args):
            self._logger.info(self._safe_format(message, *args))

        def warning(self, message, *args):
            self._logger.warning(self._safe_format(message, *args))

        def error(self, message, *args):
            self._logger.error(self._safe_format(message, *args))

        def critical(self, message, *args):
            self._logger.critical(self._safe_format(message, *args))

        def __getattr__(self, name):
            return getattr(self._logger, name)

    return SafeLoggerWrapper(logger)
