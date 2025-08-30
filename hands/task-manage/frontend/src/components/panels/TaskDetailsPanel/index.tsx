import { useEffect, useRef, useState } from "react";
import { hasActiveFormFocus } from "../../../lib/formFocus";
import { AttemptAPI } from "../../../api";
import AttemptRow from "../../rows/AttemptRow";
import { ExecAPI } from "../../../api";
import { emitToast } from "../../../lib/toast";
import PrCreateModal from "../../modals/PrCreateModal";
import type { Attempt, BranchStatus, Task } from "../../../types";
import { useFocusTrap } from "../../../lib/useFocusTrap";

export default function TaskDetailsPanel({
  task,
  attemptsTaskId,
  onClose,
  onEdit,
  onDelete,
  onCreateAttempt,
  onOpenAttempt,
  onReconnectAttempt,
  onResumeAttempt,
}: {
  task: Task | null;
  attemptsTaskId: string | null;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onCreateAttempt: (task: Task) => void;
  onOpenAttempt: (attempt: Attempt) => void;
  onReconnectAttempt: (attempt: Attempt, execId: string) => void;
  onResumeAttempt: (attempt: Attempt, payload: { profile: string; cwd: string; prompt: string }) => void;
}) {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branchStatus, setBranchStatus] = useState<BranchStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusUpdatedAt, setStatusUpdatedAt] = useState<string | null>(null);

  const latestAttemptId = attempts[0]?.id || null;
  const [prOpen, setPrOpen] = useState(false);
  const [prAttemptId, setPrAttemptId] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const firstActionRef = useRef<HTMLButtonElement | null>(null);

  const toDateTime = (s: string) => new Date(s).toLocaleString();

  const pageSize = 20;
  const [hasMore, setHasMore] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    let cancelled = false;
    const loadFirst = async (tid: string) => {
      setLoading(true);
      setError(null);
      try {
        const list = await AttemptAPI.listPaged(tid, {
          limit: pageSize,
          offset: 0,
        });
        if (!cancelled) {
          setAttempts(list);
          setHasMore(list.length === pageSize);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (!attemptsTaskId) {
      setAttempts([]);
      setBranchStatus(null);
      setHasMore(false);
      return;
    }
    void loadFirst(attemptsTaskId);
    return () => {
      cancelled = true;
    };
  }, [attemptsTaskId]);

  useEffect(() => {
    const updateBranchStatus = async (id: string) => {
      try {
        setStatusLoading(true);
        const st = await AttemptAPI.status(id);
        setBranchStatus(st);
        setStatusUpdatedAt(new Date().toLocaleTimeString());
      } catch {
        setBranchStatus(null);
      } finally {
        setStatusLoading(false);
      }
    };

    if (!latestAttemptId) {
      setBranchStatus(null);
      return;
    }
    void updateBranchStatus(latestAttemptId);
  }, [latestAttemptId]);

  // ステータスポーリング（15秒）。フォームにフォーカス中は停止。
  useEffect(() => {
    if (!latestAttemptId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const st = await AttemptAPI.status(latestAttemptId);
        if (!cancelled) {
          setBranchStatus(st);
          setStatusUpdatedAt(new Date().toLocaleTimeString());
        }
      } catch {
        if (!cancelled) setBranchStatus(null);
      }
    };
    const id = window.setInterval(() => {
      if (!hasActiveFormFocus()) void tick();
    }, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [latestAttemptId]);

  // 旧: テキスト生成は撤去。UIはステータスグリッド表示に変更。

  // 表示件数の初期値を attempts 件数に合わせて調整
  useEffect(() => {
    setVisibleCount(Math.min(10, attempts.length));
  }, [attempts.length]);

  // フォーカストラップ & Esc で閉じる
  useFocusTrap({
    containerRef: panelRef as unknown as React.RefObject<HTMLElement>,
    enabled: !!task,
    onEscape: onClose,
    initialFocusRef: firstActionRef,
  });

  // Inline SVG icons (currentColor を使用)
  const IconEdit = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor"/>
      <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
    </svg>
  );
  const IconPlay = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 5v14l11-7L8 5z" fill="currentColor"/>
    </svg>
  );
  const IconTrash = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 7h12l-1 13H7L6 7z" fill="currentColor"/>
      <path d="M9 4h6l1 3H8l1-3z" fill="currentColor"/>
    </svg>
  );

  if (!task) return null;

  const loadMoreRef = (el: HTMLDivElement | null) => {
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          setVisibleCount((c) => Math.min(c + 10, attempts.length));
          if (
            visibleCount >= attempts.length &&
            hasMore &&
            !pageLoading &&
            attemptsTaskId
          ) {
            (async () => {
              try {
                setPageLoading(true);
                const next = await AttemptAPI.listPaged(attemptsTaskId, {
                  limit: pageSize,
                  offset: attempts.length,
                });
                setAttempts((prev) => [...prev, ...next]);
                setHasMore(next.length === pageSize);
              } finally {
                setPageLoading(false);
              }
            })();
          }
        }
      }
    });
    io.observe(el);
  };

  const doPush = async (id: string) => {
    try {
      await AttemptAPI.push(id);
      if (attemptsTaskId) {
        const list = await AttemptAPI.listPaged(attemptsTaskId, {
          limit: pageSize,
          offset: 0,
        });
        setAttempts(list);
        setHasMore(list.length === pageSize);
        setVisibleCount(Math.min(10, list.length));
      }
      if (latestAttemptId === id) {
        try {
          setStatusLoading(true);
          const st = await AttemptAPI.status(id);
          setBranchStatus(st);
        } finally {
          setStatusLoading(false);
        }
      }
      emitToast("Push 完了", "success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      emitToast("Push 失敗: " + msg, "error");
    }
  };

  const doPR = async (id: string) => {
    setPrAttemptId(id);
    setPrOpen(true);
  };

  return (
    <div className="drawer">
      <div className="drawer__overlay" onClick={onClose} />
      <aside
        className="drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-drawer-title"
        ref={panelRef as unknown as React.RefObject<HTMLElement>}
      >
        <header className="drawer__header">
          <div>
            <div id="task-drawer-title" className="drawer__title">
              {task.title}
            </div>
            <div className="drawer__meta">
              作成: {toDateTime(task.created_at)} ・ 更新: {toDateTime(task.updated_at)}
            </div>
          </div>
        </header>
        <div className="drawer__toolbar">
          <div className="toolbar__group">
            <button className="btnIcon danger" onClick={() => onDelete(task)} aria-label="削除" ref={firstActionRef}>
              <IconTrash />
              <span>削除</span>
            </button>
            <button onClick={() => onEdit(task)} className="btnIcon" aria-label="編集">
              <IconEdit />
              <span>編集</span>
            </button>
          </div>
          <div className="toolbar__group">
            <button onClick={() => onCreateAttempt(task)} className="btnIcon" aria-label="ブランチ作成">
              <IconPlay />
              <span>ブランチ作成</span>
            </button>
          </div>
        </div>
        <div className="drawer__body">
          {task.description && (
            <section className="drawer__section">
              <div className="drawer__sectionHeader">
                <div className="drawer__sectionTitle">説明</div>
              </div>
              <div className="drawer__desc">{task.description}</div>
            </section>
          )}

          {/* タグ表示は廃止 */}

          <section className="drawer__section">
            <div className="drawer__sectionHeader">
              <div className="drawer__sectionTitle">作業ブランチ</div>
              {attempts.length > 0 && (
                <div className="drawer__sectionActions">
                  <button
                    className="ghost"
                    onClick={async () => {
                      if (latestAttemptId) {
                        try {
                          setStatusLoading(true);
                          const st = await AttemptAPI.status(latestAttemptId);
                          setBranchStatus(st);
                          setStatusUpdatedAt(new Date().toLocaleTimeString());
                        } finally {
                          setStatusLoading(false);
                        }
                      }
                    }}
                    disabled={statusLoading}
                  >
                    {statusLoading ? "同期中..." : "状態を更新"}
                  </button>
                  <div className="statusMeta" aria-live="polite">
                    {statusLoading ? (
                      <span className="btnIcon"><span className="spinner spinner--sm" aria-hidden="true" />更新しています...</span>
                    ) : (
                      <span>{statusUpdatedAt ? `最終更新: ${statusUpdatedAt}` : "未取得"}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
            {attempts.length > 0 && (
              <div
                className="statusGrid"
                aria-busy={statusLoading}
                aria-live="polite"
              >
                {/* ベース */}
                <div className={"kv " + (statusLoading ? "kv--loading" : "") }>
                  <div className="kv__key">ベース</div>
                  <div className="kv__val">
                    {statusLoading ? (
                      <div className="skeleton skeleton-chip" style={{ width: 90 }} />
                    ) : (
                      <span className="chip">{branchStatus?.base_branch_name || "-"}</span>
                    )}
                  </div>
                </div>
                {/* ahead */}
                <div className={"kv " + (statusLoading ? "kv--loading" : "") }>
                  <div className="kv__key">ahead</div>
                  <div className="kv__val">
                    {statusLoading ? (
                      <div className="skeleton skeleton-chip" style={{ width: 36 }} />
                    ) : (
                      <span className="chip chip--ok">{branchStatus?.commits_ahead ?? "-"}</span>
                    )}
                  </div>
                </div>
                {/* behind */}
                <div className={"kv " + (statusLoading ? "kv--loading" : "") }>
                  <div className="kv__key">behind</div>
                  <div className="kv__val">
                    {statusLoading ? (
                      <div className="skeleton skeleton-chip" style={{ width: 36 }} />
                    ) : (
                      <span className="chip chip--warn">{branchStatus?.commits_behind ?? "-"}</span>
                    )}
                  </div>
                </div>
                {/* remote ahead */}
                <div className={"kv " + (statusLoading ? "kv--loading" : "") }>
                  <div className="kv__key">remote ahead</div>
                  <div className="kv__val">
                    {statusLoading ? (
                      <div className="skeleton skeleton-chip" style={{ width: 50 }} />
                    ) : (
                      <span className="chip">{branchStatus?.remote_commits_ahead ?? "N/A"}</span>
                    )}
                  </div>
                </div>
                {/* remote behind */}
                <div className={"kv " + (statusLoading ? "kv--loading" : "") }>
                  <div className="kv__key">remote behind</div>
                  <div className="kv__val">
                    {statusLoading ? (
                      <div className="skeleton skeleton-chip" style={{ width: 56 }} />
                    ) : (
                      <span className="chip">{branchStatus?.remote_commits_behind ?? "N/A"}</span>
                    )}
                  </div>
                </div>
                {/* 未コミット */}
                <div className={"kv " + (statusLoading ? "kv--loading" : "") }>
                  <div className="kv__key">未コミット</div>
                  <div className="kv__val">
                    {statusLoading ? (
                      <div className="skeleton skeleton-chip" style={{ width: 60 }} />
                    ) : (
                      <span className={"chip " + (branchStatus?.has_uncommitted_changes ? "chip--warn" : "chip--muted")}>
                        {branchStatus?.has_uncommitted_changes ? "あり" : "なし"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            {loading && <div className="muted">読み込み中...</div>}
            {error && <div className="danger-text">{error}</div>}
            {!loading && attempts.length === 0 && (
              <div className="muted">まだ作業ブランチがありません</div>
            )}
            <div className="attempts">
              {attempts.slice(0, visibleCount).map((at) => (
                <AttemptRow
                  key={at.id}
                  attempt={at}
                  onOpenAttempt={onOpenAttempt}
                  onContinue={async (attempt) => {
                    try {
                      // 実行中があれば接続、なければ最新設定を読み込み
                      const running = await ExecAPI.listPaged({
                        limit: 1,
                        attempt_id: attempt.id,
                        status: "running",
                      });
                      if (running.length > 0) {
                        onReconnectAttempt(attempt, running[0].id);
                        return;
                      }
                      const latest = await ExecAPI.listPaged({
                        limit: 1,
                        attempt_id: attempt.id,
                      });
                      if (latest.length > 0) {
                        const p = latest[0];
                        onResumeAttempt(attempt, {
                          profile: p.profile,
                          cwd: p.cwd,
                          prompt: p.prompt,
                        });
                        return;
                      }
                      // 履歴がなければ、空の実行モーダルへ
                      emitToast("履歴がないため、新規実行の設定を開きます", "info");
                      onOpenAttempt(attempt);
                    } catch (e: unknown) {
                      const msg = e instanceof Error ? e.message : String(e);
                      emitToast("続きの準備に失敗: " + msg, "error");
                    }
                  }}
                  onPush={(id) => doPush(id)}
                  onPR={(id) => doPR(id)}
                  formatDate={toDateTime}
                />
              ))}
              {visibleCount < attempts.length && (
                <div
                  ref={loadMoreRef}
                  className="muted"
                  style={{ textAlign: "center", padding: 8 }}
                >
                  読み込み中...
                </div>
              )}
            </div>
          </section>
        </div>
      </aside>
      <PrCreateModal
        open={prOpen}
        defaultTitle={""}
        defaultBase={branchStatus?.base_branch_name || ""}
        onClose={() => setPrOpen(false)}
        onSubmit={async ({ title, base }) => {
          if (!prAttemptId) return;
          try {
            const pr = await AttemptAPI.pr(prAttemptId, {
              title,
              body: "",
              base_branch: base,
            });
            emitToast(`PR作成: ${pr.pr_url || "成功"}`, "success");
            if (attemptsTaskId) {
              const list = await AttemptAPI.listPaged(attemptsTaskId, {
                limit: pageSize,
                offset: 0,
              });
              setAttempts(list);
              setHasMore(list.length === pageSize);
              setVisibleCount(Math.min(10, list.length));
            }
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            emitToast("PR作成に失敗: " + msg, "error");
          }
        }}
      />
    </div>
  );
}
