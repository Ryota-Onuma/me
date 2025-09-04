# gws-from-cmd.zsh — README

## 概要

`gws-from-cmd.zsh` は、**外部コマンド（既定: `checkout-new.sh`）が出力したブランチ名をそのまま使って `git worktree` を作成／再利用するスクリプト**です。
ワークツリー管理をシンプルにし、生成コマンドから得たブランチを即座に開発環境として利用できます。

---

## インストール

1. このリポジトリから `gws-from-cmd.zsh` を取得
2. 実行権限を付与

   ```bash
   chmod +x gws-from-cmd.zsh
   ```

3. `$PATH` に置くか、プロジェクト内で直接実行

---

## 使い方

### 基本

```bash
./gws-from-cmd.zsh
```

- `checkout-new.sh` を実行
- その標準出力の最初の非空行をブランチ名として採用
- ワークツリーを作成／再利用
- ワークツリーのパスを出力

### generator に引数を渡す

```bash
./gws-from-cmd.zsh -- --type feature --ticket 1234
```

### 作成したワークツリーに移動

親シェルのディレクトリは変更できないため、次のように利用します:

```bash
cd "$(./gws-from-cmd.zsh -q -- --type feature)"
```

### 直接ワークツリーで新しいシェルを開く

```bash
./gws-from-cmd.zsh --spawn
```

---

## オプション

| オプション       | 説明                                                                           |
| ---------------- | ------------------------------------------------------------------------------ |
| `--gen=PATH`     | ブランチ名生成コマンドを指定（既定: `checkout-new.sh`）                        |
| `--remote=NAME`  | リモート名（既定: `origin`）                                                   |
| `--base=BRANCH`  | ベースブランチ（既定: 自動判定: `main` → `master` → `develop` → 現在ブランチ） |
| `--base-dir=DIR` | ワークツリーの格納ルート（既定: `~/.git-workspaces`）                          |
| `--no-fetch`     | `git fetch --prune` をスキップ                                                 |
| `--dirty`        | 未コミット変更があっても続行                                                   |
| `-q, --quiet`    | ワークツリーパスのみを出力（`cd "$(…)"` 向け）                                 |
| `--spawn`        | ワークツリーで新しいシェルを開く                                               |
| `-h, --help`     | ヘルプ表示                                                                     |

---

## 環境変数

- `GWS_GEN_CMD` … 生成コマンド（例: `/path/to/checkout-new.sh`）
- `GWS_REMOTE` … リモート名
- `GWS_BASE` … ベースブランチ
- `GWS_BASE_DIR` … ワークツリーの格納ルート

---

## 動作フロー

1. 生成コマンドを実行し、ブランチ名を取得
2. `git check-ref-format` で妥当性チェック
3. 既存の worktree を探す

   - あれば再利用
   - 無ければブランチを作成し worktree を追加

4. ワークツリーのパスを出力（オプションにより挙動変更）

---

## 使用例

```bash
# 通常利用
./gws-from-cmd.zsh

# develop をベースにする
./gws-from-cmd.zsh --base=develop

# generator を差し替え
GWS_GEN_CMD=/usr/local/bin/branch-gen ./gws-from-cmd.zsh

# 生成コマンドの出力ブランチを再利用
./gws-from-cmd.zsh --remote=upstream --dirty
```

---

## 注意事項

- **生成コマンドはブランチ名のみを標準出力**に出すことを推奨（ログは標準エラーへ）。
- 親シェルのカレントディレクトリは変更できません。`-q` オプションや `--spawn` を利用してください。
- ワークツリー削除 (`git worktree remove`) は本スクリプトには含まれていません。必要なら別途コマンドを組み合わせてください。

---

👉 この README をプロジェクトのトップに置けば、すぐに利用可能です。
