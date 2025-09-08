import { readFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { parseJsonl } from "../parseJsonl";
import { decodeProjectId } from "../project/id";
import type { SessionDetail } from "../types";
import { getSessionMeta } from "./getSessionMeta";

export const getSession = async (
  projectId: string,
  sessionId: string,
): Promise<{
  session: SessionDetail;
}> => {
  const projectPath = decodeProjectId(projectId);
  const sessionPath = resolve(projectPath, `${sessionId}.jsonl`);

  const content = await readFile(sessionPath, "utf-8");

  const conversations = parseJsonl(content);

  const sessionDetail: SessionDetail = {
    id: sessionId,
    jsonlFilePath: sessionPath,
    meta: await getSessionMeta(sessionPath),
    conversations,
  };

  return {
    session: sessionDetail,
  };
};
export const deleteSession = async (
  projectId: string,
  sessionId: string,
): Promise<{ success: boolean }> => {
  const projectPath = decodeProjectId(projectId);
  const sessionPath = resolve(projectPath, `${sessionId}.jsonl`);

  try {
    await unlink(sessionPath);
    return { success: true };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(`Session ${sessionId} not found`);
    }
    throw error;
  }
};
