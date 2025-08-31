import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "../ui/Modal";
import { AttemptAPI } from "../../api";

export default function DiffModal({
  open,
  attemptId,
  onClose,
}: {
  open: boolean;
  attemptId: string;
  onClose: () => void;
}) {
  const [text, setText] = useState<string>("");
  const [context, setContext] = useState<number>(3);
  const [worktree, setWorktree] = useState<boolean>(false);
  const [wrap, setWrap] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(13);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openWithDifitBusy, setOpenWithDifitBusy] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    if (!open || !attemptId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await AttemptAPI.diff(attemptId, { context, worktree });
      setText(res.text || "");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const lines = useMemo(() => (text ? text.split("\n") : []), [text]);
  const renderLine = (ln: string, i: number) => {
    let cls = "";
    if (ln.startsWith("+++ ") || ln.startsWith("--- ") || ln.startsWith("diff --git ") || ln.startsWith("index ")) cls = "h";
    else if (ln.startsWith("@@ ")) cls = "h";
    else if (ln.startsWith("+")) cls = "add";
    else if (ln.startsWith("-")) cls = "del";
    else if (ln.startsWith("### ")) cls = "f";
    return (
      <div key={i} className={`diff-line ${cls}`}>{ln || "\u00A0"}</div>
    );
  };

  return (
    <Modal open={open} title="Diff" onClose={onClose} width={1360}>
      <div className="diffToolbar">
        <label>
          行コンテキスト
          <select value={context} onChange={(e) => setContext(Number(e.target.value))}>
            {[0,1,2,3,5,8,10,20,50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <label className="inline">
          <input type="checkbox" checked={worktree} onChange={(e) => setWorktree(e.target.checked)} /> 未コミットを含める
        </label>
        <label className="inline">
          <input type="checkbox" checked={wrap} onChange={(e) => setWrap(e.target.checked)} /> 折り返し
        </label>
        <label>
          文字サイズ
          <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}>
            {[12,13,14,15,16].map((n) => (
              <option key={n} value={n}>{n}px</option>
            ))}
          </select>
        </label>
        <div className="spacer" />
        <button className="ghost" onClick={load} disabled={loading}>
          {loading ? "更新中..." : "更新"}
        </button>
        <button
          className={openWithDifitBusy ? "ghost btnIcon" : "ghost"}
          onClick={async () => {
            try {
              setOpenWithDifitBusy(true);
              await AttemptAPI.difit(attemptId, { worktree });
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : String(e);
              alert(`difitの起動に失敗しました: ${msg}`);
            } finally {
              setOpenWithDifitBusy(false);
            }
          }}
          disabled={openWithDifitBusy}
          title="ブラウザでdifitビューワを開きます"
        >
          {openWithDifitBusy && <span className="spinner spinner--sm" aria-hidden="true" />} difitで開く
        </button>
      </div>
      {error && <div className="danger-text" style={{ marginTop: 6 }}>{error}</div>}
      <div ref={bodyRef} className="diff diff--full" style={{ marginTop: 8, whiteSpace: wrap ? "pre-wrap" : "pre", fontSize }}>
        {lines.map(renderLine)}
        {loading && (
          <div style={{ marginTop: 12 }} className="btnIcon"><span className="spinner spinner--sm" aria-hidden="true" /> 読み込み中...</div>
        )}
      </div>
    </Modal>
  );
}
