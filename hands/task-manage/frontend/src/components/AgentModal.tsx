import React, { useEffect, useMemo, useRef, useState } from "react";
import Modal from "./Modal";
import { AttemptAPI, ExecAPI } from "../api";
import type { BranchStatus, ExecProcess, ProfileDef } from "../types";

export default function AgentModal({
  open,
  attemptId,
  presetCwd,
  onClose,
}: {
  open: boolean;
  attemptId?: string | null;
  presetCwd?: string;
  onClose: () => void;
}) {
  const [profiles, setProfiles] = useState<ProfileDef[]>([]);
  const [profile, setProfile] = useState("");
  const [prompt, setPrompt] = useState("");
  const [cwd, setCwd] = useState("");
  const [history, setHistory] = useState<ExecProcess[]>([]);
  const [execId, setExecId] = useState<string | null>(null);
  const [killable, setKillable] = useState(false);
  const [branchStatus, setBranchStatus] = useState<BranchStatus | null>(null);
  const [log, setLog] = useState("");
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const ps = await ExecAPI.listProfiles();
      setProfiles(ps);
      setProfile(ps[0]?.label || "");
      setPrompt("");
      setCwd(presetCwd || "");
      setLog("");
      setKillable(false);
      await reloadHistory();
      await reloadBranchStatus();
    })();
    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Graceful cleanup of EventSource connections
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      // Close EventSource when page becomes hidden to save resources
      if (document.hidden && esRef.current) {
        esRef.current.close();
        esRef.current = null;
        setKillable(false);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const reloadHistory = async () => {
    const list = await ExecAPI.list();
    setHistory(list);
  };

  const reloadBranchStatus = async () => {
    if (!attemptId) {
      setBranchStatus(null);
      return;
    }
    try {
      setBranchStatus(await AttemptAPI.status(attemptId));
    } catch {
      setBranchStatus(null);
    }
  };

  const start = async () => {
    if (!prompt.trim()) {
      alert("プロンプトを入力してください");
      return;
    }
    const body: Record<string, any> = { profile, prompt: prompt.trim() };
    if (cwd.trim()) body.cwd = cwd.trim();
    if (attemptId) body.attempt_id = attemptId;
    const p = await ExecAPI.start(body as any);
    setExecId(p.id);
    setKillable(true);
    streamLogs(p.id);
  };

  const streamLogs = (id: string) => {
    if (esRef.current) esRef.current.close();
    setLog("");
    const es = new EventSource(`/api/executions/${id}/stream`);
    es.addEventListener("stdout", (e: MessageEvent) =>
      append("▶", e.data as string),
    );
    es.addEventListener("stderr", (e: MessageEvent) =>
      append("!", e.data as string),
    );
    es.addEventListener("status", (e: MessageEvent) =>
      append("●", `[status] ${e.data}`),
    );
    esRef.current = es;
  };

  const append = (prefix: string, line: string) => {
    setLog((prev) => prev + `${prefix} ${line}\n`);
  };

  const kill = async () => {
    if (execId) await ExecAPI.kill(execId);
  };

  const push = async () => {
    if (!attemptId) {
      alert("先に実行を作成してください");
      return;
    }
    try {
      await AttemptAPI.push(attemptId);
      await reloadBranchStatus();
      alert("Push 完了");
    } catch (e: any) {
      alert("Push 失敗: " + (e?.message || String(e)));
    }
  };

  const createPR = async () => {
    if (!attemptId) {
      alert("先に実行を作成してください");
      return;
    }
    const title = window.prompt("PRタイトルを入力（空なら自動）") || "";
    const base = window.prompt("ベースブランチ（空なら実行のベース）") || "";
    try {
      const pr = await AttemptAPI.pr(attemptId, {
        title,
        body: "",
        base_branch: base,
      });
      alert(`PR作成: ${pr.pr_url || "成功"}`);
    } catch (e: any) {
      alert("PR作成に失敗: " + (e?.message || String(e)));
    }
  };

  const branchText = useMemo(() => {
    if (!branchStatus) return "";
    const rb =
      branchStatus.remote_commits_behind == null
        ? "N/A"
        : branchStatus.remote_commits_behind;
    const ra =
      branchStatus.remote_commits_ahead == null
        ? "N/A"
        : branchStatus.remote_commits_ahead;
    return `ブランチ状態: base=${branchStatus.base_branch_name} / behind=${branchStatus.commits_behind} ahead=${branchStatus.commits_ahead} / remote behind=${rb} ahead=${ra} / 未コミット変更=${branchStatus.has_uncommitted_changes ? "あり" : "なし"}`;
  }, [branchStatus]);

  return (
    <Modal open={open} title="エージェントを実行" onClose={onClose}>
      <div className="form">
        <label>
          エージェント
          <select value={profile} onChange={(e) => setProfile(e.target.value)}>
            {profiles.map((p) => (
              <option key={p.label} value={p.label}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          プロンプト
          <textarea
            rows={5}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="やりたいことを記述"
          />
        </label>
        <label>
          実行ディレクトリ（省略可）
          <input
            type="text"
            value={cwd}
            onChange={(e) => setCwd(e.target.value)}
            placeholder="例: /path/to/repo"
          />
        </label>
        <div className="row">
          <button onClick={start}>実行</button>
          <button className="danger" disabled={!killable} onClick={kill}>
            停止
          </button>
          <button className="ghost" onClick={reloadHistory}>
            履歴を更新
          </button>
          <button className="ghost" disabled={!attemptId} onClick={push}>
            Push
          </button>
          <button className="ghost" disabled={!attemptId} onClick={createPR}>
            PR作成
          </button>
        </div>
      </div>

      {attemptId && (
        <div
          id="branchStatus"
          className="log"
          style={{ whiteSpace: "normal", fontSize: 12, color: "#b3c7e6" }}
        >
          {branchText}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: 12,
          minHeight: 240,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "#b3c7e6", marginBottom: 6 }}>
            実行履歴
          </div>
          <div
            className="log"
            style={{ maxHeight: "48vh", whiteSpace: "normal" }}
          >
            {history.length === 0 && <div>履歴はありません</div>}
            {history.map((p) => (
              <a
                key={p.id}
                href="#"
                style={{ display: "block", color: "#e5eef7" }}
                onClick={(e) => {
                  e.preventDefault();
                  setExecId(p.id);
                  setKillable(true);
                  streamLogs(p.id);
                }}
              >
                {new Date(p.started_at).toLocaleString()} [{p.profile}]{" "}
                {p.status}
                {p.attempt_id ? ` attempt:${p.attempt_id.slice(0, 8)}` : ""}
              </a>
            ))}
          </div>
        </div>
        <pre className="log" style={{ margin: 0 }}>
          {log}
        </pre>
      </div>
    </Modal>
  );
}
