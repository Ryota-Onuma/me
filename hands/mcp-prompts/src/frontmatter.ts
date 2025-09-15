import matter from 'gray-matter';
import yaml from 'js-yaml';
import { Frontmatter, PromptMeta } from './types.js';
import { createFrontmatterError } from './errors.js';
import { logger } from './logger.js';

export interface ParsedPrompt {
  content: string;
  frontmatter: Frontmatter | null;
  originalContent: string;
  hasFrontmatter: boolean;
}

export function parseFrontmatter(content: string, filePath: string): ParsedPrompt {
  try {
    // Remove BOM if present
    const cleanContent = content.replace(/^\uFEFF/, '');

    const result = matter(cleanContent);

    const frontmatter: Frontmatter | null =
      result.data && Object.keys(result.data).length > 0 ? (result.data as Frontmatter) : null;

    return {
      content: result.content,
      frontmatter,
      originalContent: cleanContent,
      hasFrontmatter: !!frontmatter,
    };
  } catch (error) {
    logger.frontmatterParseError(filePath, error instanceof Error ? error.message : String(error));
    throw createFrontmatterError(
      filePath,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

export function extractPromptMeta(
  frontmatter: Frontmatter | null,
  promptName: string,
  relativePath: string
): PromptMeta {
  const meta: PromptMeta = {
    name: promptName,
    description: relativePath,
  };

  if (frontmatter) {
    if (frontmatter.tags && Array.isArray(frontmatter.tags)) {
      meta.tags = frontmatter.tags;
    }
  }

  return meta;
}

export function validateFrontmatter(frontmatter: Frontmatter): void {
  if (frontmatter.tags && !Array.isArray(frontmatter.tags)) {
    throw new Error('tags must be an array');
  }
}

export function serializeFrontmatter(frontmatter: Frontmatter): string {
  // yaml imported at top of file

  try {
    return (
      '---\n' +
      yaml.dump(frontmatter, {
        indent: 2,
        noRefs: true,
        sortKeys: true,
      }) +
      '---\n'
    );
  } catch (error) {
    throw new Error(
      `Failed to serialize frontmatter: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export function stripFrontmatter(content: string): string {
  try {
    const result = matter(content.replace(/^\uFEFF/, ''));
    return result.content;
  } catch {
    // If parsing fails, return original content
    return content;
  }
}

export function reconstructContent(
  content: string,
  frontmatter: Frontmatter | null,
  includeFrontmatter: boolean
): string {
  if (!includeFrontmatter || !frontmatter) {
    return content;
  }

  return serializeFrontmatter(frontmatter) + content;
}


