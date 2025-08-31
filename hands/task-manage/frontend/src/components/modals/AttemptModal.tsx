import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { emitToast } from "../../lib/toast";
import { API, AttemptAPI, ReposAPI } from "../../api";
import type { Attempt, RepoBookmark } from "../../types";

export default function AttemptModal({
  open,
  taskId,
  onClose,
  onCreated,
}: {
  open: boolean;
  taskId: string | null;
  onClose: () => void;
  onCreated: (attempt: Attempt) => void;
}) {
  const [repoPath, setRepoPath] = useState("");
  const [base, setBase] = useState("main");
  const [repos, setRepos] = useState<RepoBookmark[]>([]);
  const [repoPick, setRepoPick] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [repoErr, setRepoErr] = useState(false);
  const [baseErr, setBaseErr] = useState(false);
  const [branch, setBranch] = useState("");
  const [branchErr, setBranchErr] = useState(false);

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\-_.\s/]+/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "");

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const rs = await ReposAPI.list();
        setRepos(rs);
      } catch {
        setRepos([]);
      }
      if (taskId) {
        try {
          const attempts = await AttemptAPI.list(taskId);
          if (attempts.length > 0) {
            const last = attempts[0];
            setRepoPath(last.repo_path || "");
            setBase(last.base_branch || "main");
          } else {
            setRepoPath("");
            setBase("main");
          }
          // ブランチ名の初期提案: タスクタイトルから生成
          try {
            const t = await API.getTask(taskId);
            const baseName = slugify(t.title || "");
            if (baseName) setBranch(`feature/${baseName}`);
          } catch {
            // 失敗時は未設定のまま
          }
        } catch (e) {
          // 取得に失敗してもフォームは手入力できるため通知のみ控えめに
          console.debug("Failed to preload attempts for task", taskId, e);
        }
      }
    })();
  }, [open, taskId]);

  const create = async () => {
    if (submitting) return;
    if (!taskId) return;
    if (!repoPath.trim()) {
      emitToast("リポジトリパスを入力してください", "error");
      setRepoErr(true);
      return;
    }
    const b = base.trim();
    if (!b) {
      emitToast("ベースブランチを入力してください", "error");
      setBaseErr(true);
      return;
    }
    if (
      !/^[-A-Za-z0-9._/]+$/.test(b) ||
      b.startsWith("/") ||
      b.endsWith("/") ||
      b.includes("//")
    ) {
      emitToast("ベースブランチの形式が不正です", "error");
      setBaseErr(true);
      return;
    }
    const br = branch.trim();
    if (!br) {
      emitToast("ブランチ名を入力してください", "error");
      setBranchErr(true);
      return;
    }
    // 簡易バリデーション（サーバ側でも検証）
    if (
      /[~^:?*\\]/.test(br) || br.includes("[") ||
      br.startsWith("/") ||
      br.endsWith("/") ||
      br.includes("//") ||
      br === "." ||
      br === ".." ||
      br.endsWith(".lock") ||
      br.includes("@{")
    ) {
      emitToast("ブランチ名の形式が不正です", "error");
      setBranchErr(true);
      return;
    }
    setSubmitting(true);
    try {
      const at = await AttemptAPI.create({
        task_id: taskId,
        repo_path: repoPath.trim(),
        base_branch: b,
        branch: br,
      });
      onCreated(at);
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      emitToast("作成に失敗: " + msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title="作業ブランチを作成" onClose={onClose}>
      <div className="form">
        <div style={{ fontSize: 12, color: "#b3c7e6" }}>
          タスクID: <span>{taskId}</span>
        </div>
        <div style={{ fontSize: 12, color: "#8fa7cc", marginTop: 4, marginBottom: 8 }}>
          作業ブランチ＝このタスク向けの開発用ブランチ。ここで作成したブランチに、あとから実行（エージェント起動）を紐づけます。
        </div>
        
        <label>
          リポジトリ
          <div className="row" style={{ gap: 8, alignItems: "end", flexWrap: "wrap" }}>
            <label style={{ flex: 1, minWidth: 220 }}>
              保存済みから選択（任意）
              <select
                value={repoPick}
                onChange={(e) => {
                  const id = e.target.value;
                  setRepoPick(id);
                  const r = repos.find((x) => x.id === id);
                  if (r) {
                    setRepoPath(r.path);
                    if (r.default_base_branch && r.default_base_branch.trim()) {
                      setBase(r.default_base_branch);
                    }
                  }
                }}
                disabled={submitting}
              >
                <option value="">選択しない</option>
                {repos.map((r) => (
                  <option key={r.id} value={r.id}>{`${r.label} — ${r.path}`}</option>
                ))}
              </select>
            </label>
            {repoPick && (
              <div style={{ fontSize: 12, color: "#b3c7e6" }}>
                デフォルトベース: {
                  repos.find((x) => x.id === repoPick)?.default_base_branch || "未設定"
                }
              </div>
            )}
          </div>
        </label>
        {!repoPick ? (
          <label>
            リポジトリパス（手入力）
            <input
              type="text"
              value={repoPath}
              onChange={(e) => {
                setRepoPath(e.target.value);
                if (repoErr && e.target.value.trim()) setRepoErr(false);
              }}
              disabled={submitting}
              placeholder="例: /path/to/repo"
              className={repoErr ? "input--error" : undefined}
            />
          </label>
        ) : (
          <div className="row" style={{ alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 12, color: "#b3c7e6" }}>
              パス: <code style={{ color: "#e5eef7" }}>{repoPath}</code>
            </div>
            <button
              className="ghost"
              onClick={() => {
                setRepoPick("");
                setRepoPath("");
              }}
              disabled={submitting}
            >
              手入力に切り替え
            </button>
          </div>
        )}
        <label>
          ベースブランチ（必須）
          <input
            type="text"
            value={base}
            onChange={(e) => {
              setBase(e.target.value);
              if (baseErr && e.target.value.trim()) setBaseErr(false);
            }}
            disabled={submitting}
            placeholder="main / develop など"
            className={baseErr ? "input--error" : undefined}
          />
        </label>
        <label>
          ブランチ名（必須・手入力）
          <input
            type="text"
            value={branch}
            onChange={(e) => {
              setBranch(e.target.value);
              if (branchErr && e.target.value.trim()) setBranchErr(false);
            }}
            disabled={submitting}
            placeholder="例: feature/fix-login-timeout"
            className={branchErr ? "input--error" : undefined}
          />
        </label>
        <div className="row">
          <button onClick={create} disabled={submitting} className={submitting ? "btnIcon" : undefined}>
            {submitting && <span className="spinner spinner--sm" aria-hidden="true" />}
            {submitting ? "作成中..." : "作成"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
