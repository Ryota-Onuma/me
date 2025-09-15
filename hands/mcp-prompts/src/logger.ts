import { LogEntry } from './types.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private level: LogLevel;
  private verbose: boolean;

  constructor() {
    this.level = (process.env.LOG_LEVEL as LogLevel) || 'info';
    this.verbose = process.env.VERBOSE === 'true' || process.argv.includes('--verbose');
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.level);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex >= currentLevelIndex;
  }

  private formatLogEntry(
    level: LogLevel,
    event: string,
    message?: string,
    details?: Record<string, unknown>
  ): LogEntry {
    const entry: LogEntry = {
      level,
      ts: Date.now(),
      event,
    };

    if (message) {
      entry.message = message;
    }

    if (details) {
      // Sanitize details to avoid logging sensitive content
      entry.details = this.sanitizeDetails(details);
    }

    return entry;
  }

  private sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(details)) {
      // Avoid logging file contents or other potentially sensitive data
      if (key === 'content' || key === 'body' || key === 'template') {
        if (this.verbose) {
          // In verbose mode, log a truncated version
          sanitized[key] =
            typeof value === 'string'
              ? `${value.slice(0, 100)}${value.length > 100 ? '...' : ''}`
              : '[sanitized]';
        } else {
          sanitized[key] = '[sanitized]';
        }
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private output(entry: LogEntry): void {
    const output = entry.level === 'error' ? process.stderr : process.stderr;
    output.write(JSON.stringify(entry) + '\n');
  }

  public debug(event: string, details?: Record<string, unknown>): void {
    if (!this.shouldLog('debug')) {
      return;
    }
    this.output(this.formatLogEntry('debug', event, undefined, details));
  }

  public info(event: string, details?: Record<string, unknown>): void {
    if (!this.shouldLog('info')) {
      return;
    }
    this.output(this.formatLogEntry('info', event, undefined, details));
  }

  public warn(message: string, details?: Record<string, unknown>): void {
    if (!this.shouldLog('warn')) {
      return;
    }
    this.output(this.formatLogEntry('warn', 'warning', message, details));
  }

  public error(message: string, details?: Record<string, unknown>): void {
    if (!this.shouldLog('error')) {
      return;
    }
    this.output(this.formatLogEntry('error', 'error', message, details));
  }

  public setLevel(level: LogLevel): void {
    this.level = level;
  }

  public setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }

  // Specialized logging methods for common events
  public promptDiscovered(name: string, path: string): void {
    this.debug('prompt-discovered', { name, path });
  }

  public promptLoaded(name: string, duration: number): void {
    this.debug('prompt-loaded', { name, duration });
  }

  public promptRendered(name: string, argsCount: number): void {
    this.info('prompt-rendered', { name, argsCount });
  }

  public fileWatchEvent(event: string, path: string): void {
    this.debug('file-watch-event', { event, path });
  }

  public cacheHit(key: string): void {
    this.debug('cache-hit', { key });
  }

  public cacheMiss(key: string): void {
    this.debug('cache-miss', { key });
  }

  public mcpRequest(method: string, params?: Record<string, unknown>): void {
    this.debug('mcp-request', { method, params });
  }

  public mcpResponse(method: string, duration: number, success: boolean): void {
    this.info('mcp-response', { method, duration, success });
  }

  public serverStarted(port?: number, transport?: string): void {
    this.info('server-started', { port, transport: transport || 'stdio' });
  }

  public serverStopped(reason?: string): void {
    this.info('server-stopped', { reason });
  }

  public promptNotApplicable(name: string, client: string, targets: string[]): void {
    this.warn(`Prompt '${name}' not applicable for client '${client}'`, {
      name,
      client,
      allowedTargets: targets,
    });
  }

  public frontmatterParseError(path: string, error: string): void {
    this.error(`Failed to parse frontmatter in '${path}'`, { path, error });
  }

  public templateRenderError(name: string, error: string): void {
    this.error(`Failed to render template for '${name}'`, { name, error });
  }

  public performanceMetric(
    operation: string,
    duration: number,
    details?: Record<string, unknown>
  ): void {
    this.debug('performance-metric', { operation, duration, ...details });
  }
}

export const logger = new Logger();
