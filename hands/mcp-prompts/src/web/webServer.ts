import { createServer, IncomingMessage, ServerResponse } from 'http';
import { promises as fs } from 'fs';
import { join, dirname, extname, relative } from 'path';
import { parse } from 'url';
import matter from 'gray-matter';
import fastGlob from 'fast-glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface PromptData {
  name: string;
  content: string;
  frontmatter: Record<string, unknown>;
  path: string;
}

export class WebServer {
  private promptsDir: string;
  private port: number;

  constructor(promptsDir: string, port = 3000) {
    this.promptsDir = promptsDir;
    this.port = port;
  }

  async start(): Promise<void> {
    const server = createServer(this.handleRequest.bind(this));
    return new Promise(resolve => {
      server.listen(this.port, () => {
        console.log(`Web UI available at http://localhost:${this.port}`);
        resolve();
      });
    });
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const { pathname } = parse(req.url || '', true);

      if (pathname?.startsWith('/api/')) {
        await this.handleApiRequest(req, res, pathname);
      } else {
        await this.handleStaticRequest(req, res, pathname || '/');
      }
    } catch (error) {
      this.sendError(res, 500, error instanceof Error ? error.message : 'Internal server error');
    }
  }

  private async handleApiRequest(
    req: IncomingMessage,
    res: ServerResponse,
    pathname: string
  ): Promise<void> {
    const method = req.method || 'GET';
    const parts = pathname.split('/').filter(Boolean);

    if (parts[1] === 'prompts') {
      const name = parts[2];

      switch (method) {
        case 'GET':
          if (name) {
            await this.getPrompt(res, name);
          } else {
            await this.listPrompts(res);
          }
          break;
        case 'POST':
          await this.createPrompt(req, res);
          break;
        case 'PUT':
          if (name) {
            await this.updatePrompt(req, res, name);
          } else {
            this.sendError(res, 400, 'Prompt name required');
          }
          break;
        case 'DELETE':
          if (name) {
            await this.deletePrompt(res, name);
          } else {
            this.sendError(res, 400, 'Prompt name required');
          }
          break;
        default:
          this.sendError(res, 405, 'Method not allowed');
      }
    } else {
      this.sendError(res, 404, 'API endpoint not found');
    }
  }

  private async handleStaticRequest(
    req: IncomingMessage,
    res: ServerResponse,
    pathname: string
  ): Promise<void> {
    const staticDir = join(__dirname, 'static');

    if (pathname === '/') {
      pathname = '/index.html';
    }

    const filePath = join(staticDir, pathname);
    const ext = extname(filePath);

    try {
      const content = await fs.readFile(filePath);
      const mimeTypes: Record<string, string> = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
      };

      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
      res.end(content);
    } catch {
      this.sendError(res, 404, 'File not found');
    }
  }

  private async listPrompts(res: ServerResponse): Promise<void> {
    const patterns = [join(this.promptsDir, '**/*.md'), join(this.promptsDir, '*.md')];

    const files = await fastGlob(patterns);
    const prompts: PromptData[] = [];

    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = matter(content);
        const name = relative(this.promptsDir, filePath).replace(/\.md$/, '');

        prompts.push({
          name,
          content: parsed.content,
          frontmatter: parsed.data,
          path: filePath,
        });
      } catch {
        continue;
      }
    }

    this.sendJson(res, prompts);
  }

  private async getPrompt(res: ServerResponse, name: string): Promise<void> {
    const filePath = join(this.promptsDir, `${name}.md`);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = matter(content);

      const prompt: PromptData = {
        name,
        content: parsed.content,
        frontmatter: parsed.data,
        path: filePath,
      };

      this.sendJson(res, prompt);
    } catch {
      this.sendError(res, 404, 'Prompt not found');
    }
  }

  private async createPrompt(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const body = await this.getRequestBody(req);
    const { name, content, frontmatter } = JSON.parse(body) as {
      name: string;
      content: string;
      frontmatter?: Record<string, unknown>;
    };

    if (!name || !content) {
      this.sendError(res, 400, 'Name and content are required');
      return;
    }

    const filePath = join(this.promptsDir, `${name}.md`);

    try {
      await fs.access(filePath);
      this.sendError(res, 409, 'Prompt already exists');
      return;
    } catch {
      // File doesn't exist, continue with creation
    }

    const fileContent = matter.stringify(content, frontmatter || {});
    await fs.mkdir(dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, fileContent);

    this.sendJson(res, { message: 'Prompt created successfully' });
  }

  private async updatePrompt(
    req: IncomingMessage,
    res: ServerResponse,
    name: string
  ): Promise<void> {
    const body = await this.getRequestBody(req);
    const { content, frontmatter } = JSON.parse(body) as {
      content: string;
      frontmatter?: Record<string, unknown>;
    };

    if (!content) {
      this.sendError(res, 400, 'Content is required');
      return;
    }

    const filePath = join(this.promptsDir, `${name}.md`);

    try {
      await fs.access(filePath);
    } catch {
      this.sendError(res, 404, 'Prompt not found');
      return;
    }

    const fileContent = matter.stringify(content, frontmatter || {});
    await fs.writeFile(filePath, fileContent);

    this.sendJson(res, { message: 'Prompt updated successfully' });
  }

  private async deletePrompt(res: ServerResponse, name: string): Promise<void> {
    const filePath = join(this.promptsDir, `${name}.md`);

    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      this.sendJson(res, { message: 'Prompt deleted successfully' });
    } catch {
      this.sendError(res, 404, 'Prompt not found');
    }
  }

  private async getRequestBody(req: IncomingMessage): Promise<string> {
    return new Promise(resolve => {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        resolve(body);
      });
    });
  }

  private sendJson(res: ServerResponse, data: unknown): void {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end(JSON.stringify(data));
  }

  private sendError(res: ServerResponse, statusCode: number, message: string): void {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({ error: message }));
  }
}
