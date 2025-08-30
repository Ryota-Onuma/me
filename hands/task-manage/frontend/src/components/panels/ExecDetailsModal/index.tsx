import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "../../ui/Modal";
import type { ExecProcess } from "../../../types";
import { ExecAPI } from "../../../api";
import { emitToast } from "../../../lib/toast";

export default function ExecDetailsModal({
  open,
  process,
  onClose,
}: {
  open: boolean;
  process: ExecProcess | null;
  onClose: () => void;
}) {
  type LogEntry = { stream: "stdout" | "stderr" | "status"; text: string };
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [showStdout, setShowStdout] = useState(true);
  const [showStderr, setShowStderr] = useState(true);
  const [showStatus, setShowStatus] = useState(true);
  const [search, setSearch] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [killable, setKillable] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const [follow, setFollow] = useState(true);

  useEffect(() => {
    if (!open || !process) return;
    setEntries([]);
    setKillable(process.status === "running");
    const id = process.id;
    const es = new EventSource(`/api/executions/${id}/stream`);
    es.addEventListener("stdout", (e: MessageEvent) =>
      appendEntry("stdout", e.data as string),
    );
    es.addEventListener("stderr", (e: MessageEvent) =>
      appendEntry("stderr", e.data as string),
    );
    es.addEventListener("status", (e: MessageEvent) =>
      appendEntry("status", `[status] ${e.data}`),
    );
    esRef.current = es;
    return () => {
      es.close();
      esRef.current = null;
    };
  }, [open, process]);

  const appendEntry = (
    stream: "stdout" | "stderr" | "status",
    line: string,
  ) => {
    setEntries((prev) => [...prev, { stream, text: line }]);
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      emitToast(`${label} をコピーしました`, "success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      emitToast(`${label} のコピーに失敗: ${msg}`, "error");
    }
  };

  const download = (text: string, kind: "view" | "full") => {
    if (!process) return;
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `exec-${process.id}-${kind}-${ts}.log`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const kill = async () => {
    if (!process) return;
    try {
      await ExecAPI.kill(process.id);
      setKillable(false);
      appendEntry("status", "[status] killed");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      emitToast("停止に失敗: " + msg, "error");
    }
  };

  const meta = useMemo(() => {
    if (!process) return [] as { k: string; v: string }[];
    return [
      { k: "profile", v: process.profile },
      { k: "cwd", v: process.cwd },
      { k: "cmd", v: process.cmd.join(" ") },
      { k: "status", v: process.status },
      { k: "started", v: new Date(process.started_at).toLocaleString() },
      {
        k: "ended",
        v: process.ended_at ? new Date(process.ended_at).toLocaleString() : "-",
      },
      {
        k: "exit",
        v: process.exit_code != null ? String(process.exit_code) : "-",
      },
      { k: "attempt_id", v: process.attempt_id || "-" },
      { k: "prompt", v: process.prompt },
    ];
  }, [process]);

  const filteredEntries = useMemo(() => {
    const streamOk = (s: "stdout" | "stderr" | "status") =>
      (s === "stdout" && showStdout) ||
      (s === "stderr" && showStderr) ||
      (s === "status" && showStatus);
    if (!search.trim()) return entries.filter((e) => streamOk(e.stream));
    const q = caseSensitive ? search : search.toLowerCase();
    return entries.filter((e) => {
      if (!streamOk(e.stream)) return false;
      const text = caseSensitive ? e.text : e.text.toLowerCase();
      return text.includes(q);
    });
  }, [entries, showStdout, showStderr, showStatus, search, caseSensitive]);

  const fullText = useMemo(
    () => entries.map((e) => `${streamPrefix(e.stream)} ${e.text}\n`).join(""),
    [entries],
  );
  const displayText = useMemo(
    () =>
      filteredEntries
        .map((e) => `${streamPrefix(e.stream)} ${e.text}\n`)
        .join(""),
    [filteredEntries],
  );

  useEffect(() => {
    // 自動スクロール（追従ONのとき）
    const el = logRef.current;
    if (!el || !follow) return;
    el.scrollTop = el.scrollHeight;
  }, [displayText, follow]);

  useEffect(() => {
    // ユーザーが手動スクロールしたら追従OFFにする（最下部付近を外れたら）
    const el = logRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
      if (!nearBottom && follow) setFollow(false);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [follow]);

  return (
    <Modal open={open} title="実行の詳細" onClose={onClose} width={960}>
      {!process ? (
        <div className="muted">選択された実行がありません</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: 12,
            minHeight: 300,
          }}
        >
          <div>
            <div className="row" style={{ gap: 8, marginBottom: 8 }}>
              <button
                className="ghost"
                onClick={() => copy(process.cwd, "cwd")}
              >
                cwdをコピー
              </button>
              <button
                className="ghost"
                onClick={() => copy(process.cmd.join(" "), "cmd")}
              >
                cmdをコピー
              </button>
              <button
                className="ghost"
                onClick={() => copy(process.prompt, "prompt")}
              >
                promptをコピー
              </button>
            </div>
            <div className="log" style={{ whiteSpace: "normal" }}>
              {meta.map(({ k, v }) => (
                <div key={k}>
                  <strong style={{ color: "#b3c7e6" }}>{k}</strong>:{" "}
                  <span style={{ color: "#e5eef7" }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="danger" disabled={!killable} onClick={kill}>
                停止
              </button>
            </div>
          </div>
          <div
            style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: 8 }}
          >
            <div className="row" style={{ gap: 8, alignItems: "center" }}>
              <label
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <input
                  type="checkbox"
                  checked={showStdout}
                  onChange={(e) => setShowStdout(e.target.checked)}
                />
                <span>stdout</span>
              </label>
              <label
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <input
                  type="checkbox"
                  checked={showStderr}
                  onChange={(e) => setShowStderr(e.target.checked)}
                />
                <span>stderr</span>
              </label>
              <label
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <input
                  type="checkbox"
                  checked={showStatus}
                  onChange={(e) => setShowStatus(e.target.checked)}
                />
                <span>status</span>
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ログ検索（Enterで確定不要）"
                style={{ flex: 1, minWidth: 120 }}
              />
              <label
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                />
                <span>大文字小文字を区別</span>
              </label>
              <label
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <input
                  type="checkbox"
                  checked={follow}
                  onChange={(e) => setFollow(e.target.checked)}
                />
                <span>追従</span>
              </label>
              <button
                className="ghost"
                onClick={() => copy(displayText, "表示ログ")}
              >
                表示ログをコピー
              </button>
              <button
                className="ghost"
                onClick={() => copy(fullText, "全ログ")}
              >
                全ログをコピー
              </button>
              <button
                className="ghost"
                onClick={() => download(displayText, "view")}
              >
                表示ログをDL
              </button>
              <button
                className="ghost"
                onClick={() => download(fullText, "full")}
              >
                全ログをDL
              </button>
            </div>
            <div className="log" ref={logRef} style={{ margin: 0, overflow: "auto" }}>
              {filteredEntries.map((e, idx) => (
                <div key={idx} className={`logline logline--${e.stream}`}>
                  <span className="logline__prefix">
                    {streamPrefix(e.stream)}
                  </span>{" "}
                  <span className="logline__text">{e.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function streamPrefix(s: "stdout" | "stderr" | "status"): string {
  return s === "stdout" ? "▶" : s === "stderr" ? "!" : "●";
}
