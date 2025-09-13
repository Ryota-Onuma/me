import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

let OUT: vscode.OutputChannel | undefined;
function out(...args: any[]) {
  try {
    if (!OUT) OUT = vscode.window.createOutputChannel('Background Image (Unsafe)');
    OUT.appendLine(args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' '));
  } catch {}
}

function ensureDir(p: string) {
  try { fs.mkdirSync(p, { recursive: true }); } catch {}
}

function getBackupDir(): string {
  const dir = path.join(os.homedir(), '.background-image', 'backups');
  ensureDir(dir);
  return dir;
}

function purgeSiblingBackups(targetPath: string) {
  try {
    const dir = path.dirname(targetPath);
    const base = path.basename(targetPath) + '.background-image-backup-';
    for (const f of fs.readdirSync(dir)) {
      if (f.startsWith(base)) {
        try { fs.unlinkSync(path.join(dir, f)); } catch {}
      }
    }
  } catch {}
}

// Markers for identifying patches
export const CSS_START_MARKER = '/* background-image-unsafe-start */';
export const CSS_END_MARKER = '/* background-image-unsafe-end */';
export const JS_START_MARKER = '/* background-image-unsafe-js-start */';
export const JS_END_MARKER = '/* background-image-unsafe-js-end */';

// Supported image MIME types
const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp'
};

export interface UnsafePatchOptions {
  image: string;
  opacity: number;
  size: string;
  position: string;
  repeat: string;
  embedImage: boolean;
}

/**
 * Get workbench CSS file path using various detection methods
 */
export function getWorkbenchCssPath(): string | null {
  const config = vscode.workspace.getConfiguration('backgroundImage.unsafe');
  const manualPath = config.get<string>('workbenchCssPath');

  // Manual override has highest priority
  if (manualPath && fs.existsSync(manualPath)) {
    return manualPath;
  }

  // 1. Try vscode.env.appRoot based detection
  if (vscode.env.appRoot) {
    const candidates = [
      path.join(vscode.env.appRoot, 'out/vs/workbench/workbench.desktop.main.css'),
      path.join(vscode.env.appRoot, 'out/vs/workbench/workbench.web.main.css'),
      path.join(vscode.env.appRoot, 'out/vs/code/browser/workbench/workbench.web.main.css')
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  // 2. Try standard macOS/Windows/Linux application paths first
  const standardPaths = [
    // macOS standard paths
    '/Applications/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.css',
    '/Applications/Visual Studio Code.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.css',
    '/Applications/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.web.main.css',
    '/Applications/Visual Studio Code.app/Contents/Resources/app/out/vs/workbench/workbench.web.main.css',
    // Windows standard paths
    'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\Programs\\cursor\\resources\\app\\out\\vs\\workbench\\workbench.desktop.main.css',
    'C:\\Program Files\\Cursor\\resources\\app\\out\\vs\\workbench\\workbench.desktop.main.css',
    'C:\\Program Files\\Microsoft VS Code\\resources\\app\\out\\vs\\workbench\\workbench.desktop.main.css',
    // Linux standard paths
    '/usr/share/cursor/resources/app/out/vs/workbench/workbench.desktop.main.css',
    '/usr/share/code/resources/app/out/vs/workbench/workbench.desktop.main.css',
    '/opt/cursor/resources/app/out/vs/workbench/workbench.desktop.main.css',
    '/snap/code/current/usr/share/code/resources/app/out/vs/workbench/workbench.desktop.main.css'
  ];

  for (const candidate of standardPaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // 3. Try detection from process.execPath as fallback
  if (process.execPath) {
    const execDir = path.dirname(process.execPath);
    const searchPaths = [
      // Navigate up from executable and search in different patterns
      path.join(execDir, '..', 'resources', 'app', 'out', 'vs', 'workbench'),
      path.join(execDir, '..', 'resources', 'out', 'vs', 'workbench'),
      path.join(execDir, '..', 'Resources', 'app', 'out', 'vs', 'workbench'), // macOS
      path.join(execDir, '..', 'Resources', 'out', 'vs', 'workbench'), // macOS
      path.join(execDir, '..', '..', 'resources', 'app', 'out', 'vs', 'workbench'),
      path.join(execDir, '..', '..', 'resources', 'out', 'vs', 'workbench'),
      path.join(execDir, '..', '..', 'Resources', 'app', 'out', 'vs', 'workbench'), // macOS
      path.join(execDir, '..', '..', 'Resources', 'out', 'vs', 'workbench'), // macOS
      // Additional patterns for different installation types
      path.join(execDir, '..', '..', '..', 'Resources', 'app', 'out', 'vs', 'workbench'),
      path.join(execDir, '..', '..', '..', 'resources', 'app', 'out', 'vs', 'workbench')
    ];

    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        const candidates = [
          path.join(searchPath, 'workbench.desktop.main.css'),
          path.join(searchPath, 'workbench.web.main.css')
        ];

        for (const candidate of candidates) {
          if (fs.existsSync(candidate)) {
            return candidate;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Get workbench JS file path (for JS patches if needed)
 */
export function getWorkbenchJsPath(): string | null {
  const cssPath = getWorkbenchCssPath();
  if (!cssPath) return null;

  const workbenchDir = path.dirname(cssPath);
  const candidates = [
    'workbench.desktop.main.js',
    'workbench.web.main.js',
    'workbench.desktop.main.min.js',
    'workbench.web.main.min.js',
    'workbench.js',
  ].map(f => path.join(workbenchDir, f));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Fallback: scan directory for workbench main js
  try {
    const files = fs.readdirSync(workbenchDir);
    const matches = files
      .filter(f => /workbench\..*main.*\.js$/i.test(f))
      .map(f => path.join(workbenchDir, f))
      .filter(p => fs.existsSync(p))
      .sort((a, b) => (fs.statSync(b).size - fs.statSync(a).size));
    if (matches.length) return matches[0];
  } catch (e) {
    out('getWorkbenchJsPath scan error:', (e as any)?.message || e);
  }

  return null;
}

/**
 * Build JS snippet for dynamic corruption suppression
 */
export function buildJsSuppressionSnippet(): string {
  return `\n${JS_START_MARKER}\n(function(){\n  try {\n    const log = (...a)=>{ try{ console.log('[background-image:unsafe]', ...a); }catch(_){} };\n    log('v1.0.18 JS suppression active');\n\n    const patterns = [\n      'appears to be corrupt','cursor installation','please reinstall','installation appears','installation has been modified','corrupt'\n    ];\n\n    function hide(el){\n      if(!el) return;\n      try {\n        el.style.setProperty('display','none','important');\n        el.style.setProperty('visibility','hidden','important');\n        el.style.setProperty('position','absolute','important');\n        el.style.setProperty('top','-9999px','important');\n        el.style.setProperty('left','-9999px','important');\n        el.setAttribute('data-bgimg-suppressed','1');\n      } catch(_){}\n    }\n\n    function suppress(){\n      let n=0;\n      try {\n        document.querySelectorAll('.editor-banner, .notification-toast-container, .notifications-toasts .notification-toast').forEach(el=>{\n          const t=(el.textContent||el.getAttribute('aria-label')||'').toLowerCase();\n          if(patterns.some(p=>t.includes(p))){ hide(el); n++; }\n        });\n        if(n>0) log('suppressed', n, 'elements');\n      } catch(e){ log('error during suppress', e); }\n    }\n\n    if (document.readyState === 'loading') {\n      document.addEventListener('DOMContentLoaded', suppress);\n    } else {\n      suppress();\n    }\n\n    const mo=new MutationObserver(()=>{ try{ suppress(); }catch(_){}});\n    mo.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class','style','id','aria-label','title'] });\n    setInterval(suppress, 1000);\n    log('JS suppression fully active');\n  } catch (e) { try{ console.error('[background-image:unsafe] JS init error', e);}catch(_){}}\n})();\n${JS_END_MARKER}\n`;
}

/** Strip previously patched JS */
export function stripPatchedJs(content: string): string {
  let result = content;
  let iter = 0;
  const max = 10;
  while (result.includes(JS_START_MARKER) && iter < max) {
    const s = result.indexOf(JS_START_MARKER);
    const e = result.indexOf(JS_END_MARKER);
    if (s !== -1 && e !== -1 && e > s) {
      // include surrounding newlines around the block
      let removeStart = s;
      while (removeStart > 0) {
        const ch = result.charAt(removeStart - 1);
        if (ch === '\n' || ch === '\r' || ch === ' ' || ch === '\t') removeStart--; else break;
      }
      let removeEnd = e + JS_END_MARKER.length;
      while (removeEnd < result.length) {
        const ch2 = result.charAt(removeEnd);
        if (ch2 === '\n' || ch2 === '\r') removeEnd++; else break;
      }
      result = result.substring(0, removeStart) + result.substring(removeEnd);
    } else if (s !== -1) {
      let removeStart = s;
      while (removeStart > 0) {
        const ch3 = result.charAt(removeStart - 1);
        if (ch3 === '\n' || ch3 === '\r') removeStart--; else break;
      }
      result = result.substring(0, removeStart);
      break;
    } else {
      break;
    }
    iter++;
  }
  return result;
}

/** Apply dynamic JS suppression to workbench JS */
export function applyJsSuppressionPatch(): boolean {
  try {
    const jsPath = getWorkbenchJsPath();
    console.log('🔥 applyJsSuppressionPatch: Detected JS path:', jsPath);
    out('jsPath', String(jsPath));
    if (!jsPath) return false;
    if (!fs.existsSync(jsPath)) return false;

    fs.accessSync(jsPath, fs.constants.R_OK | fs.constants.W_OK);
    let content = fs.readFileSync(jsPath, 'utf-8');
    const before = content.length;
    const cleanContent = stripPatchedJs(content);
    const stripped = cleanContent.length;
    const snippet = buildJsSuppressionSnippet();
    let finalContent = cleanContent;
    if (!finalContent.endsWith('\n')) finalContent += '\n';
    finalContent += snippet;
    if (!finalContent.endsWith('\n')) finalContent += '\n';

    const backupDirJs = getBackupDir();
    const backupPath = path.join(backupDirJs, path.basename(jsPath) + '.background-image-backup-' + Date.now() + '.bak');
    try { fs.writeFileSync(backupPath, cleanContent, 'utf-8'); } catch {}
    const fd = fs.openSync(jsPath, 'w');
    fs.writeFileSync(fd, finalContent, 'utf-8');
    try { fs.fsyncSync(fd); } catch {}
    fs.closeSync(fd);
    purgeSiblingBackups(jsPath);
    const verify = fs.readFileSync(jsPath, 'utf-8');
    const ok = verify.includes(JS_START_MARKER) && verify.includes(JS_END_MARKER);
    console.log('✅ applyJsSuppressionPatch: done', { removed: before - stripped, ok });
    out('applyJsSuppressionPatch', JSON.stringify({ removed: before - stripped, ok }));
    return ok;
  } catch (e: any) {
    console.error('❌ applyJsSuppressionPatch error:', e?.message || e);
    out('applyJsSuppressionPatch error', e?.message || String(e));
    return false;
  }
}

/** Remove JS suppression patch */
export function removeJsPatch(): boolean {
  try {
    const jsPath = getWorkbenchJsPath();
    console.log('🗑️ removeJsPatch: jsPath', jsPath);
    if (!jsPath || !fs.existsSync(jsPath)) return true;
    // Try restore from backup first
    if (restoreFromBackup(jsPath)) {
      const verifyBk = fs.readFileSync(jsPath, 'utf-8');
      purgeSiblingBackups(jsPath);
      return !verifyBk.includes(JS_START_MARKER);
    }
    const original = fs.readFileSync(jsPath, 'utf-8');
    const cleaned = stripPatchedJs(original);
    if (original.length === cleaned.length) return true;
    fs.writeFileSync(jsPath, cleaned, 'utf-8');
    const verify = fs.readFileSync(jsPath, 'utf-8');
    purgeSiblingBackups(jsPath);
    return !verify.includes(JS_START_MARKER);
  } catch (e) {
    console.error('❌ removeJsPatch error:', e);
    return false;
  }
}

/**
 * Guess MIME type from file extension
 */
function guessMime(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Convert local file to data: URL
 */
function toDataUrl(localPath: string): string {
  const buffer = fs.readFileSync(localPath);
  const mime = guessMime(localPath);
  const base64 = buffer.toString('base64');
  return `data:${mime};base64,${base64}`;
}

/**
 * Resolve image URL for unsafe mode
 */
export function resolveImageUrl(image: string, embed: boolean): string {
  if (!image) return '';

  // data: URLs pass through
  if (image.startsWith('data:')) {
    return image;
  }

  // HTTP(S) URLs pass through (user's responsibility)
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }

  // file:// URLs
  if (image.startsWith('file://')) {
    if (embed) {
      try {
        const uri = vscode.Uri.parse(image);
        return toDataUrl(uri.fsPath);
      } catch {
        return image; // fallback to original
      }
    }
    return image;
  }

  // Local paths - resolve to absolute and convert to file:// or data:
  let absolutePath: string;

  if (path.isAbsolute(image)) {
    absolutePath = image;
  } else {
    // Resolve relative to workspace
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspaceRoot) {
      absolutePath = path.resolve(workspaceRoot, image);
    } else {
      absolutePath = path.resolve(os.homedir(), image.replace(/^~\//, ''));
    }
  }

  if (fs.existsSync(absolutePath)) {
    if (embed) {
      try {
        return toDataUrl(absolutePath);
      } catch {
        return `file://${absolutePath}`;
      }
    } else {
      return `file://${absolutePath}`;
    }
  }

  return image; // fallback
}

/**
 * Build CSS block for unsafe mode
 */
export function buildCssBlock(options: UnsafePatchOptions): string {
  const url = resolveImageUrl(options.image, options.embedImage);
  const safeUrl = url.replace(/"/g, '\\"');
  const opacity = Math.max(0, Math.min(1, Number(options.opacity) || 0));

  return `
${CSS_START_MARKER}
/* WARNING: This CSS was injected by Background Image extension in UNSAFE mode */
/* It modifies VS Code/Cursor workbench files directly and may break with updates */

body {
  position: relative;
}

body::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1000;
  background-image: url("${safeUrl}");
  background-size: ${options.size};
  background-position: ${options.position};
  background-repeat: ${options.repeat};
  opacity: ${opacity};
}

/* Make editor backgrounds transparent to show background */
.editor-container .monaco-editor-background {
  background: none !important;
}

/* Hide known integrity check notifications and corruption alerts */
.notification-toast-container[aria-label*="corrupt" i],
.notification-toast-container[aria-label*="installation appears" i],
.notification-toast-container[aria-label*="reinstall" i],
.notification-toast-container[aria-label*="cursor installation" i],
.notification-toast-container[aria-label*="appears to be corrupt" i] {
  display: none !important;
}

/* Hide notification banners about corruption */
.monaco-workbench .notifications-list-container .notification-list-item[aria-label*="corrupt" i],
.monaco-workbench .notifications-list-container .notification-list-item[aria-label*="cursor installation" i],
.monaco-workbench .notifications-list-container .notification-list-item[aria-label*="reinstall" i] {
  display: none !important;
}

/* Target corruption-specific elements only */
[aria-label*="corrupt" i],
[aria-label*="reinstall" i],
[aria-label*="cursor installation" i],
[aria-label*="appears to be corrupt" i],
[title*="corrupt" i],
[title*="reinstall" i],
[title*="cursor installation" i] {
  display: none !important;
}

/* Hide corruption notifications with multiple selectors */
.notification-toast-container[aria-label*="corrupt" i],
.notification-toast-container[aria-label*="reinstall" i],
.notification-toast-container[aria-label*="cursor installation" i] {
  display: none !important;
}

/* (Removed) Status bar suppression to avoid false positives */

/* Target editor banners only when they mention corruption */
.part.editor .editor-banner[aria-label*="corrupt" i],
.part.editor .editor-banner[aria-label*="reinstall" i],
.part.editor .editor-banner[aria-label*="cursor installation" i],
.part.editor .editor-banner[title*="corrupt" i],
.part.editor .editor-banner[title*="reinstall" i] {
  display: none !important;
}

/* Limit notification suppression to corruption messages only */
.monaco-workbench .notifications-list-container .notification-list-item[aria-label*="corrupt" i],
.monaco-workbench .notifications-list-container .notification-list-item[aria-label*="reinstall" i],
.monaco-workbench .notifications-list-container .notification-list-item[aria-label*="cursor installation" i] {
  display: none !important;
}

/* Target elements containing corruption text more broadly */
.monaco-workbench *[title*="corrupt" i],
.monaco-workbench *[aria-label*="corrupt" i],
.monaco-workbench *[title*="reinstall" i],
.monaco-workbench *[aria-label*="reinstall" i],
.monaco-workbench *[title*="cursor installation" i],
.monaco-workbench *[aria-label*="cursor installation" i] {
  display: none !important;
}

/* Hide any notifications in the editor area */
.editor-container .notifications,
.editor-instance .notifications,
.editor-group .notifications,
.split-view-container .notifications {
  display: none !important;
}

/* Restrict suppression to toast items carrying the exact corruption texts */
.monaco-workbench .notification-toast-container[aria-label*="appears to be corrupt" i],
.monaco-workbench .notification-toast-container[aria-label*="cursor installation" i],
.monaco-workbench .notification-toast-container[aria-label*="please reinstall" i] {
  display: none !important;
}

/* Additional selectors for banner-style notifications */
.editor-banner[aria-label*="corrupt" i],
.notifications-banner[aria-label*="corrupt" i],
.banner[aria-label*="corrupt" i],
*[class*="banner"][title*="corrupt" i],
*[class*="banner"][title*="reinstall" i],
*[class*="notification"][title*="corrupt" i],
*[class*="notification"][title*="reinstall" i] {
  display: none !important;
}

/* NUCLEAR OPTION: Complete corruption notification suppression */

/* Hide ALL banner-type elements (aggressive approach) */
.editor-group-container > .editor-banner,
.monaco-workbench .part.editor > .editor-banner,
.monaco-workbench .editor-group-container > .notifications-banner,
.monaco-workbench .editor-container .notifications-banner,
.monaco-workbench .part.editor [class*="editor-banner"],
.monaco-workbench .part.editor [class*="notifications-banner"],
.monaco-workbench .part.editor [class*="banner"],
.monaco-workbench .part.editor div[class*="banner"],
.monaco-workbench .part.editor div[role="banner"] {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  height: 0 !important;
  overflow: hidden !important;
}

/* Target ALL notification-related DOM structures within editor area only */
.monaco-workbench .part.editor div[class*="notification"],
.monaco-workbench .part.editor div[id*="notification"],
.monaco-workbench .part.editor .notifications,
.monaco-workbench .part.editor [role="alert"],
.monaco-workbench .part.editor [role="alertdialog"],
.monaco-workbench .part.editor .editor-group-container > div:has([class*="corrupt"]),
.monaco-workbench .part.editor .editor-group-container > div:has([title*="corrupt"]) {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}

/* Emergency override: hide common VS Code/Cursor UI elements that might show corruption */
.monaco-workbench .workbench-grid > .part.editor .editor-banner[aria-label*="corrupt" i],
.monaco-workbench .workbench-grid .editor-group-container .editor-banner[aria-label*="corrupt" i],
.monaco-workbench .split-view-container .editor-banner[aria-label*="corrupt" i],
.monaco-workbench .editor-instance .editor-banner[aria-label*="corrupt" i],
.monaco-workbench .editor-group .editor-banner[aria-label*="corrupt" i],
.monaco-workbench .editor-group-container .editor-banner[aria-label*="corrupt" i],
.monaco-workbench .part.editor .editor-banner[aria-label*="corrupt" i],
.monaco-workbench .workbench-grid > .part.editor .editor-banner[aria-label*="reinstall" i],
.monaco-workbench .workbench-grid .editor-group-container .editor-banner[aria-label*="reinstall" i],
.monaco-workbench .split-view-container .editor-banner[aria-label*="reinstall" i],
.monaco-workbench .editor-instance .editor-banner[aria-label*="reinstall" i],
.monaco-workbench .editor-group .editor-banner[aria-label*="reinstall" i],
.monaco-workbench .editor-group-container .editor-banner[aria-label*="reinstall" i],
.monaco-workbench .part.editor .editor-banner[aria-label*="reinstall" i] {
  display: none !important;
  visibility: hidden !important;
  position: absolute !important;
  left: -9999px !important;
  width: 0 !important;
  height: 0 !important;
  overflow: hidden !important;
}

/* Target all possible banner positions */
.monaco-workbench .part.editor > div:first-child,
.monaco-workbench .editor-group-container > div:first-child,
.monaco-workbench .editor-container > div:first-child {
  /* Check if this is likely a banner element */
}

.monaco-workbench .part.editor > div:first-child[class*="banner"],
.monaco-workbench .editor-group-container > div:first-child[class*="banner"],
.monaco-workbench .editor-container > div:first-child[class*="banner"] {
  display: none !important;
}

/* More comprehensive approach: target yellow warning banners */
.monaco-workbench div[style*="background-color: rgb(255, 244, 206)"],
.monaco-workbench div[style*="background-color: #fff4ce"],
.monaco-workbench div[style*="background: rgb(255, 244, 206)"],
.monaco-workbench div[style*="background: #fff4ce"],
.monaco-workbench .warning-banner,
.monaco-workbench .info-banner,
.monaco-workbench .notification-banner {
  display: none !important;
  visibility: hidden !important;
}

/* Target elements with corruption-related classes or IDs (limit to editor area) */
.monaco-workbench .part.editor [class*="corrupt"],
.monaco-workbench .part.editor [id*="corrupt"],
.monaco-workbench .part.editor [class*="installation-error"],
.monaco-workbench .part.editor [id*="installation-error"],
.monaco-workbench .part.editor [class*="integrity"],
.monaco-workbench .part.editor [id*="integrity"] {
  display: none !important;
}

/* Hide elements with warning/error styling that might contain corruption messages */
.monaco-workbench .monaco-icon-warning,
.monaco-workbench .warning-icon,
.monaco-workbench .error-icon,
.monaco-workbench .codicon-warning {
  display: none !important;
}

/* Ultra-aggressive approach: any element with corruption-related styling */
.monaco-workbench *[style*="background-color: rgb(255, 244, 206)"],
.monaco-workbench *[style*="background-color: #fff4ce"],
.monaco-workbench *[style*="border-color: rgb(255, 208, 105)"],
.monaco-workbench .monaco-banner,
.monaco-workbench .banner-container,
.monaco-workbench .warning-banner,
.monaco-workbench .info-banner {
  display: none !important;
  visibility: hidden !important;
}

/* Removed ultra-aggressive global selectors to avoid UI side effects */

${CSS_END_MARKER}
`;
}

/**
 * Strip patched CSS from content
 */
export function stripPatchedCss(content: string): string {
  console.log('🧹 stripPatchedCss: Processing content...');
  out('stripPatchedCss start len', String(content.length));

  let result = content;
  let iterationCount = 0;
  const maxIterations = 10; // Prevent infinite loops

  while (result.includes(CSS_START_MARKER) && iterationCount < maxIterations) {
    let startIndex = result.indexOf(CSS_START_MARKER);
    let endIndex = result.indexOf(CSS_END_MARKER);

    console.log(`🔄 Iteration ${iterationCount + 1}: Start=${startIndex}, End=${endIndex}`);

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      // include surrounding whitespace/newlines to restore exact bytes
      let removeStart = startIndex;
      while (removeStart > 0) {
        const ch = result.charAt(removeStart - 1);
        if (ch === '\\n' || ch === '\\r' || ch === ' ' || ch === '\\t') {
          removeStart--;
        } else {
          break;
        }
      }
      let removeEnd = endIndex + CSS_END_MARKER.length;
      while (removeEnd < result.length) {
        const ch2 = result.charAt(removeEnd);
        if (ch2 === '\\n' || ch2 === '\\r') {
          removeEnd++;
        } else {
          break;
        }
      }
      const before = result.substring(0, removeStart);
      const after = result.substring(removeEnd);
      result = before + after;

      console.log(`✂️ Removed patch chunk: ${removeEnd - removeStart} characters`);
    } else if (startIndex !== -1) {
      // Handle case where end marker is missing
      let removeStart = startIndex;
      while (removeStart > 0) {
        const ch3 = result.charAt(removeStart - 1);
        if (ch3 === '\\n' || ch3 === '\\r') {
          removeStart--;
        } else {
          break;
        }
      }
      result = result.substring(0, removeStart);
      console.log('⚠️ End marker missing, truncated at start marker');
      break;
    } else {
      break;
    }

    iterationCount++;
  }

  console.log(`🏁 stripPatchedCss: Completed after ${iterationCount} iterations`);
  out('stripPatchedCss iterations', String(iterationCount));
  return result;
}

/**
 * Apply CSS patch to workbench file
 */
export function applyCssPatch(options: UnsafePatchOptions): boolean {
  console.log('🔥 applyCssPatch: Starting CSS patch application...');
  out('applyCssPatch options', JSON.stringify(options));

  // Try multiple CSS paths in order of preference
  const cssPath = getWorkbenchCssPath();
  console.log('🔥 applyCssPatch: Detected CSS path:', cssPath);
  out('cssPath', String(cssPath));

  if (!cssPath) {
    console.error('❌ applyCssPatch: No CSS path found');
    vscode.window.showErrorMessage('Cannot find Cursor workbench CSS file. Please set backgroundImage.unsafe.workbenchCssPath manually.');
    return false;
  }

  console.log('🔥 applyCssPatch: Attempting to patch:', cssPath);

  try {
    // Comprehensive file checks
    if (!fs.existsSync(cssPath)) {
      console.error('❌ applyCssPatch: CSS file does not exist:', cssPath);
      vscode.window.showErrorMessage(`CSS file not found: ${cssPath}`);
      return false;
    }

    const stats = fs.statSync(cssPath);
    console.log('🔥 applyCssPatch: File stats:', {
      size: stats.size,
      isFile: stats.isFile(),
      mode: stats.mode.toString(8)
    });

    // Check file permissions with detailed error reporting
    try {
      fs.accessSync(cssPath, fs.constants.R_OK | fs.constants.W_OK);
      console.log('✅ applyCssPatch: File permissions OK');
    } catch (permError: any) {
      console.error('❌ applyCssPatch: Permission error:', permError.message);
      out('permission error', permError.message);
      vscode.window.showErrorMessage(`No write permission to CSS file: ${cssPath}. Try running Cursor as administrator or change file permissions.`);
      return false;
    }

    // Read existing content
    let content: string;
    try {
      content = fs.readFileSync(cssPath, 'utf-8');
      console.log('✅ applyCssPatch: Read CSS file successfully, length:', content.length);
    } catch (readError: any) {
      console.error('❌ applyCssPatch: Error reading CSS file:', readError.message);
      out('read error', readError.message);
      vscode.window.showErrorMessage(`Cannot read CSS file: ${readError.message}`);
      return false;
    }

    // Remove any existing patches (prepare clean baseline)
    const originalLength = content.length;
    const cleanContent = stripPatchedCss(content);
    const strippedLength = cleanContent.length;
    const removedChars = originalLength - strippedLength;
    console.log(`🔥 applyCssPatch: Stripped existing patches, removed: ${removedChars} characters`);
    out('strip removed chars', String(removedChars));

    // Validate image URL
    const imageUrl = resolveImageUrl(options.image, options.embedImage);
    if (!imageUrl) {
      console.error('❌ applyCssPatch: Invalid image URL');
      vscode.window.showErrorMessage('Invalid image path or URL');
      return false;
    }
    console.log('✅ applyCssPatch: Resolved image URL:', imageUrl.substring(0, 100) + (imageUrl.length > 100 ? '...' : ''));

    // Build CSS block
    let cssBlock: string;
    try {
      cssBlock = buildCssBlock(options);
      console.log('✅ applyCssPatch: Generated CSS block, length:', cssBlock.length);
    } catch (buildError: any) {
      console.error('❌ applyCssPatch: Error building CSS:', buildError.message);
      out('build error', buildError.message);
      vscode.window.showErrorMessage(`CSS generation failed: ${buildError.message}`);
      return false;
    }

    // Build final content: clean + patch + trailing newline
    let contentFinal = cleanContent;
    if (!contentFinal.endsWith('\n')) contentFinal += '\n';
    contentFinal += cssBlock;
    if (!contentFinal.endsWith('\n')) contentFinal += '\n';
    console.log('🔥 applyCssPatch: Final CSS length:', contentFinal.length);

    // Create backup (outside app dir to avoid integrity warnings)
    const backupDir = getBackupDir();
    const backupPath = path.join(backupDir, path.basename(cssPath) + '.background-image-backup-' + Date.now() + '.bak');
    try {
      fs.writeFileSync(backupPath, cleanContent, 'utf-8');
      console.log('✅ applyCssPatch: Created backup at:', backupPath);
      out('backup', backupPath);
    } catch (backupError: any) {
      console.warn('⚠️ applyCssPatch: Could not create backup:', backupError.message);
    }

    // Remove any legacy sibling backups to clear integrity warnings
    purgeSiblingBackups(cssPath);

    // Write patched content
    try {
      const fd = fs.openSync(cssPath, 'w');
      fs.writeFileSync(fd, contentFinal, 'utf-8');
      try { fs.fsyncSync(fd); } catch {}
      fs.closeSync(fd);
      console.log('✅ applyCssPatch: Successfully wrote CSS file');
    } catch (writeError: any) {
      console.error('❌ applyCssPatch: Error writing CSS file:', writeError.message);
      out('write error', writeError.message);
      vscode.window.showErrorMessage(`Failed to write CSS file: ${writeError.message}`);
      return false;
    }

    // Verify write with multiple checks
    try {
      const verifyContent = fs.readFileSync(cssPath, 'utf-8');
      const hasStartMarker = verifyContent.includes(CSS_START_MARKER);
      const hasEndMarker = verifyContent.includes(CSS_END_MARKER);
      const hasImageUrl = verifyContent.includes(imageUrl.substring(0, 50));

      console.log('🔥 applyCssPatch: Verification results:', {
        hasStartMarker,
        hasEndMarker,
        hasImageUrl,
        finalLength: verifyContent.length
      });
      out('verify', JSON.stringify({ hasStartMarker, hasEndMarker, hasImageUrl, finalLength: verifyContent.length }));

      if (hasStartMarker && hasEndMarker) {
        console.log('✅ applyCssPatch: Patch successfully applied and verified');
        return true;
      } else {
        console.error('❌ applyCssPatch: Verification failed - markers not found');
        return false;
      }
    } catch (verifyError: any) {
      console.error('❌ applyCssPatch: Verification error:', verifyError.message);
      return false;
    }

  } catch (error: any) {
    console.error('❌ applyCssPatch: Unexpected error:', error.message, error.stack);
    vscode.window.showErrorMessage(`Unexpected error during CSS patching: ${error.message}`);
    return false;
  }
}

/**
 * Remove CSS patch from workbench file
 */
export function removeCssPatch(): boolean {
  console.log('🗑️ removeCssPatch: Starting patch removal...');
  out('removeCssPatch start');

  const cssPath = getWorkbenchCssPath();
  console.log('📁 CSS path for removal:', cssPath);

  if (!cssPath) {
    console.error('❌ No CSS path found for removal');
    return false;
  }

  if (!fs.existsSync(cssPath)) {
    console.error('❌ CSS file not found:', cssPath);
    return false;
  }

  try {
    // Try restore from backup first
    if (restoreFromBackup(cssPath)) {
      console.log('✅ CSS restored from backup');
      out('removeCssPatch restored from backup');
      const verify = fs.readFileSync(cssPath, 'utf-8');
      const hasMarker = verify.includes(CSS_START_MARKER);
      console.log('🔍 Verification - markers still present:', hasMarker);
      out('removeCssPatch verify hasMarker', String(hasMarker));
      // Remove legacy sibling backups to clear integrity warnings
      purgeSiblingBackups(cssPath);
      return !hasMarker;
    }

    const originalContent = fs.readFileSync(cssPath, 'utf-8');
    console.log('📖 Original content length:', originalContent.length);
    out('removeCssPatch original len', String(originalContent.length));

    const cleanedContent = stripPatchedCss(originalContent);
    console.log('🧹 Cleaned content length:', cleanedContent.length);
    console.log('🔢 Removed characters:', originalContent.length - cleanedContent.length);
    out('removeCssPatch cleaned len', String(cleanedContent.length));

    if (originalContent.length === cleanedContent.length) {
      console.log('⚠️ No patches found to remove');
      return true; // Nothing to remove is still success
    }

    // Write atomically and flush
    try {
      const fd = fs.openSync(cssPath, 'w');
      fs.writeFileSync(fd, cleanedContent, 'utf-8');
      try { fs.fsyncSync(fd); } catch {}
      fs.closeSync(fd);
    } catch (e) {
      fs.writeFileSync(cssPath, cleanedContent, 'utf-8');
    }
    console.log('✅ CSS file cleaned successfully');
    out('removeCssPatch cleaned OK');

    // Verify removal
    const verifyContent = fs.readFileSync(cssPath, 'utf-8');
    const hasMarker = verifyContent.includes(CSS_START_MARKER);
    console.log('🔍 Verification - markers still present:', hasMarker);
    out('removeCssPatch verify hasMarker', String(hasMarker));

    // Remove legacy sibling backups to clear integrity warnings
    purgeSiblingBackups(cssPath);
    return !hasMarker; // Success if NO markers found
  } catch (error: any) {
    console.error('❌ Error during removal:', error.message);
    return false;
  }
}

/**
 * Restore target file from latest valid backup created by this extension
 */
  function restoreFromBackup(targetPath: string): boolean {
    try {
      const dir = path.dirname(targetPath);
      const base = path.basename(targetPath);
      const prefix = base + '.background-image-backup-';
      const candidates = fs
        .readdirSync(dir)
        .filter(f => f.startsWith(prefix))
        .map(f => path.join(dir, f))
        .filter(p => {
          try { return fs.statSync(p).isFile(); } catch { return false; }
        })
        .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

      for (const backup of candidates) {
        try {
          const buf = fs.readFileSync(backup, 'utf-8');
          // Prefer backups without our markers
          if (buf.includes(CSS_START_MARKER) || buf.includes(JS_START_MARKER)) {
            continue;
          }
          fs.writeFileSync(targetPath, buf, 'utf-8');
          return true;
        } catch {}
      }

      // Fallback: external backup directory under user's home
      try {
        const extDir = getBackupDir();
        const prefix2 = base + '.background-image-backup-';
        const extCandidates = fs
          .readdirSync(extDir)
          .filter(f => f.startsWith(prefix2))
          .map(f => path.join(extDir, f))
          .filter(p => { try { return fs.statSync(p).isFile(); } catch { return false; } })
          .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
        for (const backup of extCandidates) {
          try {
            const buf = fs.readFileSync(backup, 'utf-8');
            if (buf.includes(CSS_START_MARKER) || buf.includes(JS_START_MARKER)) continue;
            fs.writeFileSync(targetPath, buf, 'utf-8');
            return true;
          } catch {}
        }
      } catch {}
    } catch (e) {
      out('restoreFromBackup error', (e as any)?.message || String(e));
    }
    return false;
  }

/**
 * Check if unsafe mode is currently enabled in config
 */
export function isUnsafeModeEnabled(): boolean {
  const config = vscode.workspace.getConfiguration('backgroundImage.unsafe');
  return config.get<boolean>('enabled', false);
}

/**
 * Get unsafe configuration options
 */
export function getUnsafeOptions(): UnsafePatchOptions {
  const config = vscode.workspace.getConfiguration('backgroundImage.unsafe');

  return {
    image: config.get<string>('image', ''),
    opacity: config.get<number>('opacity', 0.12),
    size: config.get<string>('size', 'cover'),
    position: config.get<string>('position', 'center'),
    repeat: config.get<string>('repeat', 'no-repeat'),
    embedImage: config.get<boolean>('embedImage', true)
  };
}
