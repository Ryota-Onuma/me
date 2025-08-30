export function hasActiveFormFocus(): boolean {
  if (typeof document === "undefined") return false;
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  // 代表的な入力要素 + contenteditable + 一部のリッチエディタを考慮
  if (
    el.matches(
      'input, textarea, select, [contenteditable="true"], [role="textbox"], [role="combobox"]',
    )
  )
    return true;
  // 入力ウィジェットの内側にいる場合
  const container = el.closest(
    'input, textarea, select, [contenteditable="true"], [role="textbox"], [role="combobox"], .cm-editor, .monaco-editor',
  );
  return !!container;
}

