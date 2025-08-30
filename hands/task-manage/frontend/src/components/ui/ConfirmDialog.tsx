import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  title = "確認",
  message,
  confirmLabel = "OK",
  confirmDisabled = false,
  confirmBusy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  confirmBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel} width={420}>
      <div style={{ paddingTop: 8 }}>
        <div style={{ marginBottom: 16 }}>{message}</div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            className={confirmBusy ? "danger btnIcon" : "danger"}
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmBusy && <span className="spinner spinner--sm" aria-hidden="true" />} {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
