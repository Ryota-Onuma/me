import * as vscode from 'vscode';
import { BackgroundConfig } from './configManager';
import { generateOverlayCss, generateOverlayInline, resolveImageSrc } from './utils/cssGenerator';

export class BackgroundWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'backgroundImage.view';
  private view?: vscode.WebviewView;
  private lastConfig?: BackgroundConfig;
  private initialConfig?: BackgroundConfig;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    this.view = webviewView;
    const webview = webviewView.webview;
    webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    const nonce = getNonce();
    const csp = [
      "default-src 'none'",
      `img-src ${webview.cspSource} file: data:`,
      "style-src 'unsafe-inline'",
      `script-src 'nonce-${nonce}'`,
      "connect-src 'none'",
      "frame-src 'none'"
    ].join('; ');

    const initial = this.lastConfig ?? this.initialConfig;
    const initialCss = initial ? generateOverlayCss(initial, webview) : '';
    const initialInline = initial ? generateOverlayInline(initial, webview) : '';
    webview.html = this.getHtml(webview, csp, nonce, initialCss, initialInline);

    webview.onDidReceiveMessage((msg) => {
      if (msg && msg.type === 'ready') {
        // 初期化時に最後の設定を適用
        if (this.lastConfig) {
          this.pushCss(this.lastConfig);
        }
      }
    });

    // View生成直後にも最後の設定を適用
    if (this.lastConfig) {
      this.pushCss(this.lastConfig);
    }
  }

  update(config: BackgroundConfig): void {
    this.lastConfig = config;
    if (!this.view) return;
    this.pushCss(config);
  }

  setInitialConfig(config: BackgroundConfig) {
    this.initialConfig = config;
  }

  private pushCss(config: BackgroundConfig) {
    if (!this.view) return;
    const webview = this.view.webview;
    // file:// の場合はディレクトリを localResourceRoots に追加
    const roots: vscode.Uri[] = [this.context.extensionUri];
    if (config.imagePath?.startsWith('file://')) {
      try {
        const fileUri = vscode.Uri.parse(config.imagePath);
        const dir = vscode.Uri.file(require('path').dirname(fileUri.fsPath));
        roots.push(dir);
      } catch {
        // ignore
      }
    }
    if (config.slideshow?.images?.length) {
      for (const s of config.slideshow.images) {
        if (s.startsWith('file://')) {
          try {
            const u = vscode.Uri.parse(s);
            roots.push(vscode.Uri.file(require('path').dirname(u.fsPath)));
          } catch {}
        }
      }
    }
    webview.options = { enableScripts: true, localResourceRoots: roots };
    const css = generateOverlayCss(config, webview);
    const inline = generateOverlayInline(config, webview);
    const src = resolveImageSrc(config.imagePath, webview);
    const imgStyle = `object-fit:${config.size === 'contain' ? 'contain' : (config.size === 'auto' ? 'fill' : 'cover')};object-position:${config.position}`;
    const list = (config.slideshow?.images || []).map((s) => resolveImageSrc(s, webview)).filter(Boolean);
    const intervalMs = Math.max(3, Math.min(3600, config.slideshow?.interval ?? 30)) * 1000;
    const shuffle = !!config.slideshow?.shuffle;
    const slideshow = config.slideshow?.enabled ? { images: list, intervalMs, shuffle } : undefined;
    webview.postMessage({ type: 'apply-css', css, inline, src, imgStyle, slideshow });
  }

  private getHtml(webview: vscode.Webview, csp: string, nonce: string, initialCss = '', initialInline = ''): string {
    const initialSrc = this.lastConfig ? resolveImageSrc(this.lastConfig.imagePath, webview) : (this.initialConfig ? resolveImageSrc(this.initialConfig.imagePath, webview) : '');
    const initialImgStyle = (() => {
      const cfg = this.lastConfig ?? this.initialConfig;
      if (!cfg) return '';
      const fit = cfg.size === 'contain' ? 'contain' : (cfg.size === 'auto' ? 'fill' : 'cover');
      return `object-fit:${fit};object-position:${cfg.position}`;
    })();
    return `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta charset="UTF-8" />
  <style nonce="${nonce}">
    html, body { height: 100%; margin: 0; }
    body { background: transparent; }
    .background-overlay {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      pointer-events: none; z-index: 999999;
      background-color: transparent;
    }
    .panel { padding: 8px; font-family: var(--vscode-font-family); font-size: 12px; }
    .hint { color: var(--vscode-descriptionForeground); }
    ${initialCss}
  </style>
</head>
<body>
  <div class="panel">
    <div class="hint">This webview previews the background safely (sandboxed).</div>
  </div>
  <div class="background-overlay" id="background-container" style="${initialInline}">
    <img id="bg-img" alt="" style="width:100%;height:100%;object-fit:cover;object-position:center;pointer-events:none;" src="${initialSrc}" />
  </div>
  <script nonce="${nonce}">
    const vscodeApi = acquireVsCodeApi();
    let slideTimer = null;
    function applySrc(src){
      const el = document.getElementById('background-container');
      if (el && src) el.setAttribute('style', (el.getAttribute('style')||'') + ';background-image:url("'+src.replace(/"/g,'\\"')+'");');
      const img = document.getElementById('bg-img');
      if (img && src) img.setAttribute('src', src);
    }
    window.addEventListener('message', (event) => {
      const msg = event.data; if (!msg) return;
      if (msg.type === 'apply-css') {
        const styleId = 'sb-css';
        let styleEl = document.getElementById(styleId);
        if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = styleId; document.head.appendChild(styleEl); }
        styleEl.textContent = msg.css || '';
        const el = document.getElementById('background-container');
        if (el && msg.inline) {
          el.setAttribute('style', msg.inline);
        }
        const img = document.getElementById('bg-img');
        if (img) {
          if (msg.src) img.setAttribute('src', msg.src);
          if (msg.imgStyle) img.setAttribute('style', 'width:100%;height:100%;pointer-events:none;' + msg.imgStyle);
        }
        if (slideTimer) { clearInterval(slideTimer); slideTimer = null; }
        if (msg.slideshow && Array.isArray(msg.slideshow.images) && msg.slideshow.images.length > 0) {
          let { images, intervalMs, shuffle } = msg.slideshow;
          if (shuffle && images.length > 1) {
            for (let i = images.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [images[i], images[j]] = [images[j], images[i]]; }
          }
          let idx = 0;
          slideTimer = setInterval(() => { idx = (idx + 1) % images.length; applySrc(images[idx]); }, intervalMs);
        }
      }
    });
    vscodeApi.postMessage({ type: 'ready' });
  </script>
</body>
</html>`;
  }
}

function getNonce() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 32; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}
