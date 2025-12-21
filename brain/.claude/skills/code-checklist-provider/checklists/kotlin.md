# Kotlin Checklist

Kotlin特有のNull安全性と型安全性に関するチェック項目。

## K01: 可視性修飾子の最小化
**目的**: カプセル化を強化
**チェック内容**:
- 外部に公開する必要がないものを`private`または`internal`にできないか
**判定基準**:
- ✅ OK: 適切に可視性が制限されている
- ⚠️ NG: 不必要にpublicになっている
- 🔶 CONDITIONAL: 将来の拡張性を見越したpublic

## K02: コンパイル時定数化
**目的**: パフォーマンス向上
**チェック内容**:
- `val`で定義されている不変の定数を`const val`にできないか
**判定基準**:
- ✅ OK: プリミティブ型・String型の定数が`const val`
- ⚠️ NG: コンパイラ時定数化可能な値が`val`
- 🔶 CONDITIONAL: 実行時に決まる値

## K03: 代数的データ型（ADT）の適用
**目的**: 型で状態を表現し、安全性を向上
**チェック内容**:
- `sealed interface`/`sealed class`とパターンマッチ（`when`式）を使っているか
- nullable型（`?`）が実は異なる状態を表現していないか
**判定基準**:
- ✅ OK: 適切にsealed classで状態を表現
- ⚠️ NG: nullable型で複数の状態を混在
- 🔶 CONDITIONAL: シンプルなnull許容で十分

## K04: Exhaustive Check（網羅性チェック）
**目的**: 新ケース追加時にコンパイラが検出
**チェック内容**:
- `sealed class`/`sealed interface`を`when`式で扱う際、`else`なしで全ケースを列挙しているか
**判定基準**:
- ✅ OK: else節なしで全ケースを列挙
- ⚠️ NG: else節で網羅性チェックを回避
- 🔶 CONDITIONAL: 意図的に一部のケースのみ処理

## K05: 値オブジェクト化
**目的**: 型安全性を高める
**チェック内容**:
- プリミティブ型をラップして`value class`を使っているか
**判定基準**:
- ✅ OK: 適切にvalue classを使用
- ⚠️ NG: IDやEmailなどを生のStringで扱う
- 🔶 CONDITIONAL: シンプルなドメインで型の恩恵が少ない

## K06: 不要な関数呼び出しの削減
**目的**: パフォーマンス向上
**チェック内容**:
- 常に同じ固定値を返すだけの関数を定数にできないか
**判定基準**:
- ✅ OK: 固定値は定数として定義
- ⚠️ NG: 固定値を返す関数
- 🔶 CONDITIONAL: 将来の拡張性を見越した関数

## K07: データクラスのコピー制御
**目的**: 不正なコピーを防ぐ
**チェック内容**:
- `@ConsistentCopyVisibility`と`private constructor`を使っているか
**判定基準**:
- ✅ OK: 適切にコピー制御
- ⚠️ NG: コピー制御なし
- 🔶 CONDITIONAL: シンプルなDTOで制御不要

## K08: Null安全性の徹底
**目的**: ランタイムエラーを防ぐ
**チェック内容**:
- `!!`演算子を使っていないか
- `requireNotNull()`/`checkNotNull()`を使っていないか
- デフォルト値、`?:`、`?.let`で対応しているか
**判定基準**:
- ✅ OK: 上記3つの方法のみで対応
- ⚠️ NG: `!!`または`requireNotNull/checkNotNull`使用
- 🔶 CONDITIONAL: なし（この項目は常にNGまたはOK）

## K09: lateinitの最小化
**目的**: Null安全性を保つ
**チェック内容**:
- `lateinit`をnullable型や`lazy`で代替できないか
**判定基準**:
- ✅ OK: lateinitが最小限またはゼロ
- ⚠️ NG: 代替可能なlateinit
- 🔶 CONDITIONAL: DIフレームワークによる不可避なlateinit
