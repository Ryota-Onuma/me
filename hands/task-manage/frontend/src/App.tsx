import React, { useEffect, useMemo, useRef, useState } from "react";
import Board from "./components/Board";
import TaskAddModal from "./components/TaskAddModal";
import SettingsModal from "./components/SettingsModal";
import AttemptModal from "./components/AttemptModal";
import AgentModal from "./components/AgentModal";
import { API } from "./api";
import type { Status, Task, Attempt } from "./types";
import TaskDetailsPanel from "./components/TaskDetailsPanel";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [showAgent, setShowAgent] = useState(false);
  const [showAttempt, setShowAttempt] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const [addStatus, setAddStatus] = useState<Status | null>(null);
  const [attemptTaskId, setAttemptTaskId] = useState<string | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<Attempt | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const ts = await API.listTasks();
      // sort as server: by status rank then order
      const rank = (s: Status) =>
        s === "todo" ? 0 : s === "doing" ? 1 : s === "done" ? 2 : 99;
      ts.sort((a, b) => rank(a.status) - rank(b.status) || a.order - b.order);
      setTasks(ts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // lightweight polling to keep UI fresh
    const tid = setInterval(() => {
      void refresh();
    }, 4000);
    return () => clearInterval(tid);
  }, []);

  // Graceful cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check if there are any running processes that might need cleanup
      // This is more of a user warning than actual cleanup
      const hasRunningProcesses = false; // You could track this state if needed
      if (hasRunningProcesses) {
        e.preventDefault();
        e.returnValue = 'エージェントが実行中です。ページを離れますか？';
      }
    };

    const handleVisibilityChange = () => {
      // Pause/resume polling based on page visibility
      if (document.hidden) {
        // Page is hidden, could reduce polling frequency or pause
      } else {
        // Page is visible again, resume normal polling
        void refresh();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);


  // Global shortcuts similar to vibe-kanban
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement | null)?.isContentEditable;
      if (typing) return; // don't hijack when typing
      if (e.key === "r") {
        e.preventDefault();
        void refresh();
      } else if (e.key === "/" || e.key === "f") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "c") {
        e.preventDefault();
        // default add to TODO
        addTask("todo");
      } else if (e.key === "?") {
        e.preventDefault();
        alert("ショートカット: / 検索, r 再読込, c 追加, Enter/矢印: ボード内ナビゲーション (ボードをクリックで有効)");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) =>
      t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q),
    );
  }, [tasks, query]);

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
    const newTitle = window.prompt("タイトルを編集", t.title);
    if (newTitle == null) return;
    const newDesc = window.prompt("説明を編集", t.description || "");
    await API.updateTask(t.id, { title: newTitle, description: newDesc ?? "" });
    await refresh();
  };

  const deleteTask = async (t: Task) => {
    if (!window.confirm("本当に削除しますか？")) return;
    await API.deleteTask(t.id);
    if (selectedTask && selectedTask.id === t.id) setSelectedTask(null);
    await refresh();
  };

  const moveTask = async (id: string, toStatus: Status, toIndex: number) => {
    await API.moveTask(id, toStatus, toIndex);
    await refresh();
  };

  const openAttempt = (t: Task) => {
    setAttemptTaskId(t.id);
    setShowAttempt(true);
  };
  const onAttemptCreated = (at: Attempt) => {
    setCurrentAttempt(at);
    setShowAgent(true);
  };

  return (
    <div>
      <header className="topbar">
        <h1>タスク管理</h1>
        <div className="searchbar">
          <input
            ref={searchRef}
            className="search"
            type="text"
            placeholder="検索 (/ でフォーカス)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="actions">
          <button className="ghost" onClick={() => setShowSettings(true)}>
            設定
          </button>
          <button
            onClick={() => {
              setCurrentAttempt(null);
              setShowAgent(true);
            }}
          >
            エージェント実行
          </button>
          <button
            className="ghost"
            onClick={() => void refresh()}
            disabled={loading}
          >
            {loading ? "更新中..." : "再読み込み"}
          </button>
        </div>
      </header>

      <Board
        tasks={filteredTasks}
        onAdd={addTask}
        onEdit={editTask}
        onDelete={deleteTask}
        onAttempt={openAttempt}
        onMove={moveTask}
        onSelect={(t) => setSelectedTask(t)}
      />

      <footer className="footer" />

      <TaskAddModal
        open={showAdd}
        status={addStatus}
        onClose={() => {
          setShowAdd(false);
          setAddStatus(null);
        }}
        onCreate={createTask}
      />
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
      <AttemptModal
        open={showAttempt}
        taskId={attemptTaskId}
        onClose={() => setShowAttempt(false)}
        onCreated={onAttemptCreated}
      />
      <AgentModal
        open={showAgent}
        attemptId={currentAttempt?.id}
        presetCwd={currentAttempt?.repo_path}
        onClose={() => setShowAgent(false)}
      />

      <TaskDetailsPanel
        task={selectedTask}
        attemptsTaskId={selectedTask?.id || null}
        onClose={() => setSelectedTask(null)}
        onEdit={editTask}
        onDelete={deleteTask}
        onCreateAttempt={(t) => {
          setAttemptTaskId(t.id);
          setShowAttempt(true);
        }}
        onOpenAttempt={(at) => {
          setCurrentAttempt(at);
          setShowAgent(true);
        }}
      />
    </div>
  );
}
