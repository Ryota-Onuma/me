import { useEffect, useMemo, useState } from "react";
import Modal from "../ui/Modal";
import { emitToast } from "../../lib/toast";
import { ReposAPI, SettingsAPI } from "../../api";
import type { ProfileDef, RepoBookmark } from "../../types";

export default function SettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"profiles" | "repos">("profiles");
  const [jsonText, setJsonText] = useState("[]");
  const [repos, setRepos] = useState<RepoBookmark[]>([]);
  const [addLabel, setAddLabel] = useState("");
  const [addPath, setAddPath] = useState("");
  const [addDefaultBase, setAddDefaultBase] = useState("main");
  const [editing, setEditing] = useState<Record<string, { label: string; path: string }>>({});
  const [profilesBusy, setProfilesBusy] = useState(false);
  const [addingRepo, setAddingRepo] = useState(false);
  const [savingRepo, setSavingRepo] = useState<Record<string, boolean>>({});
  const [deletingRepo, setDeletingRepo] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;
    (async () => {
      const arr = await SettingsAPI.get();
      setJsonText(JSON.stringify(arr, null, 2));
      const rs = await ReposAPI.list();
      setRepos(rs);
    })();
  }, [open]);

  const saveProfiles = async () => {
    if (profilesBusy) return;
    let arr: ProfileDef[];
    try {
      arr = JSON.parse(jsonText);
    } catch {
      emitToast("JSON が不正です", "error");
      return;
    }
    setProfilesBusy(true);
    try {
      await SettingsAPI.save(arr);
      emitToast("保存しました", "success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      emitToast("保存に失敗: " + msg, "error");
    } finally {
      setProfilesBusy(false);
    }
  };

  const addRepo = async () => {
    if (addingRepo) return;
    const label = addLabel.trim();
    const path = addPath.trim();
    if (!label || !path) {
      emitToast("ラベルとパスを入力してください", "error");
      return;
    }
    try {
      setAddingRepo(true);
      const def = addDefaultBase.trim();
      const r = await ReposAPI.create({ label, path, default_base_branch: def });
      setRepos((prev) => [r, ...prev]);
      setAddLabel("");
      setAddPath("");
      setAddDefaultBase("main");
      emitToast("追加しました", "success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      emitToast("追加に失敗: " + msg, "error");
    } finally {
      setAddingRepo(false);
    }
  };

  const saveRepo = async (id: string) => {
    const st = editing[id];
    if (!st) return;
    const label = st.label.trim();
    const path = st.path.trim();
    if (!label || !path) {
      emitToast("ラベルとパスを入力してください", "error");
      return;
    }
    try {
      setSavingRepo((prev) => ({ ...prev, [id]: true }));
      const row = repos.find((x) => x.id === id);
      const def = (row?.default_base_branch || "").trim();
      const r = await ReposAPI.update(id, { label, path, default_base_branch: def });
      setRepos((prev) => prev.map((x) => (x.id === id ? r : x)));
      setEditing((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
      emitToast("更新しました", "success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      emitToast("更新に失敗: " + msg, "error");
    } finally {
      setSavingRepo((prev) => ({ ...prev, [id]: false }));
    }
  };

  const removeRepo = async (id: string) => {
    const r = repos.find((x) => x.id === id);
    const ok = window.confirm(
      r ? `「${r.label}」を削除します。よろしいですか？` : "削除しますか？",
    );
    if (!ok) return;
    try {
      setDeletingRepo((prev) => ({ ...prev, [id]: true }));
      await ReposAPI.delete(id);
      setRepos((prev) => prev.filter((x) => x.id !== id));
      emitToast("削除しました", "success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      emitToast("削除に失敗: " + msg, "error");
    } finally {
      setDeletingRepo((prev) => ({ ...prev, [id]: false }));
    }
  };

  const sortedRepos = useMemo(
    () => [...repos].sort((a, b) => a.label.localeCompare(b.label)),
    [repos],
  );

  return (
    <Modal open={open} title="設定" onClose={onClose}>
      <div className="form">
        <div className="row" style={{ gap: 8 }}>
          <button
            className={tab === "profiles" ? "" : "ghost"}
            onClick={() => setTab("profiles")}
          >
            エージェント
          </button>
          <button
            className={tab === "repos" ? "" : "ghost"}
            onClick={() => setTab("repos")}
          >
            リポジトリ
          </button>
        </div>

        {tab === "profiles" && (
          <>
            <div style={{ fontSize: 12, color: "#8fa7cc", margin: "4px 0 8px" }}>
              エージェント＝実行設定（コマンド＋引数）。ここで作成・保存すると、実行画面の一覧に反映されます。
            </div>
            <label>
              エージェント定義（JSON）
              <textarea
                rows={12}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                disabled={profilesBusy}
                placeholder='[{"label":"claude-code","command":["npx","-y","@anthropic-ai/claude-code@latest"]}]'
              />
            </label>
            <div className="row">
              <button onClick={saveProfiles} disabled={profilesBusy} className={profilesBusy ? "btnIcon" : undefined}>
                {profilesBusy && <span className="spinner spinner--sm" aria-hidden="true" />}保存
              </button>
            </div>
          </>
        )}

        {tab === "repos" && (
          <>
            <fieldset style={{ border: "1px solid #1f2e47", borderRadius: 8, padding: 12 }}>
              <legend style={{ fontSize: 12, color: "#b3c7e6" }}>新規追加</legend>
              <div className="row" style={{ gap: 8, alignItems: "end", flexWrap: "wrap" }}>
                <label style={{ flex: 1, minWidth: 200 }}>
                  ラベル
                  <input
                    type="text"
                    value={addLabel}
                    onChange={(e) => setAddLabel(e.target.value)}
                    disabled={addingRepo}
                    placeholder="例: hands"
                  />
                </label>
                <label style={{ flex: 2, minWidth: 260 }}>
                  パス
                  <input
                    type="text"
                    value={addPath}
                    onChange={(e) => setAddPath(e.target.value)}
                    disabled={addingRepo}
                    placeholder="例: /Users/you/work/repo"
                  />
                </label>
                <label style={{ flex: 1, minWidth: 160 }}>
                  デフォルトベース
                  <input
                    type="text"
                    value={addDefaultBase}
                    onChange={(e) => setAddDefaultBase(e.target.value)}
                    disabled={addingRepo}
                    placeholder="例: main"
                  />
                </label>
                <button onClick={addRepo} disabled={addingRepo} className={addingRepo ? "btnIcon" : undefined}>
                  {addingRepo && <span className="spinner spinner--sm" aria-hidden="true" />}追加
                </button>
              </div>
            </fieldset>
            <div style={{ marginTop: 12 }}>
              {sortedRepos.length === 0 ? (
                <div style={{ color: "#b3c7e6", fontSize: 12 }}>登録はありません</div>
              ) : (
                <div className="log" style={{ whiteSpace: "normal" }}>
                  {sortedRepos.map((r) => {
                    const ed = editing[r.id];
                    return (
                      <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr auto", gap: 8, alignItems: "end", marginBottom: 8 }}>
                        <label>
                          ラベル
                          <input
                            type="text"
                            value={ed ? ed.label : r.label}
                            onChange={(e) =>
                              setEditing((prev) => ({ ...prev, [r.id]: { label: e.target.value, path: ed ? ed.path : r.path } }))
                            }
                            disabled={!!savingRepo[r.id] || !!deletingRepo[r.id]}
                          />
                        </label>
                        <label>
                          パス
                          <input
                            type="text"
                            value={ed ? ed.path : r.path}
                            onChange={(e) =>
                              setEditing((prev) => ({ ...prev, [r.id]: { label: ed ? ed.label : r.label, path: e.target.value } }))
                            }
                            disabled={!!savingRepo[r.id] || !!deletingRepo[r.id]}
                          />
                        </label>
                        <label>
                          デフォルトベース
                          <input
                            type="text"
                            value={r.default_base_branch || ""}
                            onChange={(e) =>
                              setRepos((prev) =>
                                prev.map((x) =>
                                  x.id === r.id ? { ...x, default_base_branch: e.target.value } : x,
                                ),
                              )
                            }
                            placeholder="例: main"
                            disabled={!!savingRepo[r.id] || !!deletingRepo[r.id]}
                          />
                        </label>
                        <div className="row" style={{ gap: 6 }}>
                          {ed ? (
                            <>
                              <button onClick={() => saveRepo(r.id)} disabled={!!savingRepo[r.id]} className={savingRepo[r.id] ? "btnIcon" : undefined}>
                                {savingRepo[r.id] && <span className="spinner spinner--sm" aria-hidden="true" />}保存
                              </button>
                              <button
                                className="ghost"
                                onClick={() =>
                                  setEditing((prev) => {
                                    const n = { ...prev };
                                    delete n[r.id];
                                    return n;
                                  })
                                }
                                disabled={!!savingRepo[r.id] || !!deletingRepo[r.id]}
                              >
                                取消
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="ghost" onClick={() => setEditing((prev) => ({ ...prev, [r.id]: { label: r.label, path: r.path } }))} disabled={!!savingRepo[r.id] || !!deletingRepo[r.id]}>編集</button>
                              <button className={deletingRepo[r.id] ? "danger btnIcon" : "danger"} onClick={() => removeRepo(r.id)} disabled={!!deletingRepo[r.id]}>
                                {deletingRepo[r.id] && <span className="spinner spinner--sm" aria-hidden="true" />}削除
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
