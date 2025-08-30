import { useEffect, useRef } from "react";

export function useFocusTrap({
  containerRef,
  enabled,
  onEscape,
  initialFocusRef,
  restoreFocus = true,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  enabled: boolean;
  onEscape?: () => void;
  initialFocusRef?: React.RefObject<HTMLElement | null> | null;
  restoreFocus?: boolean;
}) {
  const lastActiveRef = useRef<Element | null>(null);
  const onEscapeRef = useRef(onEscape);

  // onEscape の参照を最新化（イベントリスナーは張り替えず、挙動だけ最新化）
  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!enabled) return;
    lastActiveRef.current = document.activeElement;

    const root = containerRef.current;
    if (root) {
      const focusFirst = () => {
        const target =
          initialFocusRef?.current ||
          root.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
        (target || root).focus();
      };
      // Focus after mount
      setTimeout(focusFirst, 0);
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        onEscapeRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (restoreFocus && lastActiveRef.current instanceof HTMLElement) {
        lastActiveRef.current.focus();
      }
    };
  }, [enabled, containerRef, initialFocusRef, restoreFocus]);
}

export default useFocusTrap;
