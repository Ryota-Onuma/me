import * as vscode from 'vscode';
import { BackgroundConfig } from '../configManager';

export function resolveImageSrc(imagePath: string, webview: vscode.Webview): string {
  if (!imagePath) return '';
  if (imagePath.startsWith('file://')) {
    const fileUri = vscode.Uri.parse(imagePath);
    return webview.asWebviewUri(fileUri).toString();
  }
  return imagePath; // data:
}

export function generateOverlayCss(config: BackgroundConfig, webview: vscode.Webview): string {
  const { imagePath, opacity, size, position } = config;
  const src = resolveImageSrc(imagePath, webview);
  const cssBg = src ? `background-image: url('${src}');` : '';
  return `
  .background-overlay { 
    ${cssBg}
    background-size: ${size};
    background-position: ${position};
    background-repeat: no-repeat;
    opacity: ${opacity};
    z-index: 999999;
  }
  `;
}

export function generateOverlayInline(config: BackgroundConfig, webview: vscode.Webview): string {
  const { opacity, size, position } = config;
  const src = resolveImageSrc(config.imagePath, webview);
  const parts = [
    src ? `background-image:url('${src}')` : '',
    `background-size:${size}`,
    `background-position:${position}`,
    'background-repeat:no-repeat',
    `opacity:${opacity}`,
    'z-index:999999',
  ].filter(Boolean);
  return parts.join(';');
}
