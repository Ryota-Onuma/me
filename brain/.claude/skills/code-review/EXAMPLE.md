# Example Code Review Output

このファイルは、code-reviewerサブエージェントの実際の出力例です。

---

# Code Review: UserProfile.tsx

## Metadata
- **File**: `src/components/UserProfile.tsx`
- **Language(s)**: TypeScript, React
- **Checklists Applied**: General (11 items), TypeScript (14 items), React (11 items)
- **Total Items**: 36
- **Review Date**: 2025-11-30

---

## Checklist Results

### General Checklist (11 items)

#### ✅ G01: マジックナンバーの排除

**Status**: OK  
**Rationale**: ファイル全体を確認しましたが、マジックナンバーは見つかりませんでした。定数は全て`const`として適切に定義されています。  
**Location**: N/A - no violations found

---

#### ✅ G02: 変数スコープの最適化

**Status**: OK  
**Rationale**: 全ての変数が適切なスコープで定義されています。コンポーネント外で定義されている定数（`PROFILE_SECTIONS`, `DEFAULT_AVATAR`）は他のコンポーネントでも使用される可能性があるため、妥当です。  
**Location**: N/A - no violations found

---

#### ✅ G03: 状態管理の単純化

**Status**: OK  
**Rationale**: カスタムHook `useUserProfile` を使用して状態管理を1つのオブジェクトにまとめています。`{ status: 'loading' | 'success' | 'error', data?, error? }` の形式で、ありえない状態の組み合わせを防いでいます。  
**Location**: `UserProfile.tsx:15-20`

---

#### ✅ G04: 関数の責務の単一性

**Status**: OK  
**Rationale**: 各関数が単一の責務を持っています。`renderProfileHeader`, `renderProfileBody`, `renderProfileFooter` と適切に分割されており、メインコンポーネントは組み立てのみを担当しています。  
**Location**: N/A - no violations found

---

#### ✅ G05: ネストの深さ制限

**Status**: OK  
**Rationale**: 最大ネストは2階層で、Early returnパターンを使用しています。  
**Location**: `UserProfile.tsx:25-28` (ローディング・エラーハンドリング)

---

#### ✅ G06: 命名の明確性

**Status**: OK  
**Rationale**: 全ての変数名・関数名が意図を明確に表現しています。略語や曖昧な名前（`data`, `info`, `temp`等）は使用されていません。  
**Location**: N/A - no violations found

---

#### ✅ G07: 不要なコードの削除

**Status**: OK  
**Rationale**: コメントアウトされたコードや未使用のインポートは見つかりませんでした。  
**Location**: N/A - no violations found

---

#### ✅ G08: 重複コードの削減（DRY + 3の法則）

**Status**: OK  
**Rationale**: プロフィールセクションのレンダリングが`map`を使って共通化されています。重複は2回以下に抑えられています。  
**Location**: `UserProfile.tsx:45-50`

---

#### ✅ G09: エラーハンドリングの適切性

**Status**: OK  
**Rationale**: エラー状態を適切にハンドリングし、ユーザーフレンドリーなメッセージを表示しています。  
**Location**: `UserProfile.tsx:30-32`

---

#### ✅ G10: 早すぎる最適化の回避

**Status**: OK  
**Rationale**: 不要な最適化は見られません。アルゴリズムとデータ構造の選択も適切です。  
**Location**: N/A - no violations found

---

#### ✅ G11: コメントの適正化

**Status**: OK  
**Rationale**: Whatではなく、Whyを説明するコメントのみが使用されています。コードは自己文書化されており、コメント依存度は低いです。  
**Location**: `UserProfile.tsx:60` (複雑なビジネスロジックの理由を説明)

---

### TypeScript Checklist (14 items)

#### ✅ TS01: Exhaustive Check（網羅性チェック）

**Status**: OK  
**Rationale**: ステータス処理のswitch文で全てのケースが網羅されており、default節で`assertNever()`を使用しています。  
**Location**: `UserProfile.tsx:65-75`

---

#### ⚠️ TS06: Non-null assertion（!）の禁止

**Status**: NG  
**Rationale**: Non-null assertion (`!`) が2箇所で使用されています。これは実行時にnull/undefinedだった場合、ランタイムエラーを引き起こします。  
**Location**: `UserProfile.tsx:42`, `UserProfile.tsx:89`

**Current Code**:
```typescript
// Line 42
const displayName = user!.profile!.name

// Line 89
const avatarUrl = settings!.theme.avatar
```

**Suggested Fix**:
```typescript
// Line 42 - Option 1: デフォルト値を使用
const displayName = user?.profile?.name ?? 'Unknown User'

// Line 42 - Option 2: 型ガードで早期リターン
if (!user?.profile?.name) {
  return <ErrorState message="User profile not found" />
}
const displayName = user.profile.name

// Line 89
const avatarUrl = settings?.theme?.avatar ?? '/images/default-avatar.png'
```


---

#### ✅ TS02: any型の削減

**Status**: OK  
**Rationale**: `any`型の使用は見つかりませんでした。全ての型が適切に定義されています。  
**Location**: N/A - no violations found

---

#### ✅ TS03: 型アサーション（as）の最小化

**Status**: OK  
**Rationale**: 型アサーションは1箇所のみで、外部APIレスポンスの型変換に使用されています。これは妥当な使用例です。  
**Location**: `UserProfile.tsx:100`

---

#### ✅ TS05: Union型の活用

**Status**: OK  
**Rationale**: ステータスを`'loading' | 'success' | 'error'`のUnion型で表現しており、型安全性が確保されています。  
**Location**: `UserProfile.tsx:10`

---

#### ✅ TS07: Optional Chaining（?.）とNullish Coalescing（??）の活用

**Status**: OK  
**Rationale**: TS06の問題箇所を除き、適切に`?.`と`??`を使用しています。  
**Location**: `UserProfile.tsx:50, 55, 78`

---

#### ✅ TS08: constの優先

**Status**: OK  
**Rationale**: 再代入が必要な変数以外は全て`const`で定義されています。  
**Location**: N/A - no violations found

---

#### ✅ TS09: readonlyの活用

**Status**: OK  
**Rationale**: Propsインターフェースで適切に`readonly`が使用されています。  
**Location**: `UserProfile.tsx:5-8`

---

#### ✅ TS11: 戻り値の型の明示

**Status**: OK  
**Rationale**: 全ての関数で戻り値の型が明示されています。  
**Location**: N/A - no violations found

---

#### ✅ TS12: 分割代入の活用

**Status**: OK  
**Rationale**: Propsやオブジェクトから値を取り出す際に分割代入を適切に使用しています。  
**Location**: `UserProfile.tsx:23, 45`

---

#### ✅ TS13: type vs interfaceの使い分け

**Status**: OK  
**Rationale**: Union型には`type`、オブジェクト形状には`interface`を使い分けています。  
**Location**: `UserProfile.tsx:5-12`

---

#### ✅ TS14: Utility Typesの活用

**Status**: OK  
**Rationale**: `Pick<User, 'id' | 'name'>`や`Partial<Settings>`を適切に使用しています。  
**Location**: `UserProfile.tsx:8, 90`

---

#### ✅ TS04: アサーション関数（asserts）の活用

**Status**: OK  
**Rationale**: アサーション関数は不要なシンプルな実装です。  
**Location**: N/A - not applicable

---

#### ✅ TS10: as constの活用

**Status**: OK  
**Rationale**: 定数配列`PROFILE_SECTIONS`で`as const`を使用し、リテラル型として扱っています。  
**Location**: `UserProfile.tsx:3`

---

### React Checklist (11 items)

#### ✅ R01: コンポーネントの責務分離

**Status**: OK  
**Rationale**: UIの表示を担当する`UserProfile`コンポーネントと、ロジックを担当する`useUserProfile`カスタムHookが適切に分離されています。  
**Location**: N/A - no violations found

---

#### ⚠️ R02: Hooksの依存配列

**Status**: NG  
**Rationale**: `useEffect`の依存配列が不完全です。`userId`や`fetchUserData`が含まれていません。  
**Location**: `UserProfile.tsx:58-62`

**Current Code**:
```typescript
useEffect(() => {
  fetchUserData(userId)
}, []) // userIdが変わっても再実行されない
```

**Suggested Fix**:
```typescript
// fetchUserDataをuseCallbackでメモ化
const fetchUserData = useCallback((id: string) => {
  // データ取得処理
}, [])

useEffect(() => {
  fetchUserData(userId)
}, [userId, fetchUserData]) // 依存関係を明示
```


---

#### ✅ R03: 不要なuseEffectの排除

**Status**: OK  
**Rationale**: 全ての`useEffect`が適切に副作用（データ取得）のために使用されています。派生データの計算には使用されていません。  
**Location**: N/A - no violations found

---

#### ✅ R04: カスタムHooksの活用

**Status**: OK  
**Rationale**: データ取得ロジックが`useUserProfile`カスタムHookに適切に抽出されています。  
**Location**: `UserProfile.tsx:15`

---

#### 🔶 R05: メモ化の適切な使用

**Status**: CONDITIONAL  
**Rationale**: `useMemo`でフォーマット済み日付をメモ化していますが、`formatDate`は軽量な関数と思われます。ただし、コメントで「大量のデータ処理のため」と記載されており、パフォーマンス計測に基づいた最適化であることが示唆されています。  
**Location**: `UserProfile.tsx:70-72`  
**Notes**: 計測結果をコメントに追記することで、将来のレビューアーが判断しやすくなります。

---

#### ✅ R06: Stateの最小化

**Status**: OK  
**Rationale**: 全てのStateが本当に必要なものです。派生データは計算で求めています。  
**Location**: N/A - no violations found

---

#### ✅ R07: リストのKey

**Status**: OK  
**Rationale**: `map`でレンダリングする際、各アイテムのユニークな`id`を`key`に使用しています。  
**Location**: `UserProfile.tsx:85-89`

---

#### ✅ R08: 条件付きレンダリングの注意

**Status**: OK  
**Rationale**: 全ての条件付きレンダリングで、boolean値または比較演算子を使用しています。falsyな値による誤表示のリスクはありません。  
**Location**: `UserProfile.tsx:25, 30, 45`

---

#### ✅ R09: Prop Drillingの回避

**Status**: OK  
**Rationale**: Prop Drillingは2階層以下に抑えられています。深い階層のコンポーネントはContextを使用しています。  
**Location**: N/A - no violations found

---

#### ✅ R10: フラグメントの活用

**Status**: OK  
**Rationale**: 不要な`div`ラッパーは使用されておらず、適切に`<>...</>`（Fragment）を使用しています。  
**Location**: `UserProfile.tsx:80`

---

#### ✅ R11: 適切なHooksルール遵守

**Status**: OK  
**Rationale**: 全てのHooksがトップレベルで呼び出されています。条件分岐内での呼び出しはありません。  
**Location**: N/A - no violations found

---

## Summary

### Statistics
- **Total Checklist Items**: 36
- **✅ OK**: 32 (88.9%)
- **⚠️ NG**: 2 (5.6%)
- **🔶 CONDITIONAL**: 2 (5.6%)

### Action Required

#### 🚨 Critical Issues
1. **TS06**: Non-null assertion使用 - `UserProfile.tsx:42, 89` - ランタイムエラーのリスク

#### ⚠️ Other Issues
2. **R02**: Hooksの依存配列不完全 - `UserProfile.tsx:58-62` - バグの可能性

#### 💡 Low / Conditional
3. **R05**: メモ化 - `UserProfile.tsx:70-72` - 計測結果をコメントに追記推奨

### Overall Assessment

**Quality Score**: 8.5/10  
**Recommendation**: **NEEDS CHANGES** - Critical問題を修正後にマージ可能

**総評**:
全体的なコード品質は非常に高いです。特に以下の点が優れています：

**✨ 優れている点**:
- TypeScriptの型定義が適切で、型安全性が確保されている
- Reactコンポーネントの責務分離が明確（UIとロジックの分離）
- カスタムHook（`useUserProfile`）の活用が適切
- 変数名・関数名が意図を明確に表現している
- エラーハンドリングが丁寧
- テストコードが充実している（境界値テスト含む）

**⚠️ 改善が必要な点**:
1. **Critical**: Non-null assertionの使用（2箇所）
   - 実運用でnull/undefinedが発生した際、アプリケーションがクラッシュします
   - Optional ChainingとNullish Coalescingで安全に書き換えてください

2. **High**: `useEffect`の依存配列が不完全
   - `userId`が変更されてもデータの再取得が行われません
   - 古いユーザーのデータが表示され続ける可能性があります

**📋 次のステップ**:
1. 42行目と89行目のNon-null assertionをOptional Chainingに変更
2. 58-62行目の`useEffect`の依存配列に`userId`と`fetchUserData`を追加
3. （オプション）70-72行目のメモ化について、計測結果をコメントに追記
4. 修正後、再レビューを依頼

**🎓 学びのポイント**:
- Non-null assertion（`!`）は「絶対にnullにならない」という開発者の約束ですが、実行時にはチェックされません。TypeScriptは開発時のみ動作するため、実行時の安全性を保証しません。Optional ChainingやNullish Coalescingを使うことで、実行時も安全なコードになります。
- `useEffect`の依存配列はESLintの警告を無視せず、必ず正しく設定してください。これがReactの再レンダリング最適化の基礎です。

---

**レビュー実施者**: @code-reviewer  
**レビュー日時**: 2025-11-30 15:00  
**使用スキル**: code-review v2.0
