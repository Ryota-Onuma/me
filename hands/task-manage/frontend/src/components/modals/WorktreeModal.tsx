import { useCallback, useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { AttemptAPI } from "../../api";
import type { Attempt, BranchStatus } from "../../types";
import ConfirmDialog from "../ui/ConfirmDialog";
import { emitToast } from "../../lib/toast";

export default function WorktreeModal({
  open,
  attempt,
  onClose,
  onUpdated,
}: {
  open: boolean;
  attempt: Attempt | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [status, setStatus] = useState<{ path: string; exists: boolean; branch: string; locked: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<{ open: boolean; kind: "removeKeep" | "removeDelete" | "recreate" | null }>({ open: false, kind: null });
  const [branchStatus, setBranchStatus] = useState<BranchStatus | null>(null);
  const load = useCallback(async () => {
    if (!attempt) return;
    try {
      setStatus(await AttemptAPI.worktreeStatus(attempt.id));
    } catch {
      setStatus(null);
    }
    try {
      const st = await AttemptAPI.status(attempt.id);
      setBranchStatus(st);
    } catch {
      setBranchStatus(null);
    }
  }, [attempt]);
  useEffect(() => { if (open) void load(); }, [open, load]);
  const act = async (fn: () => Promise<unknown>) => { if (busy || !attempt) return; setBusy(true); try { await fn(); await load(); onUpdated(); } finally { setBusy(false);} };
  return (
    <>
      <Modal open={open} title="Worktree" onClose={onClose} width={760}>
        {!attempt ? null : (
          <div className="form" style={{ gap: 10 }}>
            <div className="row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                branch: <code style={{ color: "#e5eef7" }}>{attempt.branch}</code>
                <button className="ghost" style={{ marginLeft: 6 }} onClick={async () => { try { await navigator.clipboard.writeText(attempt.branch); emitToast("コピーしました", "success"); } catch { emitToast("コピーに失敗", "error"); } }}>copy</button>
              </div>
              <div className="chips" style={{ gap: 6 }}>
                <span className={"chip " + (status?.exists ? "chip--ok" : "chip--warn")}>{status?.exists ? "exists" : "missing"}</span>
                <span className={"chip " + (status?.locked ? "chip--warn" : "")}>{status?.locked ? "locked" : "unlocked"}</span>
                <span className={"chip " + (branchStatus?.has_uncommitted_changes ? "chip--warn" : "chip--muted")}>{branchStatus?.has_uncommitted_changes ? "未コミットあり" : "未コミットなし"}</span>
              </div>
            </div>
            <div>
              path: <code style={{ color: "#e5eef7" }}>{status?.path || attempt.worktree_path}</code>
              <button className="ghost" style={{ marginLeft: 6 }} onClick={async () => { try { await navigator.clipboard.writeText(status?.path || attempt.worktree_path); emitToast("コピーしました", "success"); } catch { emitToast("コピーに失敗", "error"); } }}>copy</button>
            </div>

            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              {!status?.locked ? (
                <button className={busy ? "btnIcon" : undefined} disabled={busy} onClick={() => act(() => AttemptAPI.lock(attempt.id, true))}>
                  {busy && <span className="spinner spinner--sm" aria-hidden="true" />} 保護（lock）
                </button>
              ) : (
                <button className={busy ? "btnIcon" : undefined} disabled={busy} onClick={() => act(() => AttemptAPI.lock(attempt.id, false))}>
                  {busy && <span className="spinner spinner--sm" aria-hidden="true" />} 保護解除（unlock）
                </button>
              )}
              <button className="ghost" onClick={() => void load()} disabled={busy}>更新</button>
            </div>

            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend style={{ fontSize: 12, color: "#8fa7cc", marginBottom: 6 }}>復旧・再生成</legend>
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <button
                  className={busy ? "btnIcon" : undefined}
                  disabled={busy || status?.locked}
                  onClick={() => setConfirm({ open: true, kind: "recreate" })}
                  title="作業コピーを作り直します（未コミットは失われます）"
                >
                  {busy && <span className="spinner spinner--sm" aria-hidden="true" />} recreate
                </button>
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                未コミットは失われます。必要なら commit / stash を実施してください。
                {branchStatus?.has_uncommitted_changes && (
                  <span style={{ color: "#ff6b6b", marginLeft: 8 }}>
                    現在、未コミットの変更が検出されています。
                  </span>
                )}
              </div>
            </fieldset>

            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend style={{ fontSize: 12, color: "#8fa7cc", marginBottom: 6 }}>削除（Danger zone）</legend>
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <button
                  className={busy ? "btnIcon" : undefined}
                  disabled={busy || status?.locked}
                  onClick={() => setConfirm({ open: true, kind: "removeKeep" })}
                >
                  {busy && <span className="spinner spinner--sm" aria-hidden="true" />} remove（ブランチ保持）
                </button>
                <button
                  className={busy ? "danger btnIcon" : "danger"}
                  disabled={busy || status?.locked}
                  onClick={() => setConfirm({ open: true, kind: "removeDelete" })}
                >
                  {busy && <span className="spinner spinner--sm" aria-hidden="true" />} remove（ブランチ削除）
                </button>
              </div>
            </fieldset>

            <div className="muted" style={{ fontSize: 12 }}>
              GC（全体の不要 worktree 整理）は 設定 → Repos → メンテナンス に移動しました。
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title={confirm.kind === "recreate" ? "再生成の確認" : confirm.kind === "removeDelete" ? "削除の確認（ブランチ削除）" : "削除の確認"}
        message={(() => {
          const base = confirm.kind === "recreate"
            ? "作業コピーを再生成します。未コミットの変更は失われます。よろしいですか？"
            : confirm.kind === "removeDelete"
              ? "ワークツリーを削除し、ローカルブランチも削除します。未コミットは失われます。よろしいですか？"
              : "ワークツリーのみ削除します（ブランチは保持）。未コミットは失われます。よろしいですか？";
          return branchStatus?.has_uncommitted_changes ? `【警告】未コミットの変更が検出されています。\n\n${base}` : base;
        })()}
        confirmLabel={confirm.kind === "recreate" ? "再生成" : "削除"}
        confirmDisabled={busy}
        confirmBusy={busy}
        onCancel={() => setConfirm({ open: false, kind: null })}
        onConfirm={async () => {
          if (!attempt) return;
          if (!confirm.kind) return;
          if (busy) return;
          try {
            setBusy(true);
            if (confirm.kind === "recreate") {
              await AttemptAPI.worktreeRecreate(attempt.id);
            } else if (confirm.kind === "removeDelete") {
              await AttemptAPI.worktreeRemove(attempt.id, false);
            } else {
              await AttemptAPI.worktreeRemove(attempt.id, true);
            }
            await load();
            onUpdated();
          } finally {
            setBusy(false);
            setConfirm({ open: false, kind: null });
          }
        }}
      />
    </>
  );
}
