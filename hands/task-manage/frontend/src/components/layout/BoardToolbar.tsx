import type { Status } from "../../types";

type Props = {
  statusFilter: Set<Status>;
  onToggle: (s: Status) => void;
  visible: number;
  total: number;
};

const LABEL: Record<Status, string> = {
  todo: "未着手",
  doing: "進行中",
  done: "完了",
};

export default function BoardToolbar({ statusFilter, onToggle, visible, total }: Props) {
  const items: Status[] = ["todo", "doing", "done"];
  return (
    <div className="toolbar">
      <div className="pillGroup" role="group" aria-label="ステータスフィルタ">
        {items.map((s) => {
          const active = statusFilter.has(s);
          return (
            <button
              key={s}
              type="button"
              className={"pill" + (active ? " active" : "")}
              aria-pressed={active}
              aria-current={active ? "true" : undefined}
              data-status={s}
              onClick={() => onToggle(s)}
              title={LABEL[s]}
            >
              <span className={`status-dot ${s}`} aria-hidden />
              {LABEL[s]}
            </button>
          );
        })}
      </div>
      <div className="toolbar__meta" aria-live="polite">
        {visible} / {total} 件
      </div>
    </div>
  );
}
