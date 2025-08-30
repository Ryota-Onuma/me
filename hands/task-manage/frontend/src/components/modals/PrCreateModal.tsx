import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { emitToast } from "../../lib/toast";

export default function PrCreateModal({
  open,
  defaultTitle = "",
  defaultBase = "",
  onSubmit,
  onClose,
}: {
  open: boolean;
  defaultTitle?: string;
  defaultBase?: string;
  onSubmit: (v: { title: string; base: string }) => Promise<void> | void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [base, setBase] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(defaultTitle || "");
      setBase(defaultBase || "");
      setBusy(false);
    }
  }, [open, defaultTitle, defaultBase]);

  return (
    <Modal open={open} title="PR作成" onClose={onClose} width={560}>
      <div className="form">
        <label>
          タイトル（省略可）
          <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={busy} />
        </label>
        <label>
          ベースブランチ（省略可）
          <input
            value={base}
            onChange={(e) => setBase(e.target.value)}
            placeholder="例: main"
            disabled={busy}
          />
        </label>
        <div className="row">
          <button className="ghost" onClick={onClose} disabled={busy}>
            キャンセル
          </button>
          <button
            onClick={async () => {
              try {
                setBusy(true);
                const t = title.trim();
                const b = base.trim();
                if (b && !/^[-A-Za-z0-9._/]+$/.test(b)) {
                  emitToast(
                    "ベースブランチに不正な文字が含まれています",
                    "error",
                  );
                  setBusy(false);
                  return;
                }
                if (b.startsWith("/") || b.endsWith("/") || b.includes("//")) {
                  emitToast("ベースブランチの形式が不正です", "error");
                  setBusy(false);
                  return;
                }
                await onSubmit({ title: t, base: b });
                onClose();
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
          >
            {busy ? (
              <span className="btnIcon"><span className="spinner spinner--sm" aria-hidden="true" />作成中...</span>
            ) : (
              "作成"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
