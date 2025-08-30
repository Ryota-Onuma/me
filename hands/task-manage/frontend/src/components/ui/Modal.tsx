import type { ReactNode } from "react";
import { useId, useRef } from "react";
import { useFocusTrap } from "../../lib/useFocusTrap";

export default function Modal({
  open,
  title,
  onClose,
  children,
  width = 960,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  width?: number;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();

  // フォーカストラップとEsc閉じるを有効化（背面操作の誤発火を防止）
  useFocusTrap({
    containerRef: dialogRef,
    enabled: open,
    onEscape: onClose,
    initialFocusRef: undefined,
  });

  if (!open) return null;
  return (
    <div
      className="modal"
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="modal__dialog"
        style={{ width: `min(${width}px, 96vw)` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        tabIndex={-1}
      >
        <div className="modal__header">
          <h3 id={labelId} style={{ margin: 0 }}>{title}</h3>
          <button
            ref={closeBtnRef}
            className="ghost btnIcon"
            aria-label="閉じる"
            onClick={onClose}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3 1.7 1.4z" fill="currentColor"/>
            </svg>
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
