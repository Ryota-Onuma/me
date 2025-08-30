export type ToastType = "info" | "success" | "error";
export type ToastPosition =
  | "bottom-left"
  | "bottom-right"
  | "top-left"
  | "top-right";

export function emitToast(
  message: string,
  type: ToastType = "info",
  opts?: { duration?: number; position?: ToastPosition },
) {
  const ev = new CustomEvent("app:toast", {
    detail: {
      message,
      type,
      duration: opts?.duration,
      position: opts?.position,
    },
  });
  window.dispatchEvent(ev);
}
