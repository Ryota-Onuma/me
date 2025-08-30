import { useState } from "react";
import type { Attempt } from "../../types";

export function AttemptRow({
  attempt,
  onOpenAttempt,
  onContinue,
  onPush,
  onPR,
  formatDate,
}: {
  attempt: Attempt;
  onOpenAttempt: (attempt: Attempt) => void;
  onContinue?: (attempt: Attempt) => void;
  onPush: (id: string) => Promise<void>;
  onPR: (id: string) => Promise<void> | void;
  formatDate: (s: string) => string;
}) {
  const [pushing, setPushing] = useState(false);
  const [creatingPR, setCreatingPR] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const busy = pushing || creatingPR || continuing;

  return (
    <div className="attempt">
      <div className="attempt__main">
        <div className="attempt__title">
          {attempt.profile} ・ <span className="attempt__branch">{attempt.branch}</span>
        </div>
        <div className="attempt__meta">
          {formatDate(attempt.created_at)}
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
      </div>
    </div>
  );
}

export default AttemptRow;
