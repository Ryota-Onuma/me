import * as path from 'path';

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

export function sanitizeImagePath(input: string): string | null {
  if (!input) return null;
  try {
    // Only allow file:// or data: URIs (data: is handled upstream without touching FS)
    if (input.startsWith('data:')) return input;
    // Reject any backslash usage in URL to avoid Windows-style traversal tricks
    if (input.includes('\\')) return null;
    const url = new URL(input);
    if (url.protocol !== 'file:') return null;
    // Decode and normalize, check traversal
    const decoded = decodeURIComponent(url.pathname);
    if (decoded.includes('\\')) return null;
    const normalized = path.posix.normalize(decoded);
    if (normalized.includes('..')) return null;
    const ext = path.posix.extname(normalized).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) return null;
    // Rebuild canonical file:// URL
    // Ensure leading slash for POSIX; Windows paths will already be absolute in url.pathname
    const canonical = 'file://' + normalized;
    return canonical;
  } catch {
    return null;
  }
}

export function isAllowedImageExt(p: string): boolean {
  const ext = path.posix.extname(p).toLowerCase();
  return ALLOWED_EXT.has(ext);
}
