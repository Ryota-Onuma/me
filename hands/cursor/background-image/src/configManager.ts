import * as vscode from 'vscode';

export interface BackgroundConfig {
  imagePath: string;
  opacity: number;
  size: 'cover' | 'contain' | 'auto';
  position: string;
  slideshow?: {
    enabled: boolean;
    images: string[];
    interval: number; // seconds
    shuffle: boolean;
  };
}

export class ConfigManager {
  private readonly section = 'backgroundImage';

  getConfig(): BackgroundConfig {
    const cfg = vscode.workspace.getConfiguration(this.section);
    return {
      imagePath: String(cfg.get('imagePath') || ''),
      opacity: Number(cfg.get('opacity', 0.1)),
      size: (cfg.get('size', 'cover') as BackgroundConfig['size']),
      position: String(cfg.get('position', 'center')),
      slideshow: {
        enabled: Boolean(cfg.get('slideshow.enabled', false)),
        images: (cfg.get('slideshow.images', []) as string[]),
        interval: Number(cfg.get('slideshow.interval', 30)),
        shuffle: Boolean(cfg.get('slideshow.shuffle', false)),
      },
    };
  }

  validateConfig(config: BackgroundConfig): boolean {
    if (typeof config.opacity !== 'number' || config.opacity < 0 || config.opacity > 0.8) return false;
    if (!['cover', 'contain', 'auto'].includes(config.size)) return false;
    if (typeof config.position !== 'string') return false;
    if (config.imagePath && !(config.imagePath.startsWith('file://') || config.imagePath.startsWith('data:'))) return false;
    if (config.slideshow) {
      const { interval, images } = config.slideshow;
      if (!Array.isArray(images)) return false;
      if (typeof interval !== 'number' || interval < 3 || interval > 3600) return false;
      for (const s of images) {
        if (!(typeof s === 'string' && (s.startsWith('file://') || s.startsWith('data:')))) return false;
      }
    }
    return true;
  }

  sanitizeConfig(config: BackgroundConfig): BackgroundConfig {
    const opacity = Math.max(0, Math.min(0.8, Number(config.opacity || 0)));
    const size = (['cover', 'contain', 'auto'] as const).includes(config.size) ? config.size : 'cover';
    const position = (config.position || 'center').toString();
    const imagePath = (config.imagePath || '').toString();
    let slideshow = config.slideshow;
    if (slideshow) {
      const images = (Array.isArray(slideshow.images) ? slideshow.images : []).filter(
        (s) => typeof s === 'string' && (s.startsWith('file://') || s.startsWith('data:'))
      );
      const interval = Math.max(3, Math.min(3600, Number(slideshow.interval || 30)));
      slideshow = { enabled: !!slideshow.enabled, images, interval, shuffle: !!slideshow.shuffle };
    }
    return { imagePath, opacity, size, position, slideshow };
  }

  async saveConfig(config: BackgroundConfig): Promise<void> {
    const cfg = vscode.workspace.getConfiguration(this.section);
    await Promise.all([
      cfg.update('imagePath', config.imagePath, vscode.ConfigurationTarget.Global),
      cfg.update('opacity', config.opacity, vscode.ConfigurationTarget.Global),
      cfg.update('size', config.size, vscode.ConfigurationTarget.Global),
      cfg.update('position', config.position, vscode.ConfigurationTarget.Global),
      cfg.update('slideshow.enabled', config.slideshow?.enabled ?? false, vscode.ConfigurationTarget.Global),
      cfg.update('slideshow.images', config.slideshow?.images ?? [], vscode.ConfigurationTarget.Global),
      cfg.update('slideshow.interval', config.slideshow?.interval ?? 30, vscode.ConfigurationTarget.Global),
      cfg.update('slideshow.shuffle', config.slideshow?.shuffle ?? false, vscode.ConfigurationTarget.Global),
    ]);
  }
}
