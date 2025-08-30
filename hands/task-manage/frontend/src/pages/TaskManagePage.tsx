import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import TaskEditModal from "../components/modals/TaskEditModal";
import Board from "../components/board/Board";
import Header from "../components/layout/Header";
import BoardToolbar from "../components/layout/BoardToolbar";
import TaskAddModal from "../components/modals/TaskAddModal";
import SettingsModal from "../components/modals/SettingsModal";
import AttemptModal from "../components/modals/AttemptModal";
import AgentModal from "../components/modals/AgentModal";
import TaskDetailsPanel from "../components/panels/TaskDetailsPanel";
import { API } from "../api";
import type { Status, Task, Attempt } from "../types";
import { hasActiveFormFocus } from "../lib/formFocus";

export default function TaskManagePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const tasksPageSize = 100;
  const [tasksOffset, setTasksOffset] = useState(0);
  const [tasksHasMore, setTasksHasMore] = useState(false);
  const [tasksTotal, setTasksTotal] = useState(0);
  const [tasksLoadingMore, setTasksLoadingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<Status>>(
    new Set(["todo", "doing", "done"]),
  );
  // タグ機能は廃止
  const searchRef = useRef<HTMLInputElement>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  type ToastItem = {
    id: number;
    message: string;
    type: "info" | "success" | "error";
    position: "bottom-left" | "bottom-right" | "top-left" | "top-right";
    duration: number;
  };
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextToastId = useRef(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Task | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Task | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const showSettings = location.pathname === "/settings";
  const showAgent = location.pathname === "/agent";
  const showAttempt = location.pathname === "/attempts/new";
  const [showAdd, setShowAdd] = useState(false);

  const [addStatus, setAddStatus] = useState<Status | null>(null);
  const routeTaskId = (params as { taskId?: string }).taskId;
  const attemptTaskId = showAttempt ? searchParams.get("taskId") || null : null;
  const [currentAttempt, setCurrentAttempt] = useState<Attempt | null>(null);
  const [agentConnectExecId, setAgentConnectExecId] = useState<string | null>(null);
  const [agentResumePayload, setAgentResumePayload] = useState<{
    profile: string;
    cwd: string;
    prompt: string;
  } | null>(null);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const showToast = useCallback(
    (
      msg: string,
      type: "info" | "success" | "error" = "info",
      duration = 3000,
      position:
        | "bottom-left"
        | "bottom-right"
        | "top-left"
        | "top-right" = "bottom-left",
    ) => {
      const id = nextToastId.current++;
      const item: ToastItem = { id, message: msg, type, position, duration };
      setToasts((prev) => {
        const perPosMax = 4;
        const totalMax = 8;
      const filtered = [...prev];
      // enforce per-position cap (keep latest ones)
      const samePos = filtered.filter((t) => t.position === position);
      if (samePos.length >= perPosMax) {
        const toRemove = samePos.length - (perPosMax - 1); // -1 because we'll add one
        let removed = 0;
        for (let i = 0; i < filtered.length && removed < toRemove; i++) {
          if (filtered[i].position === position) {
            filtered.splice(i, 1);
            i--;
            removed++;
          }
        }
      }
      // enforce total cap
      while (filtered.length >= totalMax) filtered.shift();
      filtered.push(item);
      return filtered;
    });
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    [],
  );

  // グローバルトーストイベントに反応
  useEffect(() => {
    const onToast = (e: Event) => {
      const ce = e as CustomEvent<{
        message: string;
        type?: "info" | "success" | "error";
        duration?: number;
        position?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
      }>;
      const { message, type, duration, position } = ce.detail || {
        message: "",
      };
      if (message)
        showToast(
          message,
          type || "info",
          duration ?? 3000,
          position ?? "bottom-left",
        );
    };
    window.addEventListener("app:toast", onToast as EventListener);
    return () =>
      window.removeEventListener("app:toast", onToast as EventListener);
  }, [showToast]);

  // タグ機能は廃止

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // ページングで、現在読み込み済みの件数までは最新に更新
      const statusParam = Array.from(statusFilter).join(",");
      const first = await API.listTasksPagedWithMeta({
        limit: tasksPageSize,
        offset: 0,
        q: query || undefined,
        status: statusParam || undefined,
      });
      let acc: Task[] = first.data;
      setTasksTotal(first.total);
      let offset = acc.length;
      const target = Math.max(tasksOffset, tasksPageSize);
      while (offset < target && offset < first.total) {
        const page = await API.listTasksPaged({
          limit: tasksPageSize,
          offset,
          q: query || undefined,
          status: statusParam || undefined,
        });
        acc = acc.concat(page);
        offset += page.length;
        if (page.length < tasksPageSize) break;
      }
      // 既存より少ない場合もあり得るのでstate更新
      const rank = (s: Status) =>
        s === "todo" ? 0 : s === "doing" ? 1 : s === "done" ? 2 : 99;
      acc.sort((a, b) => rank(a.status) - rank(b.status) || a.order - b.order);
      setTasks(acc);
      setTasksOffset(acc.length);
      setTasksHasMore(acc.length < first.total);

      // 削除されたタスクがselectedTaskの場合はクリア（関数型更新を使用）
      setSelectedTask((currentSelected) => {
        if (currentSelected && !acc.find((t) => t.id === currentSelected.id)) {
          return null;
        }
        return currentSelected;
      });
    } finally {
      setLoading(false);
      setLoadedOnce(true);
    }
  }, [statusFilter, tasksPageSize, query, tasksOffset]);

  const loadMoreTasks = async () => {
    if (!tasksHasMore || tasksLoadingMore) return;
    setTasksLoadingMore(true);
    try {
      const statusParam = Array.from(statusFilter).join(",");
      const page = await API.listTasksPaged({
        limit: tasksPageSize,
        offset: tasksOffset,
        q: query || undefined,
        status: statusParam || undefined,
      });
      if (page.length > 0) {
        const rank = (s: Status) =>
          s === "todo" ? 0 : s === "doing" ? 1 : s === "done" ? 2 : 99;
        const merged = tasks.concat(page);
        merged.sort(
          (a, b) => rank(a.status) - rank(b.status) || a.order - b.order,
        );
        setTasks(merged);
        setTasksOffset(tasksOffset + page.length);
        setTasksHasMore(page.length === tasksPageSize);
      } else {
        setTasksHasMore(false);
      }
    } finally {
      setTasksLoadingMore(false);
    }
  };

  useEffect(() => {
    void refresh();
    const tid = setInterval(() => {
      if (!editOpen && !hasActiveFormFocus()) void refresh();
    }, 4000);
    return () => clearInterval(tid);
  }, [refresh, editOpen]);

  // ルートに応じて選択タスクを同期 / ガード
  useEffect(() => {
    if (!routeTaskId) {
      setSelectedTask(null);
      return;
    }
    const t = tasks.find((x) => x.id === routeTaskId) || null;
    setSelectedTask(t);
    if (loadedOnce && !t) {
      showToast("指定のタスクが見つかりませんでした");
      navigate("/", { replace: true });
    }
  }, [routeTaskId, tasks, loadedOnce, showToast, navigate]);

  // attempts/new ガード（taskIdが無い場合）
  useEffect(() => {
    if (showAttempt && !attemptTaskId && loadedOnce) {
      showToast("taskId が指定されていません");
      navigate("/", { replace: true });
    }
  }, [showAttempt, attemptTaskId, loadedOnce, showToast, navigate]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasRunningProcesses = false;
      if (hasRunningProcesses) {
        e.preventDefault();
        e.returnValue = "エージェントが実行中です。ページを離れますか？";
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && !hasActiveFormFocus()) void refresh();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refresh]);

  // グローバルキーボードショートカットは無効化

  // loadTags は useCallback へ昇格済み

  const filteredTasks = useMemo(() => tasks, [tasks]);

  // Update page title with context
  useEffect(() => {
    const base = "タスク管理";
    const suffix = query.trim()
      ? `（検索: ${query.trim()} / ${tasks.length}件）`
      : "";
    document.title = base + suffix;
  }, [query, tasks.length]);

  const addTask = (status: Status) => {
    setAddStatus(status);
    setShowAdd(true);
  };

  const createTask = async (title: string, description: string) => {
    if (!addStatus) return;
    await API.createTask(title, description, addStatus);
    setShowAdd(false);
    setAddStatus(null);
    await refresh();
  };

  const editTask = async (t: Task) => {
    setEditTarget(t);
    setEditOpen(true);
  };

  const deleteTask = async (t: Task) => {
    // 削除対象のタスクが選択中かチェック
    const wasSelected = selectedTask && selectedTask.id === t.id;
    console.log("deleteTask:", {
      taskId: t.id,
      wasSelected,
      selectedTaskId: selectedTask?.id,
    });

    // 詳細パネルから削除された場合は常にクリア
    setSelectedTask(null);

    try {
      await API.deleteTask(t.id);
      console.log("Delete successful");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      // 失敗時は選択を復元（元々選択されていた場合のみ）
      if (wasSelected) {
        setSelectedTask(t);
      }
      showToast("削除に失敗: " + msg, "error");
      return;
    }
    if (wasSelected) {
      navigate("/");
    }
    showToast("削除しました", "success");
    await refresh();
  };

  const askDelete = (t: Task) => {
    setConfirmTarget(t);
    setConfirmOpen(true);
  };

  const moveTask = async (id: string, toStatus: Status, toIndex: number) => {
    await API.moveTask(id, toStatus, toIndex);
    await refresh();
  };

  const openAttempt = (t: Task) => {
    navigate(`/attempts/new?taskId=${encodeURIComponent(t.id)}`);
  };

  const onAttemptCreated = (at: Attempt) => {
    setCurrentAttempt(at);
    setAgentConnectExecId(null);
    setAgentResumePayload(null);
    // 作成直後は attempts/new を置換して /agent へ遷移（戻るで再オープンしない）
    navigate("/agent", { replace: true });
  };

  return (
    <div>
      {loading && !loadedOnce && (
        <div className="loadingOverlay">
          <div className="spinner" aria-label="読み込み中" />
        </div>
      )}
      <Header
        ref={searchRef}
        query={query}
        onQueryChange={setQuery}
        onSettingsClick={() => navigate("/settings")}
        onAgentClick={() => {
          setCurrentAttempt(null);
          navigate("/agent");
        }}
        onRefresh={() => void refresh()}
        loading={loading}
      />

      {/* ミニマルなツールバー */}
      <BoardToolbar
        statusFilter={statusFilter}
        onToggle={(s) =>
          setStatusFilter((prev) => {
            const next = new Set(prev);
            if (next.has(s)) next.delete(s);
            else next.add(s);
            return next;
          })
        }
        visible={filteredTasks.length}
        total={tasksTotal}
      />

      <Board
        tasks={filteredTasks}
        selectedTaskId={selectedTask?.id || null}
        onAdd={addTask}
        onEdit={editTask}
        onDelete={askDelete}
        onAttempt={openAttempt}
        onMove={moveTask}
        onSelect={(t) => {
          setSelectedTask(t);
          navigate(`/tasks/${t.id}`);
        }}
      />

      {tasksHasMore && (
        <div style={{ textAlign: "center", padding: 8 }}>
          <button
            className="ghost"
            disabled={tasksLoadingMore}
            onClick={() => void loadMoreTasks()}
          >
            {tasksLoadingMore ? "読み込み中..." : "さらに読み込む"}
          </button>
        </div>
      )}
      <footer className="footer" />

      {/* タグ管理モーダルは廃止 */}

      <TaskAddModal
        open={showAdd}
        status={addStatus}
        onClose={() => {
          setShowAdd(false);
          setAddStatus(null);
        }}
        onCreate={(title, description) => createTask(title, description)}
      />
      <SettingsModal
        open={showSettings}
        onClose={() => navigate("/", { replace: true })}
      />
      <AttemptModal
        open={showAttempt}
        taskId={attemptTaskId}
        onClose={() =>
          navigate(attemptTaskId ? `/tasks/${attemptTaskId}` : "/", {
            replace: true,
          })
        }
        onCreated={onAttemptCreated}
      />
      <AgentModal
        open={showAgent}
        attemptId={currentAttempt?.id}
        presetCwd={currentAttempt?.repo_path}
        initialConnectExecId={agentConnectExecId}
        initialResume={agentResumePayload ? { profile: agentResumePayload.profile, cwd: agentResumePayload.cwd, prompt: agentResumePayload.prompt, attempt_id: currentAttempt?.id || undefined } : undefined}
        onClose={() => navigate("/", { replace: true })}
      />

      <TaskDetailsPanel
        task={selectedTask}
        attemptsTaskId={selectedTask?.id || null}
        onClose={() => {
          setSelectedTask(null);
          navigate("/", { replace: true });
        }}
        onEdit={editTask}
        onDelete={askDelete}
        onCreateAttempt={(t) => {
          navigate(`/attempts/new?taskId=${encodeURIComponent(t.id)}`);
        }}
        onOpenAttempt={(at) => {
          setCurrentAttempt(at);
          setAgentConnectExecId(null);
          setAgentResumePayload(null);
          navigate("/agent");
        }}
        onReconnectAttempt={(at, execId) => {
          setCurrentAttempt(at);
          setAgentResumePayload(null);
          setAgentConnectExecId(execId);
          navigate("/agent");
        }}
        onResumeAttempt={(at, payload) => {
          setCurrentAttempt(at);
          setAgentConnectExecId(null);
          setAgentResumePayload(payload);
          navigate("/agent");
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="削除の確認"
        message={
          confirmTarget
            ? `「${confirmTarget.title}」を削除します。よろしいですか？`
            : "本当に削除しますか？"
        }
        confirmLabel="削除"
        confirmDisabled={confirmBusy}
        confirmBusy={confirmBusy}
        onCancel={() => {
          if (confirmBusy) return;
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
        onConfirm={async () => {
          if (!confirmTarget) return;
          try {
            setConfirmBusy(true);
            await deleteTask(confirmTarget);
            setConfirmOpen(false);
            setConfirmTarget(null);
          } finally {
            setConfirmBusy(false);
          }
        }}
      />

      <TaskEditModal
        open={editOpen && !!editTarget}
        initialTitle={editTarget?.title || ""}
        initialDescription={editTarget?.description || ""}
        onClose={() => {
          setEditOpen(false);
          setEditTarget(null);
        }}
        onSubmit={async ({ title, description }) => {
          if (!editTarget) return;
          await API.updateTask(editTarget.id, { title, description });
          showToast("更新しました", "success");
          await refresh();
        }}
      />

      {/* Toast containers (stacked by position) */}
      {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map(
        (pos) => {
          const list = toasts.filter((t) => t.position === pos);
          if (list.length === 0) return null;
          return (
            <div key={pos} className={`toasts ${pos}`}>
              {list.map((t) => (
                <div
                  key={t.id}
                  className={`toast ${t.type}`}
                  role="status"
                  aria-live="polite"
                  onClick={() =>
                    setToasts((prev) => prev.filter((x) => x.id !== t.id))
                  }
                  title="クリックで閉じる"
                >
                  {t.message}
                </div>
              ))}
            </div>
          );
        },
      )}
    </div>
  );
}
