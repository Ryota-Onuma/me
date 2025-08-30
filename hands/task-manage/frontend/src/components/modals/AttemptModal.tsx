import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { useNavigate } from "react-router-dom";
import { emitToast } from "../../lib/toast";
import { AttemptAPI, ExecAPI, ReposAPI } from "../../api";
import type { Attempt, ProfileDef, RepoBookmark } from "../../types";

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
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileDef[]>([]);
  const [profile, setProfile] = useState<string>("");
  const [repoPath, setRepoPath] = useState("");
  const [base, setBase] = useState("main");
  const [repos, setRepos] = useState<RepoBookmark[]>([]);
  const [repoPick, setRepoPick] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [repoErr, setRepoErr] = useState(false);
  const [baseErr, setBaseErr] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const ps = await ExecAPI.listProfiles();
      setProfiles(ps);
      setProfile(ps[0]?.label || "");
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
            setProfile(last.profile || ps[0]?.label || "");
          } else {
            setRepoPath("");
            setBase("main");
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
    setSubmitting(true);
    try {
      const at = await AttemptAPI.create({
        task_id: taskId,
        profile,
        repo_path: repoPath.trim(),
        base_branch: b,
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
          プロファイル
          <select value={profile} onChange={(e) => setProfile(e.target.value)} disabled={submitting}>
            {profiles.map((p) => (
              <option key={p.label} value={p.label}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <div>
          <button className="ghost" onClick={() => navigate("/settings")}>
            エージェントを作成/管理
          </button>
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
