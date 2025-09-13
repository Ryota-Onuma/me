import * as vscode from 'vscode';
import { sanitizeImagePath, isAllowedImageExt } from './pathSanitizer';

export type ValidationResult = { valid: true } | { valid: false; error: string };

export async function validateImageInput(rawPath: string): Promise<ValidationResult> {
  if (!rawPath) return { valid: false, error: 'Empty path' };

  if (!rawPath.startsWith('file://') && !rawPath.startsWith('data:')) {
    return { valid: false, error: 'Only file:// or data: URIs are allowed' };
  }

  if (rawPath.includes('../') || rawPath.includes('..\\')) {
    return { valid: false, error: 'Path traversal detected' };
  }

  if (rawPath.startsWith('data:')) {
    // Minimal check; actual MIME/content length checks can be added if needed
    return { valid: true };
  }

  const sanitized = sanitizeImagePath(rawPath);
  if (!sanitized) return { valid: false, error: 'Invalid or unsupported image path' };

  try {
    const uri = vscode.Uri.parse(sanitized);
    const stat = await vscode.workspace.fs.stat(uri);
    // Basic check: ensure it ends with allowed extension
    if (!isAllowedImageExt(uri.path)) {
      return { valid: false, error: 'Unsupported file extension' };
    }
    // Ensure the target is a file
    if (stat.type !== vscode.FileType.File) {
      return { valid: false, error: 'Target is not a file' };
    }
    return { valid: true };
  } catch (e: any) {
    return { valid: false, error: `File not accessible: ${e?.message || 'unknown error'}` };
  }
}

export function sanitizeImageList(items: string[] | undefined): string[] {
  if (!items || !Array.isArray(items)) return [];
  const out: string[] = [];
  for (const s of items) {
    if (typeof s !== 'string') continue;
    if (s.startsWith('data:')) { out.push(s); continue; }
    if (s.startsWith('file://')) {
      const p = sanitizeImagePath(s);
      if (p) out.push(p);
    }
  }
  return out;
}
