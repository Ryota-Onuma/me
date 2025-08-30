import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { SettingsAPI } from "../api";
import type { ProfileDef } from "../types";

export default function SettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [jsonText, setJsonText] = useState("[]");

  useEffect(() => {
    if (!open) return;
    (async () => {
      const arr = await SettingsAPI.get();
      setJsonText(JSON.stringify(arr, null, 2));
    })();
  }, [open]);

  const save = async () => {
    let arr: ProfileDef[];
    try {
      arr = JSON.parse(jsonText);
    } catch {
      alert("JSON が不正です");
      return;
    }
    await SettingsAPI.save(arr);
    alert("保存しました");
  };

  return (
    <Modal open={open} title="プロファイル設定" onClose={onClose}>
      <div className="form">
        <label>
          JSON 編集（配列形式）
          <textarea
            rows={12}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='[{"label":"claude-code","command":["npx","-y","@anthropic-ai/claude-code@latest"]}]'
          />
        </label>
        <div className="row">
          <button onClick={save}>保存</button>
        </div>
      </div>
    </Modal>
  );
}
