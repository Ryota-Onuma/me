import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Status, Task } from "../../types";
import { memo } from "react";

// ===== Context: Board Actions =====
type BoardActions = {
  addTo: (status: Status) => void;
  selectById: (id: string) => void;
  moveTo: (id: string, toStatus: Status, toIndex: number) => void;
  getTaskById: (id: string) => Task | undefined;
};

const BoardActionsContext = createContext<BoardActions | null>(null);

function useBoardActions(): BoardActions {
  const ctx = useContext(BoardActionsContext);
  if (!ctx) throw new Error("BoardActionsContext not found");
  return ctx;
}

// ===== Context: Column Handlers (per Column instance) =====
type ColumnHandlers = {
  dragStart: (id: string) => void;
  dragEnd: () => void;
  click: (id: string) => void;
  measured: (id: string, h: number) => void;
};

const ColumnHandlersContext = createContext<ColumnHandlers | null>(null);

function useColumnHandlers(): ColumnHandlers {
  const ctx = useContext(ColumnHandlersContext);
  if (!ctx) throw new Error("ColumnHandlersContext not found");
  return ctx;
}

// フォーカス機能は撤去

export interface BoardProps {
  tasks: Task[];
  selectedTaskId?: string | null;
  onAdd: (status: Status) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAttempt: (task: Task) => void;
  onMove: (id: string, toStatus: Status, toIndex: number) => void;
  onSelect: (task: Task) => void;
}

const statusOrder: Status[] = ["todo", "doing", "reviewing", "done"];
const statusLabel: Record<Status, string> = {
  todo: "未着手",
  doing: "進行中",
  reviewing: "レビュー中",
  done: "完了",
};

export default function Board({
  tasks,
  selectedTaskId = null,
  onAdd,
  onEdit,
  onDelete,
  onAttempt,
  onMove,
  onSelect,
}: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  // 最新のハンドラ/タスクを参照するためのRef（Contextの関数ID安定化）
  const tasksRef = useRef<Task[]>(tasks);
  const onAddRef = useRef(onAdd);
  const onEditRef = useRef(onEdit);
  const onDeleteRef = useRef(onDelete);
  const onAttemptRef = useRef(onAttempt);
  const onMoveRef = useRef(onMove);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);
  useEffect(() => void (onAddRef.current = onAdd), [onAdd]);
  useEffect(() => void (onEditRef.current = onEdit), [onEdit]);
  useEffect(() => void (onDeleteRef.current = onDelete), [onDelete]);
  useEffect(() => void (onAttemptRef.current = onAttempt), [onAttempt]);
  useEffect(() => void (onMoveRef.current = onMove), [onMove]);
  useEffect(() => void (onSelectRef.current = onSelect), [onSelect]);

  const byStatus = useMemo(() => {
    const m: Record<Status, Task[]> = { todo: [], doing: [], reviewing: [], done: [] };
    for (const t of tasks) m[t.status].push(t);
    for (const k of statusOrder) m[k].sort((a, b) => a.order - b.order);
    return m;
  }, [tasks]);
  // 初期フォーカス/維持処理は無効化

  const actionsValue = useMemo<BoardActions>(() => {
    const getTaskById = (id: string) =>
      tasksRef.current.find((t) => t.id === id);
    return {
      addTo: (status) => onAddRef.current(status),
      selectById: (id) => {
        const t = getTaskById(id);
        if (t) onSelectRef.current(t);
      },
      moveTo: (id, toStatus, toIndex) =>
        onMoveRef.current(id, toStatus, toIndex),
      getTaskById,
    };
  }, []);

  return (
    <main className="board" id="board" ref={boardRef}>
      <BoardActionsContext.Provider value={actionsValue}>
          {statusOrder.map((s) => (
            <Column
              key={s}
              status={s}
              label={statusLabel[s]}
              tasks={byStatus[s]}
              selectedId={selectedTaskId}
            />
          ))}
      </BoardActionsContext.Provider>
    </main>
  );
}

function Column({
  status,
  label,
  tasks,
  selectedId,
}: {
  status: Status;
  label: string;
  tasks: Task[];
  selectedId: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [avgH, setAvgH] = useState(88); // 推定アイテム高さ（ローリング平均）
  const [scrollTop, setScrollTop] = useState(0);
  const [containerH, setContainerH] = useState(600);
  const [buffer, setBuffer] = useState(6);
  const heightsRef = useRef<Map<string, number>>(new Map());
  const rafRef = useRef<number | null>(null);
  const lastScrollRef = useRef({ t: performance.now(), y: 0 });
  const boardActions = useBoardActions();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setScrollTop(el.scrollTop);
        // 動的バッファ調整（スクロール速度が速いほどバッファ増）
        const now = performance.now();
        const dt = Math.max(16, now - lastScrollRef.current.t);
        const dy = Math.abs(el.scrollTop - lastScrollRef.current.y);
        lastScrollRef.current = { t: now, y: el.scrollTop };
        const v = dy / (dt / 1000); // px/sec
        const dyn = Math.max(6, Math.min(30, Math.round(v / 800) * 4 + 6));
        if (dyn !== buffer) setBuffer(dyn);
      });
    };
    const onResize = () => setContainerH(el.clientHeight || 600);
    setContainerH(el.clientHeight || 600);
    el.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [buffer]);

  const total = tasks.length;
  const windowCount = Math.max(30, Math.ceil(containerH / avgH) + buffer * 2);
  const start = Math.max(
    0,
    Math.min(total, Math.floor(scrollTop / avgH) - buffer),
  );
  const end = Math.max(start, Math.min(total, start + windowCount));
  const topPad = start * avgH;
  const bottomPad = Math.max(0, (total - end) * avgH);

  const getDropIndex = (e: React.DragEvent) => {
    const container = ref.current;
    if (!container) return tasks.length;
    const cards = Array.from(
      container.querySelectorAll<HTMLDivElement>(".card"),
    );
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

  // Column単位のハンドラ（ID安定化）
  const handlers = useMemo<ColumnHandlers>(() => {
    return {
      dragStart: (id: string) => setDraggingId(id),
      dragEnd: () => setDraggingId(null),
      click: (id: string) => {
        boardActions.selectById(id);
      },
      measured: (id: string, h: number) => {
        const old = heightsRef.current.get(id);
        if (old != null && Math.abs(old - h) < 1) return;
        heightsRef.current.set(id, h);
        setAvgH((prev) =>
          Math.max(48, Math.min(240, Math.round(prev * 0.9 + h * 0.1))),
        );
      },
    };
  }, [boardActions]);

  return (
    <section className="column" data-status={status}>
      <header>
        <h2>
          <span className={`status-dot ${status}`}></span>
          {label}
          <span className="count">{tasks.length}</span>
        </h2>
        <button className="add" onClick={() => boardActions.addTo(status)}>
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
          boardActions.moveTo(id, status, idx);
          setDraggingId(null);
        }}
      >
        <div style={{ height: topPad }} />
        <ColumnHandlersContext.Provider value={handlers}>
          {tasks.slice(start, end).map((t) => (
            <Card
              key={t.id}
              id={t.id}
              title={t.title}
              description={t.description}
              dragging={draggingId === t.id}
              selected={selectedId === t.id}
            />
          ))}
        </ColumnHandlersContext.Provider>
        <div style={{ height: bottomPad }} />
      </div>
    </section>
  );
}

type CardProps = {
  id: string;
  title: string;
  description?: string;
  dragging: boolean;
  selected: boolean;
};

function RawCard({ id, title, description, dragging, selected }: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const handlers = useColumnHandlers();
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const measure = () => handlers.measured(id, el.offsetHeight);
    measure();
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [handlers, id]);
  return (
    <div
      className={
        "card" + (dragging ? " dragging" : "") + (selected ? " selected" : "")
      }
      draggable
      data-id={id}
      ref={cardRef}
      onDragStart={(e) => {
        handlers.dragStart(id);
        e.dataTransfer.setData("text/plain", id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => handlers.dragEnd()}
      onClick={() => handlers.click(id)}
    >
      <div className="title">{title}</div>
      {!!description && <div className="desc">{description}</div>}
    </div>
  );
}

const Card = memo(RawCard, (a, b) => {
  return (
    a.id === b.id &&
    a.title === b.title &&
    a.description === b.description &&
    a.dragging === b.dragging
  );
});
