import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as chokidar from 'chokidar';
import fastGlob from 'fast-glob';
const { glob } = fastGlob;
import {
  PromptMeta,
  PromptFileInfo,
  PromptStoreOptions,
  RenderOptions,
  SearchFilter,
  PromptCache,
  PromptResult,
} from './types.js';
import {
  parseFrontmatter,
  extractPromptMeta,
  validateFrontmatter,
} from './frontmatter.js';
import { renderTemplate } from './templating.js';
import {
  validatePathSecurity,
  handlePromptError,
  createError,
} from './errors.js';
import { logger } from './logger.js';

export class PromptStore {
  private root: string;
  private options: PromptStoreOptions;
  private cache: PromptCache;
  private watcher?: chokidar.FSWatcher | undefined;
  private initialized: boolean = false;

  constructor(root: string, options: PromptStoreOptions = {}) {
    this.root = path.resolve(root);
    this.options = {
      flattenPaths: false,
      enableCache: true,
      enableWatch: false,
      ...options,
    };
    this.cache = {
      files: new Map(),
      contents: new Map(),
      lastScan: 0,
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const startTime = Date.now();

    try {
      // Verify root directory exists and is accessible
      await fs.access(this.root);
      await this.scanPrompts();

      if (this.options.enableWatch) {
        await this.setupFileWatcher();
      }

      this.initialized = true;
      logger.performanceMetric('prompt-store-init', Date.now() - startTime, {
        promptCount: this.cache.files.size,
        watchEnabled: this.options.enableWatch,
      });
    } catch (error) {
      throw handlePromptError(error, 'prompt-store-initialization');
    }
  }

  async list(filter?: SearchFilter): Promise<PromptMeta[]> {
    await this.ensureInitialized();

    const startTime = Date.now();
    const metas: PromptMeta[] = [];
    const seenPaths = new Set<string>();

    for (const fileInfo of this.cache.files.values()) {
      if (seenPaths.has(fileInfo.absolutePath)) {
        continue;
      }

      if (filter?.query) {
        const query = filter.query.toLowerCase();
        const matchesName = fileInfo.name.toLowerCase().includes(query);
        const matchesPath = fileInfo.relativePath.toLowerCase().includes(query);
        const matchesTags = fileInfo.meta.tags?.some(tag => tag.toLowerCase().includes(query));

        if (!matchesName && !matchesPath && !matchesTags) {
          continue;
        }
      }

      if (filter?.tags && filter.tags.length > 0) {
        const hasRequiredTags = filter.tags.every(requiredTag =>
          fileInfo.meta.tags?.includes(requiredTag)
        );
        if (!hasRequiredTags) {
          continue;
        }
      }

      seenPaths.add(fileInfo.absolutePath);
      metas.push(fileInfo.meta);
    }

    logger.performanceMetric('prompt-list', Date.now() - startTime, {
      totalPrompts: this.cache.files.size,
      filteredPrompts: metas.length,
      hasFilter: !!filter,
    });

    return metas;
  }

  async render(name: string, options: RenderOptions = {}): Promise<PromptResult> {
    await this.ensureInitialized();

    const startTime = Date.now();

    try {
      const fileInfo = this.findPrompt(name);
      if (!fileInfo) {
        throw createError('NotFound', `Prompt '${name}' not found`);
      }

      const content = await this.loadContent(fileInfo.absolutePath);

      const renderedContent = renderTemplate(
        content,
        options.positionalArgs || [],
        options.namedArgs || {},
        options.strict || false
      );

      const result = {
        messages: [
          {
            role: 'user' as const,
            content: renderedContent,
          },
        ],
      };

      logger.promptRendered(
        name,
        (options.positionalArgs?.length || 0) + Object.keys(options.namedArgs || {}).length
      );
      logger.performanceMetric('prompt-render', Date.now() - startTime, {
        name,
        contentLength: renderedContent.length,
      });

      return result;
    } catch (error) {
      logger.templateRenderError(name, error instanceof Error ? error.message : String(error));
      throw handlePromptError(error, `prompt-render-${name}`);
    }
  }

  async scanPrompts(): Promise<void> {
    const startTime = Date.now();

    try {
      const pattern = path.join(this.root, '**/*.md');
      const files = await glob(pattern, {
        absolute: true,
        onlyFiles: true,
      });

      const newCache: PromptCache = {
        files: new Map(),
        contents: new Map(),
        lastScan: Date.now(),
      };

      for (const filePath of files) {
        try {
          const fileInfo = await this.processPromptFile(filePath);
          if (fileInfo) {
            newCache.files.set(fileInfo.name, fileInfo);
            logger.promptDiscovered(fileInfo.name, fileInfo.relativePath);
          }
        } catch (error) {
          logger.error(`Failed to process prompt file: ${filePath}`, {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      if (this.options.enableCache) {
        for (const [key, content] of this.cache.contents.entries()) {
          if (newCache.files.has(key)) {
            newCache.contents.set(key, content);
          }
        }
      }

      this.cache = newCache;

      logger.performanceMetric('prompt-scan', Date.now() - startTime, {
        filesProcessed: files.length,
        promptsFound: this.cache.files.size,
      });
    } catch (error) {
      throw handlePromptError(error, 'prompt-scan');
    }
  }

  private async processPromptFile(filePath: string): Promise<PromptFileInfo | null> {
    try {
      // Security check
      validatePathSecurity(filePath, this.root);

      const stats = await fs.stat(filePath);
      const relativePath = path.relative(this.root, filePath);

      // Generate prompt name
      const promptName = this.generatePromptName(relativePath);

      // Read and parse frontmatter
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = parseFrontmatter(content, filePath);

      // Validate frontmatter if present
      if (parsed.frontmatter) {
        validateFrontmatter(parsed.frontmatter);
      }

      // Extract metadata
      const meta = extractPromptMeta(parsed.frontmatter, promptName, relativePath);

      // Calculate content hash for cache invalidation
      const contentHash = crypto.createHash('sha256').update(content).digest('hex');

      return {
        name: promptName,
        relativePath,
        absolutePath: filePath,
        meta,
        frontmatter: parsed.frontmatter,
        lastModified: stats.mtime.getTime(),
        contentHash,
      };
    } catch (error) {
      throw handlePromptError(error, `process-file-${filePath}`);
    }
  }

  private generatePromptName(relativePath: string): string {
    const parsed = path.parse(relativePath);
    const nameWithoutExt = parsed.name;

    let promptName: string;
    if (this.options.flattenPaths) {
      // Convert path separators to double underscores
      const dir = parsed.dir;
      if (dir) {
        promptName = dir.replace(/[/\\]/g, '__') + '__' + nameWithoutExt;
      } else {
        promptName = nameWithoutExt;
      }
    } else {
      promptName = nameWithoutExt;
    }

    // Normalize prompt name for MCP slash command compatibility
    // Convert to lowercase and replace non-alphanumeric characters with underscores
    return this.normalizePromptName(promptName);
  }

  private normalizePromptName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private findPrompt(name: string): PromptFileInfo | null {
    return this.cache.files.get(name) || null;
  }

  private async loadContent(filePath: string): Promise<string> {
    const cacheKey = filePath;

    if (this.options.enableCache && this.cache.contents.has(cacheKey)) {
      logger.cacheHit(cacheKey);
      return this.cache.contents.get(cacheKey)!;
    }

    logger.cacheMiss(cacheKey);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = parseFrontmatter(content, filePath);

      if (this.options.enableCache) {
        this.cache.contents.set(cacheKey, parsed.content);
      }

      return parsed.content;
    } catch (error) {
      throw handlePromptError(error, `load-content-${filePath}`);
    }
  }

  private async setupFileWatcher(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
    }

    this.watcher = chokidar.watch(path.join(this.root, '**/*.md'), {
      ignoreInitial: true,
      persistent: true,
      followSymlinks: false,
    });

    this.watcher.on('add', async filePath => {
      logger.fileWatchEvent('add', filePath);
      await this.handleFileChange(filePath, 'add');
    });

    this.watcher.on('change', async filePath => {
      logger.fileWatchEvent('change', filePath);
      await this.handleFileChange(filePath, 'change');
    });

    this.watcher.on('unlink', async filePath => {
      logger.fileWatchEvent('unlink', filePath);
      await this.handleFileChange(filePath, 'unlink');
    });

    this.watcher.on('error', error => {
      logger.error('File watcher error', { error: error.message });
    });
  }

  private async handleFileChange(
    filePath: string,
    event: 'add' | 'change' | 'unlink'
  ): Promise<void> {
    try {
      if (event === 'unlink') {
        // Remove from cache
        const relativePath = path.relative(this.root, filePath);
        const promptName = this.generatePromptName(relativePath);
        this.cache.files.delete(promptName);
        this.cache.contents.delete(filePath);
      } else {
        // Add or update
        const fileInfo = await this.processPromptFile(filePath);
        if (fileInfo) {
          this.cache.files.set(fileInfo.name, fileInfo);
          // Invalidate content cache
          this.cache.contents.delete(filePath);
        }
      }
    } catch (error) {
      logger.error(`Failed to handle file change: ${filePath}`, {
        event,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  async dispose(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = undefined;
    }

    this.cache.files.clear();
    this.cache.contents.clear();
    this.initialized = false;

    logger.info('prompt-store-disposed');
  }

  // Utility methods for debugging and monitoring

  getStats(): {
    promptCount: number;
    cacheSize: number;
    lastScan: number;
    watcherActive: boolean;
  } {
    return {
      promptCount: this.cache.files.size,
      cacheSize: this.cache.contents.size,
      lastScan: this.cache.lastScan,
      watcherActive: !!this.watcher,
    };
  }

  async clearCache(): Promise<void> {
    this.cache.contents.clear();
    logger.info('prompt-cache-cleared');
  }
}
