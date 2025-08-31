import { useState } from "react";
import DiffModal from "../modals/DiffModal";
import type { Attempt } from "../../types";

export function AttemptRow({
  attempt,
  onOpenAttempt,
  onContinue,
  onPush,
  onPR,
  onWorktree,
  formatDate,
}: {
  attempt: Attempt;
  onOpenAttempt: (attempt: Attempt) => void;
  onContinue?: (attempt: Attempt) => void;
  onPush: (id: string) => Promise<void>;
  onPR: (id: string) => Promise<void> | void;
  onWorktree: (attempt: Attempt) => void;
  formatDate: (s: string) => string;
}) {
  const [pushing, setPushing] = useState(false);
  const [creatingPR, setCreatingPR] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);
  const busy = pushing || creatingPR || continuing;
  const baseName = (p: string) => {
    if (!p) return p;
    const sep = p.includes("\\") && !p.includes("/") ? "\\" : "/";
    const parts = p.split(sep).filter(Boolean);
    return parts[parts.length - 1] || p;
  };

  return (
    <div className="attempt">
      <div className="attempt__main">
        <div className="attempt__title">
          <span className="attempt__branch">{attempt.branch}</span>{" "}
          {attempt.locked ? <span title="locked" aria-label="locked">🔒</span> : null}
        </div>
        <div className="attempt__meta">
          {formatDate(attempt.created_at)} ・ base: {attempt.base_branch} ・ ws: {baseName(attempt.worktree_path)}
          {attempt.pr_url ? (
            <>
              {" "}
              ・{" "}
              <a href={attempt.pr_url} target="_blank" rel="noreferrer">
                PR
              </a>
            </>
          ) : null}
        </div>
      </div>
      <div className="attempt__actions">
        <button className="ghost" onClick={() => onOpenAttempt(attempt)} disabled={busy}>
          詳細
        </button>
        {onContinue && (
          <button
            className="ghost"
            disabled={busy}
            title="実行中なら接続、停止済みなら設定を読み込みます"
            onClick={async () => {
              try {
                setContinuing(true);
                await Promise.resolve(onContinue(attempt));
              } finally {
                setContinuing(false);
              }
            }}
          >
            {continuing ? "準備中..." : "続きから"}
          </button>
        )}
        <button
          className={busy ? "ghost btnIcon" : "ghost"}
          disabled={busy}
          onClick={async () => {
            try {
              setPushing(true);
              await onPush(attempt.id);
            } finally {
              setPushing(false);
            }
          }}
        >
          {pushing && <span className="spinner spinner--sm" aria-hidden="true" />} 
          {pushing ? "Pushing..." : "Push"}
        </button>
        <button
          className={busy ? "ghost btnIcon" : "ghost"}
          disabled={busy}
          onClick={async () => {
            try {
              setCreatingPR(true);
              await Promise.resolve(onPR(attempt.id));
            } finally {
              setCreatingPR(false);
            }
          }}
        >
          {creatingPR && <span className="spinner spinner--sm" aria-hidden="true" />} 
          {creatingPR ? "作成中..." : "PR作成"}
        </button>
        <button className="ghost" disabled={busy} onClick={() => setDiffOpen(true)}>
          Diff
        </button>
        <button className="ghost" onClick={() => onWorktree(attempt)} disabled={busy}>
          Worktree
        </button>
      </div>
      <DiffModal open={diffOpen} attemptId={attempt.id} onClose={() => setDiffOpen(false)} />
    </div>
  );
}

export default AttemptRow;
