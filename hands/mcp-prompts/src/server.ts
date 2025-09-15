import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as path from 'path';
import * as os from 'os';
import { PromptStore } from './promptStore.js';
import { handlePromptError } from './errors.js';
import { logger } from './logger.js';

export interface ServerOptions {
  promptsDir: string;
  flattenPaths: boolean;
  enableWatch: boolean;
  enableCache: boolean;
  strictArgs: boolean;
}

export class McpPromptsServer {
  private server: Server;
  private store: PromptStore;
  private options: ServerOptions;

  constructor(options: ServerOptions) {
    this.options = options;
    this.server = new Server(
      {
        name: 'mcp-prompts',
        version: '1.0.0',
      },
      {
        capabilities: {
          prompts: {},
          resources: {},
        },
      }
    );

    this.store = new PromptStore(options.promptsDir, {
      flattenPaths: options.flattenPaths,
      enableCache: options.enableCache,
      enableWatch: options.enableWatch,
    });

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListPromptsRequestSchema, async request => {
      const startTime = Date.now();

      try {
        logger.mcpRequest(
          'list_prompts',
          request.params
            ? { query: typeof request.params.query === 'string' ? request.params.query : undefined }
            : undefined
        );

        const metas = await this.store.list({
          query: request.params?.query ? String(request.params.query) : undefined,
        });

        const prompts = metas.map(meta => ({
          name: meta.name,
          description: meta.description,
          arguments: [],
        }));

        logger.mcpResponse('list_prompts', Date.now() - startTime, true);

        return {
          prompts,
        };
      } catch (error) {
        logger.mcpResponse('list_prompts', Date.now() - startTime, false);
        throw this.handleMcpError(error);
      }
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async request => {
      const startTime = Date.now();

      try {
        logger.mcpRequest('get_prompt', {
          name: request.params.name,
          hasArguments: !!request.params.arguments,
        });

        const { name, arguments: args } = request.params;
        const promptName = typeof name === 'string' ? name : String(name);

        const positionalArgs: string[] = [];
        const namedArgs: Record<string, string> = {};

        if (args) {
          for (const [key, value] of Object.entries(args)) {
            const numKey = parseInt(key);
            if (!isNaN(numKey) && numKey > 0) {
              positionalArgs[numKey - 1] = String(value);
            } else {
              namedArgs[key] = String(value);
            }
          }
        }

        const result = await this.store.render(promptName, {
          positionalArgs,
          namedArgs,
          strict: this.options.strictArgs,
        });

        logger.mcpResponse('get_prompt', Date.now() - startTime, true);

        return {
          messages: result.messages.map(msg => ({
            role: msg.role,
            content: {
              type: 'text',
              text: msg.content,
            },
          })),
        };
      } catch (error) {
        logger.mcpResponse('get_prompt', Date.now() - startTime, false);
        throw this.handleMcpError(error);
      }
    });

    this.server.setRequestHandler(ListResourcesRequestSchema, async request => {
      const startTime = Date.now();

      try {
        logger.mcpRequest('list_resources', request.params);

        const metas = await this.store.list();

        const resources = metas.map(meta => ({
          uri: `prompt://${meta.name}`,
          name: meta.name,
          description: meta.description,
          mimeType: 'text/plain',
        }));

        logger.mcpResponse('list_resources', Date.now() - startTime, true);

        return {
          resources,
        };
      } catch (error) {
        logger.mcpResponse('list_resources', Date.now() - startTime, false);
        throw this.handleMcpError(error);
      }
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async request => {
      const startTime = Date.now();

      try {
        logger.mcpRequest('read_resource', { uri: request.params.uri });

        const { uri } = request.params;

        if (!uri.startsWith('prompt://')) {
          throw new Error(`Invalid resource URI: ${uri}. Expected format: prompt://name`);
        }
        
        const promptName = uri.replace('prompt://', '');
        
        const result = await this.store.render(promptName, {
          positionalArgs: [],
          namedArgs: {},
          strict: false,
        });

        const content = result.messages.map(msg => msg.content).join('\n\n');

        logger.mcpResponse('read_resource', Date.now() - startTime, true);

        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: content,
            },
          ],
        };
      } catch (error) {
        logger.mcpResponse('read_resource', Date.now() - startTime, false);
        throw this.handleMcpError(error);
      }
    });
  }


  private handleMcpError(error: unknown): Error {
    const promptsError = handlePromptError(error, 'mcp-handler');

    switch (promptsError.code) {
      case 'NotFound':
        return new Error(`Prompt not found: ${promptsError.message}`);
      case 'InvalidRequest':
      case 'InvalidArguments':
        return new Error(`Invalid request: ${promptsError.message}`);
      case 'Forbidden':
        return new Error(`Access denied: ${promptsError.message}`);
      case 'InvalidPromptFormat':
        return new Error(`Invalid prompt format: ${promptsError.message}`);
      case 'InternalError':
      default:
        return new Error(`Internal server error: ${promptsError.message}`);
    }
  }

  async start(): Promise<void> {
    try {
      // Initialize the prompt store
      await this.store.initialize();

      // Create stdio transport
      const transport = new StdioServerTransport();

      // Connect server to transport
      await this.server.connect(transport);

      logger.serverStarted(undefined, 'stdio');

      // Setup graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start MCP server', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.serverStopped(signal);

      try {
        // Dispose of the store (closes file watchers, clears cache)
        await this.store.dispose();

        // Close the server
        await this.server.close();

        // Flush streams
        if (process.stdout.writable) {
          process.stdout.end();
        }
        if (process.stderr.writable) {
          process.stderr.end();
        }

        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', {
          error: error instanceof Error ? error.message : String(error),
        });
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Handle uncaught exceptions
    process.on('uncaughtException', error => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', reason => {
      logger.error('Unhandled rejection', { reason: String(reason) });
      shutdown('unhandledRejection');
    });
  }

  async getStats(): Promise<any> {
    return {
      server: {
        name: 'mcp-prompts',
        version: '1.0.0',
      },
      store: this.store.getStats(),
      options: this.options,
    };
  }
}

export async function createServer(
  options: Partial<ServerOptions> = {}
): Promise<McpPromptsServer> {
  const defaultOptions: ServerOptions = {
    promptsDir: process.env.PROMPTS_DIR || path.join(os.homedir(), 'prompt-registry', 'commands'),
    flattenPaths: process.argv.includes('--flatten-paths'),
    enableWatch: process.argv.includes('--watch'),
    enableCache: !process.argv.includes('--no-cache'),
    strictArgs: process.argv.includes('--strict-args'),
  };

  const finalOptions = { ...defaultOptions, ...options };

  return new McpPromptsServer(finalOptions);
}
