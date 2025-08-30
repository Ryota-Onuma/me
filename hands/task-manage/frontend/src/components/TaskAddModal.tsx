import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import type { Status } from "../types";

const statusNames: Record<Status, string> = {
  todo: "未着手",
  doing: "進行中",
  done: "完了",
};

export default function TaskAddModal({
  open,
  status,
  onClose,
  onCreate,
}: {
  open: boolean;
  status: Status | null;
  onClose: () => void;
  onCreate: (title: string, description: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setDesc("");
    }
  }, [open]);

  return (
    <Modal open={open} title="タスクを追加" onClose={onClose}>
      <div className="form">
        <div style={{ fontSize: 12, color: "#b3c7e6", marginBottom: 8 }}>
          ステータス: <span>{status ? statusNames[status] : "-"}</span>
        </div>
        <label>
          タイトル <span style={{ color: "#ff6b6b" }}>*</span>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            type="text"
            placeholder="タスクのタイトルを入力"
          />
        </label>
        <label>
          説明（任意）
          <textarea
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="タスクの詳細説明を入力"
          />
        </label>
        <div className="row">
          <button
            onClick={() => {
              if (!title.trim()) {
                alert("タイトルを入力してください");
                return;
              }
              onCreate(title.trim(), desc.trim());
            }}
          >
            追加
          </button>
          <button className="ghost" onClick={onClose}>
            キャンセル
          </button>
        </div>
      </div>
    </Modal>
  );
}
