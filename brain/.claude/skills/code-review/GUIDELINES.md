# Review Evaluation Guidelines

このファイルは、各チェックリスト項目を評価する際の詳細なガイドラインです。

## 評価の3ステータス

### ✅ OK (合格)
**定義**: チェック項目の基準を完全に満たしている状態

**記載内容**:
- **Status**: OK
- **Rationale**: なぜこの項目が合格なのか、具体的な理由
- **Location**: 該当箇所（問題がないため「N/A - no violations found」でも可）

**例**:
```markdown
#### ✅ Non-null assertion（!）の禁止

**Status**: OK  
**Rationale**: ファイル全体を検索したが、Non-null assertion (`!`) の使用は見つかりませんでした。全てのnull許容型の処理でOptional Chaining (`?.`) またはNullish Coalescing (`??`) が適切に使用されています。  
**Location**: N/A - no violations found
```

---

### ⚠️ NG (不合格)
**定義**: チェック項目の基準に違反している状態

**記載内容**:
- **Status**: NG
- **Rationale**: なぜこの項目がNGなのか、具体的な問題点
- **Location**: 問題箇所のファイル名と行番号
- **Current Code**: 現在の問題のあるコード
- **Suggested Fix**: 修正後のコード例


**例**:
```markdown
#### ⚠️ Non-null assertion（!）の禁止

**Status**: NG  
**Rationale**: Non-null assertion (`!`) が使用されています。これは実行時にnull/undefinedの可能性を無視するため、ランタイムエラーの原因になります。  
**Location**: `src/components/UserProfile.tsx:42`

**Current Code**:
```typescript
const displayName = user!.profile!.name
```

**Suggested Fix**:
```typescript
const displayName = user?.profile?.name ?? 'Unknown User'
```


```

---

### 🔶 CONDITIONAL (条件付き合格)
**定義**: 部分的に基準を満たしている、または文脈に依存する状態

**記載内容**:
- **Status**: CONDITIONAL
- **Rationale**: どのような条件下で合格とみなせるか、または何が不足しているか
- **Location**: 該当箇所
- **Notes**: 追加の文脈や考慮事項

**使用ケース**:
1. **意図的な逸脱**: ベストプラクティスから逸脱しているが、コメントで理由が説明されている
2. **トレードオフ**: パフォーマンスや他の要件とのトレードオフがある
3. **部分的準拠**: 一部は基準を満たしているが、一部は満たしていない
4. **文脈依存**: プロジェクトの性質や要件によって判断が分かれる

**例1: 意図的な逸脱**:
```markdown
#### 🔶 lateinitの最小化

**Status**: CONDITIONAL  
**Rationale**: `lateinit`が使用されていますが、Dagger/Hiltによる依存性注入のため不可避です。コメントでその旨が明記されています。  
**Location**: `src/MainActivity.kt:25`  
**Notes**: DIフレームワークの制約による使用のため許容可能。ただし、`::viewModel.isInitialized`でのチェックが実装されていることを確認しました。
```

**例2: パフォーマンストレードオフ**:
```markdown
#### 🔶 不要なuseEffectの排除

**Status**: CONDITIONAL  
**Rationale**: 派生データを`useEffect`でStateにセットしていますが、計算コストが高い（大量のデータのフィルタリング）ため、意図的にキャッシュしています。  
**Location**: `src/hooks/useFilteredData.ts:15-20`  
**Notes**: パフォーマンス計測に基づいた最適化であることがコメントで示されています。ただし、将来的には`useMemo`への移行を検討すべきです。
```

---

## 評価プロセス

### Step 1: コード検索
各チェック項目に対して、該当するパターンをコード全体から検索。

**検索方法**:
- 正規表現検索
- AST (Abstract Syntax Tree) 解析
- 静的解析ツールの活用

**例 (Non-null assertion検索)**:
```bash
# TypeScriptファイルで ! の使用を検索
grep -n "!\." src/**/*.ts src/**/*.tsx
```

---

### Step 2: 文脈の理解
発見した箇所について、以下を確認：

1. **なぜそのコードが存在するのか** - コメント、関数名、周辺コードから意図を読み取る
2. **何を達成しようとしているのか** - ビジネスロジックや技術的要求を理解
3. **代替手段はあるか** - より良い実装方法が存在するか検討

---

### Step 3: 基準との照合
チェックリストの判定基準と照らし合わせる。

**判定フローチャート**:
```
基準を完全に満たしている？
├─ Yes → ✅ OK
└─ No
   ├─ 意図的な逸脱で理由が明確？
   │  └─ Yes → 🔶 CONDITIONAL
   └─ No → ⚠️ NG
```

---



---

### Step 4: 改善提案の作成（NGの場合）
Before/Afterのコード例を含む具体的な提案。

**良い提案の条件**:
1. **実行可能**: すぐに適用できる具体的なコード
2. **理由の説明**: なぜその変更が必要か
3. **影響範囲の明示**: 変更による副作用の有無
4. **代替案の提示**: 可能であれば複数の選択肢

**例**:
```markdown
**Suggested Fix (Option 1)**:
```typescript
// Optional Chainingを使用
const displayName = user?.profile?.name ?? 'Unknown User'
```

**Suggested Fix (Option 2)**:
```typescript
// 型ガードを使用
if (!user?.profile?.name) {
  return <div>Loading...</div>
}
const displayName = user.profile.name
```

**Trade-offs**:
- Option 1: より簡潔だが、デフォルト値を返す
- Option 2: より明示的だが、早期リターンが必要
```

---

## 言語別の特殊な評価ポイント

### TypeScript
- **型推論の活用**: 過度な型注釈は不要だが、関数の戻り値は明示すべき
- **strictモードの前提**: `strict: true`が有効であることを前提に評価
- **ライブラリの型定義**: 外部ライブラリの型不足は`any`を許容する場合がある

### React
- **Reactバージョン**: Hooks前提で評価（クラスコンポーネントは旧式）
- **パフォーマンス**: 計測なしのメモ化はNG、計測に基づくメモ化はOK
- **Server Components**: Next.js 13+ではServer/Client Componentsの区別を考慮

### Kotlin
- **Kotlinバージョン**: 最新の安定版を前提（value class等の新機能を推奨）
- **Androidとサーバーサイド**: Androidの場合、ライフサイクルを考慮
- **Coroutines**: 非同期処理はCoroutinesを前提

### SQL
- **DBMSの方言**: PostgreSQL/MySQL/SQLiteなど、DBMSによって評価を調整
- **パフォーマンス**: データ量の規模を考慮（小規模ならインデックス不要な場合も）
- **ORM**: ORMを使用している場合、生SQLとは異なる評価

---

## エッジケースの扱い

### Case 1: テストコード
本番コードより基準を緩和する場合がある。

**例**:
- マジックナンバー: テストデータでは`age = 25`のようなリテラルを許容
- 型アサーション: モックやスタブでは`as`の使用を許容

### Case 2: レガシーコード
段階的な改善を考慮。

**評価方針**:
- 新規追加コードは厳格に評価
- 既存コードの修正は影響範囲を考慮
- CONDITIONALで「レガシー部分の技術的負債」と明記

### Case 3: プロトタイプ
品質とスピードのトレードオフ。

**評価方針**:
- Criticalな問題（セキュリティ、データ破損）は厳格に評価
- その他の項目は緩和するが、コメントで「プロトタイプのため改善予定」を推奨

---

## レビューコメントのトーン

### 建設的であること
```
❌ NG: "このコードはダメです。"
✅ OK: "このコードは Non-null assertion を使用しているため、実行時エラーのリスクがあります。Optional Chaining に変更することで安全性が向上します。"
```

### 具体的であること
```
❌ NG: "パフォーマンスが悪いです。"
✅ OK: "N+1問題が発生しています (UserService.kt:45)。ループ内でクエリを実行すると、100件のユーザーに対して101回のDB接続が発生します。JOINを使用することで1回のクエリで済みます。"
```

### バランスを取ること
良い実装も積極的に指摘：
```
✅ GOOD: "useCallback の依存配列が完璧に設定されています。このパターンは他のコンポーネントでも参考にできます。"
```

---

## まとめ

**評価の原則**:
1. **客観性**: 個人の好みではなく、基準に基づいて評価
2. **一貫性**: 同じ基準を全てのコードに適用
3. **文脈考慮**: 機械的な適用ではなく、プロジェクトの文脈を理解
4. **建設性**: 問題指摘だけでなく、解決策を提示
5. **教育性**: レビューを学びの機会にする

**目指すレビュー**:
- 開発者が成長する
- コードベースの品質が向上する
- チーム全体の知識が共有される
- 技術的負債が可視化される

---

**更新日**: 2025-11-30  
**バージョン**: 2.0.0
