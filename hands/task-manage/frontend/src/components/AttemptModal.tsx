import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { AttemptAPI, ExecAPI } from "../api";
import type { Attempt, ProfileDef } from "../types";

export default function AttemptModal({
  open,
  taskId,
  onClose,
  onCreated,
}: {
  open: boolean;
  taskId: string | null;
  onClose: () => void;
  onCreated: (attempt: Attempt) => void;
}) {
  const [profiles, setProfiles] = useState<ProfileDef[]>([]);
  const [profile, setProfile] = useState<string>("");
  const [repoPath, setRepoPath] = useState("");
  const [base, setBase] = useState("main");

  useEffect(() => {
    if (!open) return;
    (async () => {
      const ps = await ExecAPI.listProfiles();
      setProfiles(ps);
      setProfile(ps[0]?.label || "");
      if (taskId) {
        try {
          const attempts = await AttemptAPI.list(taskId);
          if (attempts.length > 0) {
            const last = attempts[0];
            setRepoPath(last.repo_path || "");
            setBase(last.base_branch || "main");
            setProfile(last.profile || ps[0]?.label || "");
          } else {
            setRepoPath("");
            setBase("main");
          }
        } catch {}
      }
    })();
  }, [open, taskId]);

  const create = async () => {
    if (!taskId) return;
    if (!repoPath.trim()) {
      alert("リポジトリパスを入力してください");
      return;
    }
    if (!base.trim()) {
      alert("ベースブランチを入力してください");
      return;
    }
    const at = await AttemptAPI.create({
      task_id: taskId,
      profile,
      repo_path: repoPath.trim(),
      base_branch: base.trim(),
    });
    onCreated(at);
    onClose();
  };

  return (
    <Modal open={open} title="新規実行" onClose={onClose}>
      <div className="form">
        <div style={{ fontSize: 12, color: "#b3c7e6" }}>
          タスクID: <span>{taskId}</span>
        </div>
        <label>
          エージェント
          <select value={profile} onChange={(e) => setProfile(e.target.value)}>
            {profiles.map((p) => (
              <option key={p.label} value={p.label}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          リポジトリパス
          <input
            type="text"
            value={repoPath}
            onChange={(e) => setRepoPath(e.target.value)}
            placeholder="例: /path/to/repo"
          />
        </label>
        <label>
          ベースブランチ（必須）
          <input
            type="text"
            value={base}
            onChange={(e) => setBase(e.target.value)}
            placeholder="main / develop など"
          />
        </label>
        <div className="row">
          <button onClick={create}>作成</button>
        </div>
      </div>
    </Modal>
  );
}
