import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Status, Task } from "../types";

export interface BoardProps {
  tasks: Task[];
  onAdd: (status: Status) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAttempt: (task: Task) => void;
  onMove: (id: string, toStatus: Status, toIndex: number) => void;
  onSelect: (task: Task) => void;
}

const statusOrder: Status[] = ["todo", "doing", "done"];
const statusLabel: Record<Status, string> = {
  todo: "未着手",
  doing: "進行中",
  done: "完了",
};

export default function Board({
  tasks,
  onAdd,
  onEdit,
  onDelete,
  onAttempt,
  onMove,
  onSelect,
}: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [focusedStatus, setFocusedStatus] = useState<Status | null>(null);

  const byStatus = useMemo(() => {
    const m: Record<Status, Task[]> = { todo: [], doing: [], done: [] };
    for (const t of tasks) m[t.status].push(t);
    // keep existing order
    for (const k of statusOrder) m[k].sort((a, b) => a.order - b.order);
    return m;
  }, [tasks]);

  // Autofocus board and initial selection
  useEffect(() => {
    if (boardRef.current) boardRef.current.focus();
  }, []);
  useEffect(() => {
    if (!focusedId) {
      for (const s of statusOrder) {
        const list = byStatus[s];
        if (list.length > 0) {
          setFocusedId(list[0].id);
          setFocusedStatus(s);
          break;
        }
      }
    } else {
      // Ensure focused id still exists; otherwise fallback
      const still = tasks.find((t) => t.id === focusedId);
      if (!still) {
        setFocusedId(null);
      } else {
        setFocusedStatus(still.status);
      }
    }
  }, [byStatus, tasks]);

  const ensureVisible = (id: string) => {
    const el = document.querySelector<HTMLDivElement>(`.card[data-id="${id}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  };

  const moveFocused = (dir: "up" | "down" | "left" | "right") => {
    if (!focusedStatus) return;
    const list = byStatus[focusedStatus];
    let idx = focusedId ? list.findIndex((t) => t.id === focusedId) : -1;
    if (dir === "up") idx = Math.max(0, idx - 1);
    if (dir === "down") idx = Math.min(list.length - 1, idx + 1);
    if (dir === "left" || dir === "right") {
      const sIdx = statusOrder.indexOf(focusedStatus);
      const nextS = statusOrder[
        Math.min(
          statusOrder.length - 1,
          Math.max(0, sIdx + (dir === "right" ? 1 : -1)),
        )
      ];
      const nextList = byStatus[nextS];
      idx = Math.min(idx >= 0 ? idx : 0, Math.max(0, nextList.length - 1));
      const nextId = nextList[idx]?.id ?? null;
      setFocusedStatus(nextS);
      setFocusedId(nextId);
      if (nextId) ensureVisible(nextId);
      return;
    }
    const nextId = list[idx]?.id ?? null;
    if (nextId) {
      setFocusedId(nextId);
      ensureVisible(nextId);
    }
  };

  const moveTaskKeyboard = (delta: -1 | 1) => {
    if (!focusedId || !focusedStatus) return;
    const list = byStatus[focusedStatus];
    const cur = list.findIndex((t) => t.id === focusedId);
    if (cur < 0) return;
    const toIndex = Math.min(Math.max(0, cur + delta), list.length - 1);
    if (toIndex === cur) return;
    onMove(focusedId, focusedStatus, toIndex);
  };

  const bumpStatus = (delta: -1 | 1) => {
    if (!focusedId || !focusedStatus) return;
    const curS = statusOrder.indexOf(focusedStatus);
    const nextS = statusOrder[Math.min(Math.max(0, curS + delta), statusOrder.length - 1)];
    if (nextS === focusedStatus) return;
    const toIndex = byStatus[nextS].length; // append at end
    onMove(focusedId, nextS, toIndex);
    setFocusedStatus(nextS);
  };

  return (
    <main
      className="board"
      id="board"
      ref={boardRef}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp" || e.key === "k") {
          e.preventDefault();
          moveFocused("up");
        } else if (e.key === "ArrowDown" || e.key === "j") {
          e.preventDefault();
          moveFocused("down");
        } else if (e.key === "ArrowLeft" || e.key === "h") {
          e.preventDefault();
          moveFocused("left");
        } else if (e.key === "ArrowRight" || e.key === "l") {
          e.preventDefault();
          moveFocused("right");
        } else if (e.key === "Enter") {
          const t = tasks.find((t) => t.id === focusedId);
          if (t) onSelect(t);
        } else if (e.key === "e") {
          const t = tasks.find((t) => t.id === focusedId);
          if (t) onEdit(t);
        } else if (e.key === "a") {
          if (focusedStatus) onAdd(focusedStatus);
        } else if (e.key === "]") {
          bumpStatus(1);
        } else if (e.key === "[") {
          bumpStatus(-1);
        } else if (e.key === "Backspace" || e.key === "Delete") {
          const t = tasks.find((t) => t.id === focusedId);
          if (t) onDelete(t);
        } else if ((e.key === "ArrowUp" && e.shiftKey) || e.key === "K") {
          e.preventDefault();
          moveTaskKeyboard(-1);
        } else if ((e.key === "ArrowDown" && e.shiftKey) || e.key === "J") {
          e.preventDefault();
          moveTaskKeyboard(1);
        }
      }}
    >
      {statusOrder.map((s) => (
        <Column
          key={s}
          status={s}
          label={statusLabel[s]}
          tasks={byStatus[s]}
          onAdd={() => onAdd(s)}
          onEdit={onEdit}
          onDelete={onDelete}
          onAttempt={onAttempt}
          onMove={(id, idx) => onMove(id, s, idx)}
          focusedId={focusedId}
          setFocusedId={setFocusedId}
        />
      ))}
    </main>
  );
}

function Column({
  status,
  label,
  tasks,
  onAdd,
  onEdit,
  onDelete,
  onAttempt,
  onMove,
  focusedId,
  setFocusedId,
  onSelect,
}: {
  status: Status;
  label: string;
  tasks: Task[];
  onAdd: () => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onAttempt: (t: Task) => void;
  onMove: (id: string, toIndex: number) => void;
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
  onSelect: (t: Task) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const getDropIndex = (e: React.DragEvent) => {
    const container = ref.current;
    if (!container) return tasks.length;
    const cards = Array.from(
      container.querySelectorAll<HTMLDivElement>(".card"),
    );
    // Compute index by mouse Y position
    const y = e.clientY;
    let idx = cards.length;
    for (let i = 0; i < cards.length; i++) {
      const box = cards[i].getBoundingClientRect();
      if (y < box.top + box.height / 2) {
        idx = i;
        break;
      }
    }
    return idx;
  };

  return (
    <section className="column" data-status={status}>
      <header>
        <h2>
          <span className={`status-dot ${status}`}></span>
          {label}
          <span className="count">{tasks.length}</span>
        </h2>
        <button className="add" onClick={onAdd}>
          ＋ 追加
        </button>
      </header>
      <div
        className={"cards" + (dragOver ? " drag-over" : "")}
        id={`col-${status}`}
        ref={ref}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const id = e.dataTransfer.getData("text/plain");
          if (!id) return;
          const idx = getDropIndex(e);
          onMove(id, idx);
          setDraggingId(null);
        }}
      >
        {tasks.map((t) => (
          <Card
            key={t.id}
            task={t}
            dragging={draggingId === t.id}
            focused={focusedId === t.id}
            onDragStart={(id) => setDraggingId(id)}
            onDragEnd={() => setDraggingId(null)}
            onClick={() => {
              setFocusedId(t.id);
              onSelect(t);
            }}
            onEdit={() => onEdit(t)}
            onDelete={() => onDelete(t)}
            onAttempt={() => onAttempt(t)}
          />
        ))}
      </div>
    </section>
  );
}

function Card({
  task,
  dragging,
  onDragStart,
  onDragEnd,
  focused,
  onClick,
  onEdit,
  onDelete,
  onAttempt,
}: {
  task: Task;
  dragging: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  focused: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAttempt: () => void;
}) {
  return (
    <div
      className={"card" + (dragging ? " dragging" : "") + (focused ? " focused" : "")}
      draggable
      data-id={task.id}
      onDragStart={(e) => {
        onDragStart(task.id);
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => onDragEnd()}
      onClick={onClick}
    >
      <div className="title">{task.title}</div>
      {!!task.description && <div className="desc">{task.description}</div>}
      <div className="toolbar">
        <button onClick={onEdit}>編集</button>
        <button onClick={onDelete}>削除</button>
        <button onClick={onAttempt}>新規実行</button>
      </div>
    </div>
  );
}
