import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "../../ui/Modal";
import { useNavigate } from "react-router-dom";
import { API, AttemptAPI, ExecAPI, ReposAPI } from "../../../api";
import { emitToast } from "../../../lib/toast";
import type { BranchStatus, ExecProcess, ProfileDef, RepoBookmark } from "../../../types";
import PrCreateModal from "../PrCreateModal";
import ExecDetailsModal from "../../panels/ExecDetailsModal";

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
  const [cwd, setCwd] = useState("");
  // 履歴からの再開で attempt_id を上書きできるように保持
  const [overrideAttemptId, setOverrideAttemptId] = useState<string | null>(null);
  const [history, setHistory] = useState<ExecProcess[]>([]);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [filterProfile, setFilterProfile] = useState<string>("");
  // ステータス別フィルタは削除し、UIとクエリからも外す
  const [filterQuery, setFilterQuery] = useState<string>("");
  const [execId, setExecId] = useState<string | null>(null);
  const [killable, setKillable] = useState(false);
  const [starting, setStarting] = useState(false);
  const [branchStatus, setBranchStatus] = useState<BranchStatus | null>(null);
  const [log, setLog] = useState("");
  const [follow, setFollow] = useState(true);
  const logRef = useRef<HTMLPreElement | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const [prOpen, setPrOpen] = useState(false);
  const [pushing, setPushing] = useState(false);
  // 行展開は廃止（詳細は別モーダルで表示）
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsProc, setDetailsProc] = useState<ExecProcess | null>(null);
  const [repos, setRepos] = useState<RepoBookmark[]>([]);
  const [repoPick, setRepoPick] = useState<string>("");

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
    })();
    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 初期アクション（再接続 / 再開）
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
    setStarting(true);
    try {
      type StartBody = Parameters<typeof ExecAPI.start>[0];
      const body: StartBody = { profile, prompt: prompt.trim() };
      if (cwd.trim()) body.cwd = cwd.trim();
      if (overrideAttemptId) body.attempt_id = overrideAttemptId;
      const p = await ExecAPI.start(body);
      setExecId(p.id);
      setKillable(true);
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
    es.addEventListener("status", (e: MessageEvent) =>
      append("●", `[status] ${e.data}`),
    );
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
        </div>
        <label>
          プロンプト
          <textarea
            rows={5}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                start();
              }
            }}
            placeholder="やりたいことを記述"
            disabled={starting}
          />
        </label>
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
        <div className="row">
          <button onClick={start} disabled={starting} className={starting ? "btnIcon" : undefined}>
            {starting && <span className="spinner spinner--sm" aria-hidden="true" />}
            実行
          </button>
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
          <div className="row" style={{ gap: 8, alignItems: "center" }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} />
              <span>ログ追従</span>
            </label>
            {execId && (
              <div style={{ fontSize: 12, color: "#b3c7e6" }}>
                実行ID: <code style={{ color: "#e5eef7" }}>{execId.slice(0, 8)}</code>
              </div>
            )}
          </div>
          <pre className="log" ref={logRef} style={{ margin: 0 }}>
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
    </Modal>
  );
}
