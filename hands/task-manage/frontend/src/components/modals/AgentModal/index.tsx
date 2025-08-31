import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "../../ui/Modal";
import { useNavigate } from "react-router-dom";
import { API, AttemptAPI, ExecAPI, ReposAPI } from "../../../api";
import { emitToast } from "../../../lib/toast";
import type { BranchStatus, ExecProcess, ProfileDef, RepoBookmark } from "../../../types";
import PrCreateModal from "../PrCreateModal";
import ExecDetailsModal from "../../panels/ExecDetailsModal";
import DiffModal from "../DiffModal";

export default function AgentModal({
  open,
  attemptId,
  presetCwd,
  initialConnectExecId,
  initialResume,
  onClose,
}: {
  open: boolean;
  attemptId?: string | null;
  presetCwd?: string;
  initialConnectExecId?: string | null;
  initialResume?: { profile: string; cwd: string; prompt: string; attempt_id?: string };
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"run" | "history">("run");
  const [profiles, setProfiles] = useState<ProfileDef[]>([]);
  const [profile, setProfile] = useState("");
  const [prompt, setPrompt] = useState("");
  const [hist, setHist] = useState<string[]>([]);
  const [, setHistIndex] = useState<number | null>(null);
  const [cwd, setCwd] = useState("");
  // 履歴からの再開で attempt_id を上書きできるように保持
  const [overrideAttemptId, setOverrideAttemptId] = useState<string | null>(null);
  const [history, setHistory] = useState<ExecProcess[]>([]);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [filterProfile, setFilterProfile] = useState<string>("");
  const [filterQuery, setFilterQuery] = useState<string>("");
  const [execId, setExecId] = useState<string | null>(null);
  const [killable, setKillable] = useState(false);
  const [starting, setStarting] = useState(false);
  const [branchStatus, setBranchStatus] = useState<BranchStatus | null>(null);
  const [currentBranch, setCurrentBranch] = useState<string>("");
  const [log, setLog] = useState("");
  const [follow, setFollow] = useState(true);
  const logRef = useRef<HTMLPreElement | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const [prOpen, setPrOpen] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsProc, setDetailsProc] = useState<ExecProcess | null>(null);
  const [repos, setRepos] = useState<RepoBookmark[]>([]);
  const [repoPick, setRepoPick] = useState<string>("");
  const [diffOpen, setDiffOpen] = useState(false);
  const [logWrap, setLogWrap] = useState(true);
  const [fontScale, setFontScale] = useState(12);
  const [statusText, setStatusText] = useState<string>("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [endedAt, setEndedAt] = useState<number | null>(null);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const ps = await ExecAPI.listProfiles();
      setProfiles(ps);
      setProfile(ps[0]?.label || "");
      setPrompt("");
      setCwd(presetCwd || "");
      setOverrideAttemptId(attemptId || null);
      try {
        setRepos(await ReposAPI.list());
      } catch {
        setRepos([]);
      }
      setLog("");
      setKillable(false);
      await reloadHistory();
      await reloadBranchStatus();
      try {
        const raw = localStorage.getItem("agent.promptHistory");
        if (raw) setHist(JSON.parse(raw));
      } catch { /* ignore */ }
    })();
    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (initialConnectExecId) {
      setTab("run");
      setExecId(initialConnectExecId);
      setKillable(true);
      append("●", "[status] connecting...");
      streamLogs(initialConnectExecId);
    } else if (initialResume) {
      setTab("run");
      setProfile(initialResume.profile);
      setCwd(initialResume.cwd || "");
      setPrompt(initialResume.prompt || "");
      setOverrideAttemptId(initialResume.attempt_id || attemptId || null);
      emitToast("履歴の内容を読み込みました。内容を確認して実行してください。", "info");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialConnectExecId, initialResume]);

  // 初期プロンプト: 試行に紐づくタスク説明を使う
  useEffect(() => {
    if (!open || !attemptId) return;
    let cancelled = false;
    (async () => {
      try {
        const at = await AttemptAPI.get(attemptId);
        if (!cancelled) setCurrentBranch(at.branch || "");
        if (!at?.task_id) return;
        const t = await API.getTask(at.task_id);
        if (cancelled) return;
        if (!prompt.trim() && (t.description || "").trim()) {
          setPrompt(t.description || "");
        }
      } catch {
        // 失敗時は無視（初期値未設定）
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, attemptId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && esRef.current) {
        esRef.current.close();
        esRef.current = null;
        setKillable(false);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const pageSize = 20;
  const reloadHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data, total } = await ExecAPI.listPagedWithMeta({
        limit: pageSize,
        offset: 0,
        profile: filterProfile || undefined,
        q: filterQuery || undefined,
      });
      setHistory(data);
      setHistoryOffset(data.length);
      setHistoryHasMore(data.length === pageSize);
      setHistoryTotal(total);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadMoreHistory = async () => {
    if (!historyHasMore || historyLoading) return;
    setHistoryLoading(true);
    try {
      const next = await ExecAPI.listPaged({
        limit: pageSize,
        offset: historyOffset,
        profile: filterProfile || undefined,
        q: filterQuery || undefined,
      });
      setHistory((prev) => [...prev, ...next]);
      setHistoryOffset((o) => o + next.length);
      setHistoryHasMore(next.length === pageSize);
    } finally {
      setHistoryLoading(false);
    }
  };

  const applyRolePreset = (r: "design" | "implement" | "review") => {
    const map: Record<typeof r, string> = {
      design: "あなたはシステム設計者です。要件を分解し、設計と受入基準を提案してください。",
      implement: "あなたは実装者です。差分に基づき小さなコミットで実装し、テストを追加してください。",
      review: "あなたはレビュアーです。変更差分を精読し、改善提案と指摘を箇条書きで出してください。",
    } as const;
    const base = map[r];
    setPrompt((p) => (p.trim() ? p + "\n\n" + base : base));
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
      emitToast("プロンプトを入力してください", "error");
      return;
    }
    // 特別扱い: cd コマンドはローカルで解決
    const cdMatch = prompt.trim().match(/^cd\s+(.+)$/);
    if (cdMatch) {
      const next = resolveCwd(cwd || "", cdMatch[1].trim());
      setCwd(next);
      append("➜", `${ps1} cd → ${next}`);
      setPrompt("");
      return;
    }
    setStarting(true);
    try {
      type StartBody = Parameters<typeof ExecAPI.start>[0];
      const body: StartBody = { profile, prompt: prompt.trim() };
      if (cwd.trim()) body.cwd = cwd.trim();
      if (overrideAttemptId) body.attempt_id = overrideAttemptId;
      append("➜", `${ps1} ${prompt.trim()}`);
      const p = await ExecAPI.start(body);
      // 履歴に積む（直近重複は圧縮）
      setHist((prev) => {
        const trimmed = prompt.trim();
        if (!trimmed) return prev;
        const next = prev.length > 0 && prev[prev.length - 1] === trimmed ? prev : [...prev, trimmed];
        // 上限を軽く設定（直近50件）
        return next.slice(-50);
      });
      setHistIndex(null);
      setExecId(p.id);
      setKillable(true);
      setStatusText("running");
      setStartedAt(Date.parse(p.started_at || new Date().toISOString()));
      setEndedAt(null);
      setExitCode(null);
      setTab("run");
      append("●", "[status] connecting...");
      streamLogs(p.id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      emitToast("実行開始に失敗: " + msg, "error");
      append("●", "[status] start failed: " + msg);
      setKillable(false);
    } finally {
      setStarting(false);
    }
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
    es.addEventListener("status", async (e: MessageEvent) => {
      const st = String(e.data);
      setStatusText(st);
      append("●", `[status] ${st}`);
      if (["completed","failed","killed"].includes(st) && id) {
        try {
          const p = await ExecAPI.get(id);
          setEndedAt(p.ended_at ? Date.parse(p.ended_at) : Date.now());
          setExitCode((p.exit_code as number) ?? null);
        } catch { /* ignore */ }
        setKillable(false);
      }
    });
    es.addEventListener("open", () => append("●", "[status] connected"));
    es.addEventListener("error", () => append("●", "[status] sse error"));
    esRef.current = es;
  };

  const append = (prefix: string, line: string) => {
    setLog((prev) => prev + `${prefix} ${line}\n`);
  };

  // ログの自動追従
  useEffect(() => {
    if (!follow) return;
    const el = logRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [log, follow]);

  const kill = async () => {
    if (!execId) return;
    try {
      await ExecAPI.kill(execId);
      setKillable(false);
      append("●", "[status] killed");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      emitToast("停止に失敗: " + msg, "error");
    }
  };

  const recallFromHistory = (dir: 1 | -1) => {
    if (hist.length === 0) return;
    setHistIndex((idx) => {
      let next: number;
      if (idx == null) {
        next = dir === -1 ? hist.length - 1 : 0;
      } else {
        next = idx + dir;
        if (next < 0) next = 0;
        if (next > hist.length - 1) next = hist.length - 1;
      }
      setPrompt(hist[next] || "");
      return next;
    });
  };

  // 履歴の永続化
  useEffect(() => {
    try { localStorage.setItem("agent.promptHistory", JSON.stringify(hist)); } catch { /* ignore */ }
  }, [hist]);

  const basename = (p: string) => {
    if (!p) return "";
    const s = p.replace(/\\/g, "/");
    const i = s.lastIndexOf("/");
    return i >= 0 ? s.slice(i + 1) : s;
  };
  const ps1 = useMemo(() => {
    const parts: string[] = [];
    if (profile) parts.push(`[${profile}]`);
    if (currentBranch) parts.push(currentBranch);
    if (cwd) parts.push(basename(cwd));
    return parts.join(" ");
  }, [profile, currentBranch, cwd]);

  // cd コマンドの解釈（フロント側疑似動作）
  const norm = (path: string) => {
    const segs = path.replace(/\\/g, "/").split("/");
    const out: string[] = [];
    for (const s of segs) {
      if (!s || s === ".") continue;
      if (s === "..") out.pop(); else out.push(s);
    }
    return (path.startsWith("/") ? "/" : "") + out.join("/");
  };
  const resolveCwd = (base: string, arg: string) => {
    if (!arg) return base;
    if (arg.startsWith("/")) return norm(arg);
    if (arg === "-") return base; // 未実装: 直前のパス
    if (arg === "~") return base; // 未実装: HOME
    const joined = (base ? base.replace(/\\/g, "/").replace(/\/$/, "") + "/" : "") + arg;
    return norm(joined);
  };

  const push = async () => {
    if (!attemptId) return;
    try {
      setPushing(true);
      await AttemptAPI.push(attemptId);
      await reloadBranchStatus();
      emitToast("Push 完了", "success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      emitToast("Push 失敗: " + msg, "error");
    } finally {
      setPushing(false);
    }
  };

  const createPR = async () => {
    if (!attemptId) return;
    setPrOpen(true);
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
    <Modal open={open} title="実行を開始" onClose={onClose}>
      <div className="form">
        <div className="row" style={{ gap: 8 }}>
          <button className={tab === "run" ? "" : "ghost"} onClick={() => setTab("run")}>実行</button>
          <button className={tab === "history" ? "" : "ghost"} onClick={() => { setTab("history"); reloadHistory(); }}>実行履歴</button>
        </div>
        <div style={{ fontSize: 12, color: "#8fa7cc", margin: "4px 0 8px" }}>
          用語: プロファイル＝エージェント設定 / 実行＝1回の起動 / 作業ブランチ＝このタスクの開発用ブランチ
        </div>
        <div className="row" style={{ gap: 8, marginBottom: 8 }}>
          <button className="ghost" onClick={() => navigate("/settings")}>
            エージェントを作成/管理
          </button>
          <span style={{ fontSize: 12, color: "#8fa7cc" }}>→ この画面で実行</span>
        </div>
        {tab === "history" && (
        <div className="row" style={{ gap: 8, alignItems: "end", flexWrap: "wrap" }}>
          <label>
            プロファイル
            <select
              value={filterProfile}
              onChange={(e) => setFilterProfile(e.target.value)}
            >
              <option value="">すべて</option>
              {profiles.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label style={{ flex: 1 }}>
            検索（プロンプト/ディレクトリ）
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="キーワード"
            />
          </label>
          <button
            className="ghost"
            onClick={reloadHistory}
            disabled={historyLoading}
          >
            絞り込み適用
          </button>
        </div>
        )}
        {tab === "run" && (<>
        <label>
          プロファイル
          <select value={profile} onChange={(e) => setProfile(e.target.value)} disabled={starting}>
            {profiles.map((p) => (
              <option key={p.label} value={p.label}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <div>
          <button className="ghost" onClick={() => navigate("/settings")}>
            エージェントを作成/管理
          </button>
          <button className="ghost" onClick={() => setHelpOpen(true)}>
            ヘルプ
          </button>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 4 }}>
          <span style={{ fontSize: 12, color: "#8fa7cc" }}>プリセット:</span>
          <button className="ghost" onClick={() => applyRolePreset("design")}>設計</button>
          <button className="ghost" onClick={() => applyRolePreset("implement")}>実装</button>
          <button className="ghost" onClick={() => applyRolePreset("review")}>レビュー</button>
        </div>
        <div className="row" style={{ alignItems: "end", gap: 8 }}>
          <label style={{ flex: 1 }}>
            コマンド（Enterで実行 / Shift+Enterで改行）
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
                  e.preventDefault();
                  void start();
                } else if (e.key === "ArrowUp" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                  recallFromHistory(-1);
                } else if (e.key === "ArrowDown" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                  recallFromHistory(1);
                } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
                  e.preventDefault();
                  setLog("");
                } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
                  e.preventDefault();
                  void kill();
                }
              }}
              placeholder="例: 画面Aにダークモードを実装しテスト追加"
              disabled={starting}
              autoFocus
            />
          </label>
          <button onClick={start} disabled={starting} className={starting ? "btnIcon" : undefined}>
            {starting && <span className="spinner spinner--sm" aria-hidden="true" />}
            実行
          </button>
        </div>
        {!repoPick ? (
          <label>
            実行ディレクトリ（手入力／省略可）
            <input
              type="text"
              value={cwd}
              onChange={(e) => setCwd(e.target.value)}
              placeholder="例: /path/to/repo"
              disabled={starting}
            />
          </label>
        ) : (
          <div className="row" style={{ alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 12, color: "#b3c7e6" }}>
              実行ディレクトリ: <code style={{ color: "#e5eef7" }}>{cwd || "(未設定)"}</code>
            </div>
            <button
              className="ghost"
              onClick={() => {
                setRepoPick("");
                setCwd("");
              }}
              disabled={starting}
            >
              手入力に切り替え
            </button>
          </div>
        )}
        <label>
          保存済みリポジトリから適用
          <select
            value={repoPick}
            onChange={(e) => {
              const id = e.target.value;
              setRepoPick(id);
              const r = repos.find((x) => x.id === id);
              if (r) setCwd(r.path);
            }}
            disabled={starting}
          >
            <option value="">選択しない</option>
            {repos.map((r) => (
              <option key={r.id} value={r.id}>{`${r.label} — ${r.path}`}</option>
            ))}
          </select>
        </label>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className="danger" disabled={!killable} onClick={kill}>
            停止
          </button>
          <button className="ghost" onClick={reloadHistory}>履歴を更新</button>
          <button className={pushing ? "ghost btnIcon" : "ghost"} disabled={!attemptId || pushing} onClick={push}>
            {pushing && <span className="spinner spinner--sm" aria-hidden="true" />} 
            Push
          </button>
          <button className="ghost" disabled={!attemptId || pushing} onClick={createPR}>
            PR作成
          </button>
          <button className="ghost" disabled={!attemptId} onClick={() => setDiffOpen(true)}>
            Diff
          </button>
          <span style={{ flex: 1 }} />
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={logWrap} onChange={(e) => setLogWrap(e.target.checked)} /> ラップ
          </label>
          <div className="row" style={{ gap: 6 }}>
            <button className="ghost" onClick={() => setFontScale((n) => Math.max(10, n - 1))}>Aa-</button>
            <button className="ghost" onClick={() => setFontScale((n) => Math.min(18, n + 1))}>Aa+</button>
            <button className="ghost" onClick={() => setLog("")}>クリア</button>
            <button className="ghost" onClick={async () => { try { await navigator.clipboard.writeText(log); emitToast("コピーしました", "success"); } catch { /* ignore */ } }}>コピー</button>
            <button className="ghost" onClick={() => {
              const blob = new Blob([log], { type: "text/plain;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `agent-log-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}>保存</button>
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
        </>)}
      {tab === "history" && (
        <div className="log" style={{ maxHeight: "56vh", whiteSpace: "normal" }}>
          <div style={{ fontSize: 12, color: "#b3c7e6", marginBottom: 6 }}>
            履歴: {history.length} / {historyTotal} 件
          </div>
          <div style={{ fontSize: 12, color: "#8fa7cc", marginBottom: 8 }}>
            各行の右側の「続きから」は、実行中なら接続、停止済みなら設定を読み込みます。
          </div>
          {history.length === 0 && <div>実行履歴はありません</div>}
          {history.map((p) => (
            <div key={p.id} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                <div>
                  <div style={{ color: "#e5eef7" }}>
                    {new Date(p.started_at).toLocaleString()} [{p.profile}] {p.status}
                  </div>
                  <div style={{ fontSize: 12, color: "#b3c7e6" }}>
                    cwd: {p.cwd} {p.attempt_id ? ` / attempt:${p.attempt_id.slice(0, 8)}` : ""}
                  </div>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <button
                    className="ghost"
                    title="実行中なら接続、停止済みなら設定を読み込みます"
                    onClick={() => {
                      setTab("run");
                      if (p.status === "running") {
                        setExecId(p.id);
                        setKillable(true);
                        append("●", "[status] connecting...");
                        streamLogs(p.id);
                      } else {
                        setProfile(p.profile);
                        setCwd(p.cwd || "");
                        setPrompt(p.prompt || "");
                        setOverrideAttemptId(p.attempt_id || attemptId || null);
                        emitToast("履歴の内容を読み込みました。内容を確認して実行してください。", "info");
                      }
                    }}
                  >
                    続きから
                  </button>
                  <button
                    className="ghost"
                    onClick={() => {
                      setDetailsProc(p);
                      setDetailsOpen(true);
                    }}
                  >
                    詳細
                  </button>
                </div>
              </div>
            </div>
          ))}
          {historyHasMore && (
            <div style={{ marginTop: 8 }}>
              <button className="ghost" onClick={loadMoreHistory} disabled={historyLoading}>
                {historyLoading ? "読み込み中..." : `さらに読み込む（残り ${Math.max(0, historyTotal - history.length)} 件）`}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "run" && (
        <div style={{ display: "grid", gap: 8 }}>
          <div className="row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} />
              <span>ログ追従</span>
            </label>
            {execId && (
              <div style={{ fontSize: 12, color: "#b3c7e6" }}>
                実行ID: <code style={{ color: "#e5eef7" }}>{execId.slice(0, 8)}</code>
              </div>
            )}
            <div style={{ fontSize: 12, color: "#b3c7e6" }}>
              {cwd ? <span>cwd: <code style={{ color: "#e5eef7" }}>{cwd}</code></span> : <span>cwd: <em>(未設定)</em></span>}
            </div>
            {attemptId && currentBranch && (
              <div style={{ fontSize: 12, color: "#b3c7e6" }}>
                branch: <code style={{ color: "#e5eef7" }}>{currentBranch}</code>
              </div>
            )}
            <div style={{ fontSize: 12, color: "#9bb7dd" }}>
              状態: {statusText || "-"}{" "}
              {startedAt && (<>・{endedAt ? `経過: ${Math.max(0, Math.round((endedAt - startedAt)/1000))}s` : `経過: ${Math.max(0, Math.round((Date.now()-startedAt)/1000))}s`} </>)}
              {exitCode != null && <>・exit {exitCode}</>}
            </div>
          </div>
          <pre className="log" ref={logRef} style={{ margin: 0, whiteSpace: logWrap ? "pre-wrap" : "pre", fontSize: fontScale }}>
            {log}
          </pre>
        </div>
      )}
      </div>
      <PrCreateModal
        open={prOpen}
        defaultTitle={""}
        defaultBase={branchStatus?.base_branch_name || ""}
        onClose={() => setPrOpen(false)}
        onSubmit={async ({ title, base }) => {
          if (!attemptId) return;
          try {
            const pr = await AttemptAPI.pr(attemptId, {
              title,
              body: "",
              base_branch: base,
            });
            emitToast(`PR作成: ${pr.pr_url || "成功"}`, "success");
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            emitToast("PR作成に失敗: " + msg, "error");
          }
        }}
      />
      <ExecDetailsModal
        open={detailsOpen}
        process={detailsProc}
        onClose={() => setDetailsOpen(false)}
      />
      {attemptId && (
        <DiffModal
          open={diffOpen}
          attemptId={attemptId}
          onClose={() => setDiffOpen(false)}
        />
      )}
      <Modal open={helpOpen} title="キーボード操作" onClose={() => setHelpOpen(false)}>
        <div className="form">
          <div>Enter: 実行 / Shift+Enter: 改行</div>
          <div>Ctrl/⌘ + L: ログをクリア</div>
          <div>Ctrl/⌘ + C: 実行を停止</div>
          <div>↑/↓: 入力履歴（直近50件）</div>
          <div>cd PATH: 実行せずに作業ディレクトリを切り替え</div>
        </div>
      </Modal>
    </Modal>
  );
}
