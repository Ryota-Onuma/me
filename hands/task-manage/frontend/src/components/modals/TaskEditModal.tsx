import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { emitToast } from "../../lib/toast";
// タグ機能は廃止

export default function TaskEditModal({
  open,
  initialTitle,
  initialDescription,
  onSubmit,
  onClose,
}: {
  open: boolean;
  initialTitle: string;
  initialDescription: string;
  onSubmit: (v: {
    title: string;
    description: string;
  }) => Promise<void> | void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle || "");
      setDesc(initialDescription || "");
      setBusy(false);
    }
  }, [open, initialTitle, initialDescription]);

  return (
    <Modal open={open} title="タスク編集" onClose={onClose} width={720}>
      <div className="form" style={{ gap: 16 }}>
        <label>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            タイトル <span style={{ color: "#ff6b6b" }}>*</span>
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            disabled={busy}
            className={!title.trim() && busy ? "input--error" : undefined}
          />
        </label>
        <label>
          <span>説明（任意）</span>
          <textarea
            rows={4}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            disabled={busy}
          />
        </label>
        {/* タグ編集は廃止 */}
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button
            onClick={async () => {
              if (!title.trim()) {
                emitToast("タイトルを入力してください", "error");
                return;
              }
              if (title.trim().length > 200) {
                emitToast("タイトルは200文字以内にしてください", "error");
                return;
              }
              if (desc.length > 5000) {
                emitToast("説明は5000文字以内にしてください", "error");
                return;
              }
              try {
                setBusy(true);
                await onSubmit({
                  title: title.trim(),
                  description: desc.trim(),
                });
                onClose();
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
            className={busy ? "btnIcon" : undefined}
          >
            {busy && <span className="spinner spinner--sm" aria-hidden="true" />} {busy ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
