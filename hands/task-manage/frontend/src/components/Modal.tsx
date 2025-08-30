import React from "react";

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
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="modal">
      <div className="modal__dialog" style={{ width: `min(${width}px, 96vw)` }}>
        <div className="modal__header">
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="ghost" onClick={onClose}>
            閉じる
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
