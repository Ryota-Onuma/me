import * as vscode from 'vscode';
import { BackgroundConfig, ConfigManager } from './configManager';
import { sanitizeImagePath } from './utils/pathSanitizer';
import { validateImageInput } from './utils/imageValidator';
import { BackgroundWebviewProvider } from './webviewProvider';

export interface BackgroundManager {
  setBackgroundImage(imagePath: string): Promise<boolean>;
  removeBackground(): Promise<void>;
  validateImagePath(p: string): boolean;
  generateSafeCSS(config: BackgroundConfig): string;
}

export class BackgroundManagerImpl implements BackgroundManager {
  constructor(
    private readonly cfg: ConfigManager,
    private readonly provider: BackgroundWebviewProvider
  ) {}

  async setBackgroundImage(imagePath: string): Promise<boolean> {
    const sanitized = sanitizeImagePath(imagePath) ?? imagePath; // allow data:
    const result = await validateImageInput(sanitized);
    if (!result.valid) {
      vscode.window.showErrorMessage(result.error);
      return false;
    }
    const cur = this.cfg.getConfig();
    const next: BackgroundConfig = this.cfg.sanitizeConfig({ ...cur, imagePath: sanitized });
    if (!this.cfg.validateConfig(next)) return false;
    await this.cfg.saveConfig(next);
    this.provider.update(next);
    return true;
  }

  async removeBackground(): Promise<void> {
    const cur = this.cfg.getConfig();
    const next: BackgroundConfig = this.cfg.sanitizeConfig({ ...cur, imagePath: '' });
    await this.cfg.saveConfig(next);
    this.provider.update(next);
  }

  validateImagePath(p: string): boolean {
    if (!p) return false;
    const ok = p.startsWith('data:') || !!sanitizeImagePath(p);
    return ok;
  }

  generateSafeCSS(config: BackgroundConfig): string {
    // Delegate to provider/webview; here we provide a minimal server-side fallback
    const url = config.imagePath ? config.imagePath : '';
    return [
      '.background-overlay{',
      url ? `background-image:url('${url}');` : '',
      `background-size:${config.size};`,
      `background-position:${config.position};`,
      'background-repeat:no-repeat;',
      `opacity:${config.opacity};`,
      '}',
    ].join('');
  }
}

