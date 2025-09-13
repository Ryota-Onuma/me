import * as vscode from 'vscode';
import { BackgroundConfig } from './configManager';
import { generateOverlayCss, generateOverlayInline, resolveImageSrc } from './utils/cssGenerator';

export class PreviewPanel {
  public static current: PreviewPanel | undefined;

  static createOrShow(context: vscode.ExtensionContext, config: BackgroundConfig) {
    if (PreviewPanel.current) {
      PreviewPanel.current.update(config);
      PreviewPanel.current.panel.reveal(vscode.ViewColumn.Active);
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      'backgroundImage.previewPanel',
      'Background Full Preview',
      { viewColumn: vscode.ViewColumn.Active, preserveFocus: false },
      ({
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [context.extensionUri],
      } as any)
    );
    PreviewPanel.current = new PreviewPanel(panel, context, config);
  }

  private constructor(
    public readonly panel: vscode.WebviewPanel,
    private readonly context: vscode.ExtensionContext,
    initialConfig: BackgroundConfig
  ) {
    this.panel.onDidDispose(() => (PreviewPanel.current = undefined));
    this.render(initialConfig);
  }

  update(config: BackgroundConfig) {
    this.render(config);
  }

  private render(config: BackgroundConfig) {
    const webview = this.panel.webview;
    const nonce = getNonce();
    const roots: vscode.Uri[] = [this.context.extensionUri];
    const addRoot = (p: string) => {
      if (p.startsWith('file://')) {
        try {
          const u = vscode.Uri.parse(p);
          roots.push(vscode.Uri.file(require('path').dirname(u.fsPath)));
        } catch {}
      }
    };
    addRoot(config.imagePath);
    if (config.slideshow?.images?.length) config.slideshow.images.forEach(addRoot);
    webview.options = { enableScripts: true, localResourceRoots: roots };

    const csp = [
      "default-src 'none'",
      `img-src ${webview.cspSource} file: data:`,
      "style-src 'unsafe-inline'",
      `script-src 'nonce-${nonce}'`,
      "connect-src 'none'",
      "frame-src 'none'",
    ].join('; ');

    const initialCss = generateOverlayCss(config, webview);
    const initialInline = generateOverlayInline(config, webview);
    const initialSrc = resolveImageSrc(config.imagePath, webview);
    const fit = config.size === 'contain' ? 'contain' : (config.size === 'auto' ? 'fill' : 'cover');
    const initialImgStyle = `object-fit:${fit};object-position:${config.position}`;
    const resolvedList = (config.slideshow?.images || []).map((s) => resolveImageSrc(s, webview)).filter(Boolean);
    const intervalMs = Math.max(3, Math.min(3600, config.slideshow?.interval ?? 30)) * 1000;
    const shuffle = !!config.slideshow?.shuffle;

    this.panel.webview.html = `<!DOCTYPE html>
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
    ${initialCss}
  </style>
</head>
<body>
  <div class="background-overlay" id="background-container" style="${initialInline}">
    <img id="bg-img" alt="" style="width:100%;height:100%;pointer-events:none;${initialImgStyle}" src="${initialSrc}" />
  </div>
  <script nonce="${nonce}">
    (function(){
      const imgs = ${JSON.stringify(resolvedList)};
      let idx = 0;
      const shuffle = ${JSON.stringify(shuffle)};
      const intervalMs = ${intervalMs};
      if (shuffle && imgs.length > 1) {
        for (let i = imgs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [imgs[i], imgs[j]] = [imgs[j], imgs[i]]; }
      }
      function applySrc(src){
        const el = document.getElementById('background-container');
        if (el && src) el.setAttribute('style', el.getAttribute('style') + ';background-image:url("'+src.replace(/"/g,'\\"')+'");');
        const img = document.getElementById('bg-img');
        if (img && src) img.setAttribute('src', src);
      }
      if (imgs.length > 0) {
        setInterval(() => { idx = (idx + 1) % imgs.length; applySrc(imgs[idx]); }, intervalMs);
      }
    })();
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
