import React, { useEffect, useMemo, useState } from "react";
import { AttemptAPI } from "../api";
import type { Attempt, BranchStatus, Task } from "../types";

export default function TaskDetailsPanel({
  task,
  attemptsTaskId,
  onClose,
  onEdit,
  onDelete,
  onCreateAttempt,
  onOpenAttempt,
}: {
  task: Task | null;
  attemptsTaskId: string | null;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onCreateAttempt: (task: Task) => void;
  onOpenAttempt: (attempt: Attempt) => void;
}) {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branchStatus, setBranchStatus] = useState<BranchStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!attemptsTaskId) {
        setAttempts([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const list = await AttemptAPI.list(attemptsTaskId);
        if (!cancelled) setAttempts(list);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [attemptsTaskId]);

  // Load latest attempt branch status
  useEffect(() => {
    const fetchStatus = async () => {
      if (!attempts.length) {
        setBranchStatus(null);
        return;
      }
      const latest = attempts[0];
      try {
        setStatusLoading(true);
        const st = await AttemptAPI.status(latest.id);
        setBranchStatus(st);
      } catch {
        setBranchStatus(null);
      } finally {
        setStatusLoading(false);
      }
    };
    void fetchStatus();
  }, [attempts]);

  if (!task) return null;

  const date = (s: string) => new Date(s).toLocaleString();
  const branchText = useMemo(() => {
    if (!branchStatus) return "";
    const rb =
      branchStatus.remote_commits_behind == null
        ? "N/A"
        : branchStatus.remote_commits_behind;
    const ra =
      branchStatus.remote_commits_ahead == null
        ? "N/A"
        : branchStatus.remote_commits_ahead;
    return `ブランチ状態: base=${branchStatus.base_branch_name} / behind=${branchStatus.commits_behind} ahead=${branchStatus.commits_ahead} / remote behind=${rb} ahead=${ra} / 未コミット変更=${branchStatus.has_uncommitted_changes ? "あり" : "なし"}`;
  }, [branchStatus]);

  const doPush = async (id: string) => {
    try {
      await AttemptAPI.push(id);
      // refresh attempts and status
      if (attemptsTaskId) {
        const list = await AttemptAPI.list(attemptsTaskId);
        setAttempts(list);
      }
      if (attempts.length && attempts[0].id === id) {
        const st = await AttemptAPI.status(id);
        setBranchStatus(st);
      }
      alert("Push 完了");
    } catch (e: any) {
      alert("Push 失敗: " + (e?.message || String(e)));
    }
  };

  const doPR = async (id: string) => {
    const title = window.prompt("PRタイトルを入力（空なら自動）") || "";
    const base = window.prompt("ベースブランチ（空なら実行のベース）") || "";
    try {
      const pr = await AttemptAPI.pr(id, { title, body: "", base_branch: base });
      alert(`PR作成: ${pr.pr_url || "成功"}`);
      // refresh attempts to reflect PR info
      if (attemptsTaskId) {
        const list = await AttemptAPI.list(attemptsTaskId);
        setAttempts(list);
      }
    } catch (e: any) {
      alert("PR作成に失敗: " + (e?.message || String(e)));
    }
  };

  return (
    <div className="drawer">
      <div className="drawer__overlay" onClick={onClose} />
      <aside className="drawer__panel">
        <header className="drawer__header">
          <div>
            <div className="drawer__title">{task.title}</div>
            <div className="drawer__meta">
              作成: {date(task.created_at)} ・ 更新: {date(task.updated_at)}
            </div>
          </div>
          <button className="ghost" onClick={onClose}>
            閉じる
          </button>
        </header>
        <div className="drawer__body">
          {task.description && (
            <section className="drawer__section">
              <div className="drawer__sectionTitle">説明</div>
              <div className="drawer__desc">{task.description}</div>
            </section>
          )}

          <section className="drawer__section">
            <div className="drawer__sectionTitle">アクション</div>
            <div className="row" style={{ gap: 8 }}>
              <button onClick={() => onEdit(task)}>編集</button>
              <button className="danger" onClick={() => onDelete(task)}>
                削除
              </button>
              <button onClick={() => onCreateAttempt(task)}>新規実行</button>
            </div>
          </section>

          <section className="drawer__section">
            <div className="drawer__sectionTitle">実行履歴</div>
            {attempts.length > 0 && (
              <div className="drawer__status">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 12, color: "#b3c7e6" }}>最新のブランチ状態</div>
                  <button className="ghost" onClick={async () => {
                    if (attempts[0]) {
                      setStatusLoading(true);
                      try {
                        const st = await AttemptAPI.status(attempts[0].id);
                        setBranchStatus(st);
                      } finally {
                        setStatusLoading(false);
                      }
                    }
                  }} disabled={statusLoading}>{statusLoading ? "更新中..." : "更新"}</button>
                </div>
                <div className="drawer__statusText">{branchText || "-"}</div>
              </div>
            )}
            {loading && <div className="muted">読み込み中...</div>}
            {error && <div className="danger-text">{error}</div>}
            {!loading && attempts.length === 0 && (
              <div className="muted">まだ実行がありません</div>
            )}
            <div className="attempts">
              {attempts.map((at) => (
                <div key={at.id} className="attempt">
                  <div className="attempt__main">
                    <div className="attempt__title">
                      {at.profile} ・ {at.branch}
                    </div>
                    <div className="attempt__meta">
                      {date(at.created_at)}
                      {at.pr_url ? (
                        <>
                          {' '}
                          ・ <a href={at.pr_url} target="_blank" rel="noreferrer">PR</a>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="attempt__actions">
                    <button className="ghost" onClick={() => onOpenAttempt(at)}>
                      エージェント
                    </button>
                    <button className="ghost" onClick={() => void doPush(at.id)}>
                      Push
                    </button>
                    <button className="ghost" onClick={() => void doPR(at.id)}>
                      PR作成
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
