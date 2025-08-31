import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AttemptAPI } from "../../../api";
import AttemptRow from "../../rows/AttemptRow";
import { ExecAPI } from "../../../api";
import { emitToast } from "../../../lib/toast";
import PrCreateModal from "../../modals/PrCreateModal";
import WorktreeModal from "../../modals/WorktreeModal";
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
  // 無限ローディング防止用のセーフティネット（UI側タイムアウト）
  const statusLoadingTimerRef = useRef<number | null>(null);
  // 作業ブランチ（sourceグループ）ごとのステータス（代表 attempt 単位）
  const [groupStatuses, setGroupStatuses] = useState<Record<string, BranchStatus | null>>({}); // key: attemptId

  const latestAttemptId = attempts[0]?.id || null;
  const [prOpen, setPrOpen] = useState(false);
  const [prAttemptId, setPrAttemptId] = useState<string | null>(null);
  const [wtOpen, setWtOpen] = useState(false);
  const [wtAttempt, setWtAttempt] = useState<Attempt | null>(null);
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

  // 旧グローバル status は廃止方向。latestAttemptId 用の即時取得はスキップ。
  useEffect(() => {
    if (!latestAttemptId) setBranchStatus(null);
  }, [latestAttemptId]);

  // statusLoading が一定時間以上続く場合に自動解除（UX保護）
  useEffect(() => {
    if (statusLoading) {
      if (statusLoadingTimerRef.current) window.clearTimeout(statusLoadingTimerRef.current);
      statusLoadingTimerRef.current = window.setTimeout(() => {
        setStatusLoading(false);
      }, 10000); // 10s safety
    } else if (statusLoadingTimerRef.current) {
      window.clearTimeout(statusLoadingTimerRef.current);
      statusLoadingTimerRef.current = null;
    }
    return () => {
      if (statusLoadingTimerRef.current) window.clearTimeout(statusLoadingTimerRef.current);
      statusLoadingTimerRef.current = null;
    };
  }, [statusLoading]);

  // グループ代表 attempt のステータスをまとめて取得・更新
  const headAttemptIds = useMemo(() => {
    const visible = attempts.slice(0, visibleCount);
    const byBase = new Map<string, Attempt[]>();
    for (const at of visible) {
      const base = at.base_branch || "(no-base)";
      const arr = byBase.get(base) ?? [];
      arr.push(at);
      byBase.set(base, arr);
    }
    const map: Record<string, string> = {}; // key: `${base}__${src}` -> head attempt id
    for (const [base, baseList] of byBase) {
      const bySource = new Map<string, Attempt[]>();
      for (const at of baseList) {
        const src = at.branch || "(no-branch)";
        const arr = bySource.get(src) ?? [];
        arr.push(at);
        bySource.set(src, arr);
      }
      for (const [src, list] of bySource) {
        map[`${base}__${src}`] = list[0]?.id;
      }
    }
    return map;
  }, [attempts, visibleCount]);

  const refreshGroupStatuses = useCallback(async (attemptIds: string[]) => {
    setStatusLoading(true);
    try {
      await Promise.all(
        attemptIds.map(async (id) => {
          try {
            const st = await AttemptAPI.status(id);
            setGroupStatuses((prev) => ({ ...prev, [id]: st }));
          } catch {
            setGroupStatuses((prev) => ({ ...prev, [id]: null }));
          }
        }),
      );
      setStatusUpdatedAt(new Date().toLocaleTimeString());
    } finally {
      setStatusLoading(false);
    }
  }, []);

  // 初期表示・可視件数変更時にグループの代表 attempt を更新
  useEffect(() => {
    const ids = Object.values(headAttemptIds).filter(Boolean);
    if (ids.length === 0) return;
    void refreshGroupStatuses(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headAttemptIds]);

  // 旧: テキスト生成は撤去。UIはステータスグリッド表示に変更。

  // 折りたたみ状態（base と source）
  const [collapsedBase, setCollapsedBase] = useState<Record<string, boolean>>({});
  const [collapsedSource, setCollapsedSource] = useState<Record<string, boolean>>({});

  // 永続化：localStorage に保存/復元（タスクID単位）
  const lsKeys = {
    base: attemptsTaskId ? `tm:attempts:collapsedBase:${attemptsTaskId}` : null,
    source: attemptsTaskId ? `tm:attempts:collapsedSource:${attemptsTaskId}` : null,
  } as const;

  useEffect(() => {
    if (!attemptsTaskId) return;
    try {
      const b = localStorage.getItem(`tm:attempts:collapsedBase:${attemptsTaskId}`);
      const s = localStorage.getItem(`tm:attempts:collapsedSource:${attemptsTaskId}`);
      setCollapsedBase(b ? (JSON.parse(b) as Record<string, boolean>) : {});
      setCollapsedSource(s ? (JSON.parse(s) as Record<string, boolean>) : {});
    } catch {
      setCollapsedBase({});
      setCollapsedSource({});
    }
  }, [attemptsTaskId]);

  useEffect(() => {
    if (!lsKeys.base) return;
    try {
      localStorage.setItem(lsKeys.base, JSON.stringify(collapsedBase));
    } catch {
      // ignore
    }
  }, [collapsedBase, lsKeys.base]);

  useEffect(() => {
    if (!lsKeys.source) return;
    try {
      localStorage.setItem(lsKeys.source, JSON.stringify(collapsedSource));
    } catch {
      // ignore
    }
  }, [collapsedSource, lsKeys.source]);

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
            <button onClick={() => onCreateAttempt(task)} className="btnIcon" aria-label="作業ブランチ作成">
              <IconPlay />
              <span>作業ブランチ作成</span>
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
                      const ids = Object.values(headAttemptIds).filter(Boolean);
                      await refreshGroupStatuses(ids);
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
            {/* グローバルステータスは廃止。各 source グループに表示 */}
            {loading && <div className="muted">読み込み中...</div>}
            {error && <div className="danger-text">{error}</div>}
            {!loading && attempts.length === 0 && (
              <div className="muted">まだ作業ブランチがありません</div>
            )}
            <div className="attempts">
              {(() => {
                // 1) まず可視範囲を取得
                const visible = attempts.slice(0, visibleCount);
                // 2) base -> source の二段グループ
                const byBase = new Map<string, Attempt[]>();
                for (const at of visible) {
                  const base = at.base_branch || "(no-base)";
                  const arr = byBase.get(base) ?? [];
                  arr.push(at);
                  byBase.set(base, arr);
                }

                return Array.from(byBase.entries()).map(([base, baseList]) => {
                  // source でさらにグループ化
                  const bySource = new Map<string, Attempt[]>();
                  for (const at of baseList) {
                    const src = at.branch || "(no-branch)";
                    const arr = bySource.get(src) ?? [];
                    arr.push(at);
                    bySource.set(src, arr);
                  }
                  const baseCollapsed = !!collapsedBase[base];
                  return (
                    <div className="attemptGroupBase" key={base}>
                      <div className="attemptGroupBase__header">
                        <button
                          className="collapseBtn"
                          aria-expanded={!baseCollapsed}
                          onClick={() => setCollapsedBase((s) => ({ ...s, [base]: !s[base] }))}
                        >
                          <span className="triangle" aria-hidden>{baseCollapsed ? '▶' : '▼'}</span>
                          <span className="label">base: <span className="attempt__branch">{base}</span></span>
                        </button>
                        <span className="muted">{baseList.length} ws</span>
                      </div>

                      {!baseCollapsed && (
                        <div className="attemptGroupBase__body">
                          {Array.from(bySource.entries()).map(([src, list]) => {
                            const key = `${base}__${src}`;
                            const srcCollapsed = !!collapsedSource[key];
                            return (
                              <div key={key} className="attemptGroup">
                                <div className="attemptGroup__header">
                                  <button
                                    className="collapseBtn"
                                    aria-expanded={!srcCollapsed}
                                    onClick={() => setCollapsedSource((s) => ({ ...s, [key]: !s[key] }))}
                                  >
                                    <span className="triangle" aria-hidden>{srcCollapsed ? '▶' : '▼'}</span>
                                    <span className="attemptGroup__title"><span className="attempt__branch">{src}</span></span>
                                  </button>
                                  <div className="attemptGroup__chips chips" style={{ gap: 6 }}>
                                    {(() => {
                                      const attemptId = headAttemptIds[key];
                                      const st = attemptId ? groupStatuses[attemptId] : undefined;
                                      if (!st) {
                                        return (
                                          <>
                                            <span className="chip skeleton skeleton-chip" style={{ width: 80 }} />
                                            <span className="chip skeleton skeleton-chip" style={{ width: 44 }} />
                                            <span className="chip skeleton skeleton-chip" style={{ width: 48 }} />
                                            <span className="chip skeleton skeleton-chip" style={{ width: 66 }} />
                                            <span className="chip skeleton skeleton-chip" style={{ width: 74 }} />
                                          </>
                                        );
                                      }
                                      return (
                                        <>
                                          <span className="chip chip--ok" title="ローカルのahead（未Push）">ahead {st.commits_ahead ?? '-'}</span>
                                          <span className="chip chip--warn" title="ローカルのbehind">behind {st.commits_behind ?? '-'}</span>
                                          <span className="chip" title="リモートに対するahead">remote ahead {st.remote_commits_ahead ?? 'N/A'}</span>
                                          <span className="chip" title="リモートに対するbehind">remote behind {st.remote_commits_behind ?? 'N/A'}</span>
                                          <span className={"chip " + (st.has_uncommitted_changes ? "chip--warn" : "chip--muted")} title="未コミットの変更">
                                            未コミット {st.has_uncommitted_changes ? 'あり' : 'なし'}
                                          </span>
                                        </>
                                      );
                                    })()}
                                    {list.length > 1 && (
                                      <span className="chip" title="このブランチのワークスペース数">ws {list.length}</span>
                                    )}
                                  </div>
                                </div>

                                {!srcCollapsed && (
                                  <div className="attempts">
                                    {list.map((at) => (
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
                                        onWorktree={(attempt) => { setWtAttempt(attempt); setWtOpen(true); }}
                                        formatDate={toDateTime}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
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
      <WorktreeModal
        open={wtOpen}
        attempt={wtAttempt}
        onClose={() => setWtOpen(false)}
        onUpdated={() => { /* no-op; could refresh status */ }}
      />
    </div>
  );
}
