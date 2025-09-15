export interface PromptMeta {
  name: string;
  description: string;
  tags?: string[];
}

export interface Frontmatter {
  tags?: string[];
  [key: string]: unknown;
}

export interface McpMessage {
  role: 'user' | 'system' | 'assistant';
  content: string;
}

export interface RenderOptions {
  positionalArgs?: string[];
  namedArgs?: Record<string, string>;
  strict?: boolean;
}

export interface PromptResult {
  messages: McpMessage[];
}

export interface PromptStoreOptions {
  flattenPaths?: boolean;
  enableCache?: boolean;
  enableWatch?: boolean;
}

export interface PromptFileInfo {
  name: string;
  relativePath: string;
  absolutePath: string;
  meta: PromptMeta;
  frontmatter: Frontmatter | null;
  lastModified: number;
  contentHash?: string;
}

export interface TemplateContext {
  positionalArgs: string[];
  namedArgs: Record<string, string>;
  strict: boolean;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  ts: number;
  event: string;
  details?: Record<string, unknown>;
  message?: string;
}

export type FrontmatterPolicy = 'keep' | 'strip' | 'system';

export interface SearchFilter {
  query?: string | undefined;
  tags?: string[] | undefined;
}

export interface PromptCache {
  files: Map<string, PromptFileInfo>;
  contents: Map<string, string>;
  lastScan: number;
}

export interface McpPromptRequest {
  name: string;
  arguments?: Record<string, unknown>;
}

export interface McpPromptResponse {
  messages: McpMessage[];
}

export type ErrorCode =
  | 'NotFound'
  | 'InvalidRequest'
  | 'Forbidden'
  | 'InvalidPromptFormat'
  | 'InvalidArguments'
  | 'InternalError';

export interface PromptsError extends Error {
  code: ErrorCode;
  hint?: string | undefined;
  details?: Record<string, unknown> | undefined;
}
