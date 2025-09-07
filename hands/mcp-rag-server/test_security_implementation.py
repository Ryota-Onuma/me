#!/usr/bin/env python3
"""
セキュリティ実装のテストケース

実装したセキュリティ機能が正常に動作するかをテストします。
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))


def test_security_utils():
    """セキュリティユーティリティのテスト"""
    try:
        from src.security_utils import mask_sensitive_data, safe_log_dict, safe_log_string

        # パスワードマスキングテスト
        test_password = 'password: "mysecretpassword123"'
        masked = mask_sensitive_data(test_password)
        assert "***" in masked
        assert "mysecretpassword123" not in masked
        print("✓ パスワードマスキング正常")

        # 辞書の安全化テスト
        test_dict = {"password": "secret123", "normal_key": "normal_value", "long_value": "a" * 200}
        safe_dict = safe_log_dict(test_dict)
        assert safe_dict["password"] == "***"
        assert safe_dict["normal_key"] == "normal_value"
        assert len(safe_dict["long_value"]) <= 103  # 100 + '...'
        print("✓ 辞書安全化正常")

        # 文字列安全化テスト
        test_string = 'password="secret123" and some very long text that should be truncated'
        safe_string = safe_log_string(test_string, 50)
        assert "***" in safe_string
        assert "secret123" not in safe_string
        assert len(safe_string) <= 53  # 50 + '...'
        print("✓ 文字列安全化正常")

        return True

    except Exception as e:
        print(f"✗ セキュリティユーティリティテスト失敗: {e}")
        return False


def test_document_processor_validation():
    """ドキュメントプロセッサーの検証機能テスト"""
    try:
        from src.document_processor import DocumentProcessor

        processor = DocumentProcessor()

        # ファイルパス検証のテスト（危険なパス）
        try:
            processor._validate_file_path("../../../etc/passwd")
            print("✗ パストラバーサル対策が機能していません")
            return False
        except ValueError:
            print("✓ パストラバーサル対策正常")

        # NUL文字削除のテスト
        test_content = "Normal text\x00\x01\x02with control chars\x1f"
        sanitized = processor._sanitize_content(test_content)
        assert "\x00" not in sanitized
        assert "\x01" not in sanitized
        assert "\x02" not in sanitized
        assert "\x1f" not in sanitized
        assert "Normal text" in sanitized
        assert "with control chars" in sanitized
        print("✓ NUL文字・制御文字削除正常")

        return True

    except Exception as e:
        print(f"✗ ドキュメントプロセッサーテスト失敗: {e}")
        return False


def test_input_validation():
    """入力検証のテスト"""
    try:
        from src.rag_tools import _validate_query_input, _validate_limit

        # クエリ長制限のテスト
        try:
            _validate_query_input("a" * 3000)  # MAX_QUERY_LENGTH (2000) を超過
            print("✗ クエリ長制限が機能していません")
            return False
        except ValueError:
            print("✓ クエリ長制限正常")

        # 空クエリのテスト
        try:
            _validate_query_input("")
            print("✗ 空クエリ検証が機能していません")
            return False
        except ValueError:
            print("✓ 空クエリ検証正常")

        # 制御文字削除のテスト
        query_with_control = "normal query\x00\x01\x1fwith control"
        clean_query = _validate_query_input(query_with_control)
        assert "\x00" not in clean_query
        assert "\x01" not in clean_query
        assert "\x1f" not in clean_query
        print("✓ クエリ制御文字削除正常")

        # 結果数制限のテスト
        try:
            _validate_limit(100)  # MAX_RESULT_LIMIT (50) を超過
            print("✗ 結果数制限が機能していません")
            return False
        except ValueError:
            print("✓ 結果数制限正常")

        return True

    except Exception as e:
        print(f"✗ 入力検証テスト失敗: {e}")
        return False


def main():
    """メイン関数"""
    print("=== MCP RAG Server セキュリティ実装テスト ===\n")

    all_passed = True

    # テスト実行
    tests = [
        ("セキュリティユーティリティ", test_security_utils),
        ("ドキュメントプロセッサー検証", test_document_processor_validation),
        ("入力検証", test_input_validation),
    ]

    for test_name, test_func in tests:
        print(f"[{test_name}] テスト実行中...")
        if test_func():
            print(f"[{test_name}] ✓ 成功\n")
        else:
            print(f"[{test_name}] ✗ 失敗\n")
            all_passed = False

    # 結果まとめ
    if all_passed:
        print("🎉 すべてのセキュリティテストが成功しました！")
        print("\n実装されたセキュリティ機能:")
        print("- ファイルパス検証とパストラバーサル対策")
        print("- 入力サイズ制限（クエリ: 2000文字、結果数: 50件）")
        print("- エラーメッセージの改善（機密情報漏洩防止）")
        print("- ログセキュリティの強化（機密情報自動マスキング）")
        print("- NUL文字・制御文字処理の強化")
        return 0
    else:
        print("❌ 一部のテストが失敗しました。実装を確認してください。")
        return 1


if __name__ == "__main__":
    sys.exit(main())
