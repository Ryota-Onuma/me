#!/usr/bin/env node

import * as path from 'path';
import * as os from 'os';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createServer } from './server.js';
import { logger } from './logger.js';

interface CliOptions {
  'strict-args': boolean;
  'flatten-paths': boolean;
  watch: boolean;
  'no-cache': boolean;
  verbose: boolean;
  'prompts-dir': string;
  version: boolean;
  help: boolean;
}

async function main(): Promise<void> {
  const argv = (await yargs(hideBin(process.argv))
    .scriptName('mcp-prompts')
    .usage('$0 <command> [options]')
    .command('serve', 'Start MCP server (default)', {}, async (args: any) => {
      await startMcpServer(args as CliOptions);
    })
    .command(
      'web',
      'Start web management UI',
      {
        port: {
          alias: 'p',
          type: 'number',
          default: 3000,
          description: 'Port for web UI',
        },
      },
      async (args: any) => {
        await startWebUI(args as CliOptions & { port: number });
      }
    )
    .option('strict-args', {
      type: 'boolean',
      default: false,
      description: 'Throw error on unresolved template placeholders',
    })
    .option('flatten-paths', {
      type: 'boolean',
      default: false,
      description: 'Convert subdirectory paths to prompt names (path/to/name.md → path__to__name)',
    })
    .option('watch', {
      alias: 'w',
      type: 'boolean',
      default: false,
      description: 'Enable file watching for hot reload',
    })
    .option('no-cache', {
      type: 'boolean',
      default: false,
      description: 'Disable content caching',
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      default: false,
      description: 'Enable verbose logging',
    })
    .option('prompts-dir', {
      alias: 'd',
      type: 'string',
      default: process.env.PROMPTS_DIR || path.join(os.homedir(), 'prompt-registry', 'commands'),
      description: 'Directory containing prompt files',
    })
    .demandCommand(1)
    .help()
    .version()
    .example('$0 serve', 'Start MCP server with default settings')
    .example(
      '$0 serve --watch',
      'Start server with file watching'
    )
    .example('$0 web --port 8080', 'Start web UI on port 8080')
    .epilog(
      'Environment Variables:\n  PROMPTS_DIR    Directory containing prompt files\n  LOG_LEVEL      Logging level (debug, info, warn, error)'
    )
    .parseAsync()) as unknown as CliOptions;

  // Set up logging based on options
  if (argv.verbose) {
    logger.setVerbose(true);
  }
}

async function startMcpServer(argv: CliOptions): Promise<void> {
  // Log startup information
  logger.info('mcp-prompts-starting', {
    version: process.env.npm_package_version || '1.0.0',
    promptsDir: argv['prompts-dir'],
    options: {
      strictArgs: argv['strict-args'],
      flattenPaths: argv['flatten-paths'],
      watch: argv.watch,
      cache: !argv['no-cache'],
      verbose: argv.verbose,
    },
  });

  // Validate prompts directory
  try {
    const fs = await import('fs');
    await fs.promises.access(argv['prompts-dir']);
  } catch (error) {
    logger.error('Prompts directory not accessible', {
      directory: argv['prompts-dir'],
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }

  try {
    // Create and start the MCP server
    const server = await createServer({
      promptsDir: argv['prompts-dir'],
      flattenPaths: argv['flatten-paths'],
      enableWatch: argv.watch,
      enableCache: !argv['no-cache'],
      strictArgs: argv['strict-args'],
    });

    // Start the server (this will block until the server is stopped)
    await server.start();
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

async function startWebUI(argv: CliOptions & { port: number }): Promise<void> {
  const { WebServer } = await import('./web/webServer.js');

  // Require prompts directory to be specified
  if (argv['prompts-dir'] === path.join(os.homedir(), 'prompt-registry', 'commands')) {
    logger.error('Prompts directory must be specified for web UI', {
      message: 'Please specify --prompts-dir or set PROMPTS_DIR environment variable',
      example: 'npm run dev:web -- --prompts-dir ./my-prompts'
    });
    process.exit(1);
  }

  // Validate prompts directory
  try {
    const fs = await import('fs');
    await fs.promises.access(argv['prompts-dir']);
  } catch (error) {
    logger.error('Prompts directory not accessible', {
      directory: argv['prompts-dir'],
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }

  try {
    const webServer = new WebServer(argv['prompts-dir'], argv.port);
    await webServer.start();
  } catch (error) {
    logger.error('Failed to start web server', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection', {
    reason: String(reason),
    promise: String(promise),
  });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Start the application
main().catch(error => {
  logger.error('Application startup failed', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exit(1);
});
