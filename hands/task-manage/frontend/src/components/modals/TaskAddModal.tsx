import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { emitToast } from "../../lib/toast";
import type { Status } from "../../types";

const statusNames: Record<Status, string> = {
  todo: "未着手",
  doing: "進行中",
  done: "完了",
};

export default function TaskAddModal({
  open,
  status,
  onClose,
  onCreate,
}: {
  open: boolean;
  status: Status | null;
  onClose: () => void;
  onCreate: (title: string, description: string) => Promise<void> | void;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [titleErr, setTitleErr] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setDesc("");
    }
  }, [open]);

  return (
    <Modal open={open} title="タスクを追加" onClose={onClose}>
      <div className="form">
        <div style={{ fontSize: 12, color: "#b3c7e6", marginBottom: 8 }}>
          ステータス: <span>{status ? statusNames[status] : "-"}</span>
        </div>
        <label>
          タイトル <span style={{ color: "#ff6b6b" }}>*</span>
          <input
            autoFocus
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleErr && e.target.value.trim()) setTitleErr(false);
            }}
            type="text"
            placeholder="タスクのタイトルを入力"
            disabled={busy}
            className={titleErr ? "input--error" : undefined}
          />
        </label>
        <label>
          説明（任意）
          <textarea
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            disabled={busy}
            placeholder="タスクの詳細説明を入力"
          />
        </label>
        <div className="row">
          <button className="ghost" onClick={onClose} disabled={busy}>
            キャンセル
          </button>
          <button
            onClick={async () => {
              if (!title.trim()) {
                emitToast("タイトルを入力してください", "error");
                setTitleErr(true);
                return;
              }
              try {
                setBusy(true);
                await Promise.resolve(onCreate(title.trim(), desc.trim()));
                onClose();
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
            className={busy ? "btnIcon" : undefined}
          >
            {busy && <span className="spinner spinner--sm" aria-hidden="true" />}追加
          </button>
        </div>
      </div>
    </Modal>
  );
}
