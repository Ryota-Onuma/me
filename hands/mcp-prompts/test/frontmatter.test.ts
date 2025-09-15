import { describe, it, expect } from 'vitest';
import {
  parseFrontmatter,
  extractPromptMeta,
  validateFrontmatter,
  stripFrontmatter,
  reconstructContent,
  isTargetAllowed,
  expandAliases,
} from '../src/frontmatter.js';

describe('frontmatter', () => {
  describe('parseFrontmatter', () => {
    it('should parse YAML frontmatter', () => {
      const content = `---
title: Test Prompt
tags: ["git", "commit"]
version: 1
---
# Content here
This is the prompt content.`;

      const result = parseFrontmatter(content, 'test.md');
      expect(result.hasFrontmatter).toBe(true);
      expect(result.frontmatter?.title).toBe('Test Prompt');
      expect(result.frontmatter?.tags).toEqual(['git', 'commit']);
      expect(result.frontmatter?.version).toBe(1);
      expect(result.content).toBe('# Content here\nThis is the prompt content.');
    });

    it('should handle content without frontmatter', () => {
      const content = `# Just Content
This is a simple prompt without frontmatter.`;

      const result = parseFrontmatter(content, 'test.md');
      expect(result.hasFrontmatter).toBe(false);
      expect(result.frontmatter).toBeNull();
      expect(result.content).toBe(content);
    });

    it('should handle empty frontmatter', () => {
      const content = `---
---
# Content after empty frontmatter`;

      const result = parseFrontmatter(content, 'test.md');
      expect(result.hasFrontmatter).toBe(false);
      expect(result.frontmatter).toBeNull();
      expect(result.content).toBe('# Content after empty frontmatter');
    });

    it('should remove BOM if present', () => {
      const content = `\uFEFF---
title: Test
---
Content`;

      const result = parseFrontmatter(content, 'test.md');
      expect(result.frontmatter?.title).toBe('Test');
      expect(result.content).toBe('Content');
    });

    it('should throw error for invalid YAML', () => {
      const content = `---
title: Test
invalid: [unclosed array
---
Content`;

      expect(() => parseFrontmatter(content, 'test.md')).toThrow();
    });
  });

  describe('extractPromptMeta', () => {
    it('should extract metadata from frontmatter', () => {
      const frontmatter = {
        'argument-hint': 'commit [scope] [priority]',
        tags: ['git', 'commit'],
        aliases: ['c', 'ci'],
        version: 2,
      };

      const meta = extractPromptMeta(frontmatter, 'commit', 'git/commit.md');
      expect(meta.name).toBe('commit');
      expect(meta.description).toBe('git/commit.md');
      expect(meta.argumentHint).toBe('commit [scope] [priority]');
      expect(meta.tags).toEqual(['git', 'commit']);
      expect(meta.aliases).toEqual(['c', 'ci']);
      expect(meta.version).toBe(2);
    });

    it('should handle null frontmatter', () => {
      const meta = extractPromptMeta(null, 'simple', 'simple.md');
      expect(meta.name).toBe('simple');
      expect(meta.description).toBe('simple.md');
      expect(meta.tags).toBeUndefined();
      expect(meta.argumentHint).toBeUndefined();
    });

    it('should ignore invalid types', () => {
      const frontmatter = {
        tags: 'not an array',
        version: 'not a number',
        aliases: 123,
      };

      const meta = extractPromptMeta(frontmatter, 'test', 'test.md');
      expect(meta.tags).toBeUndefined();
      expect(meta.version).toBeUndefined();
      expect(meta.aliases).toBeUndefined();
    });
  });

  describe('validateFrontmatter', () => {
    it('should validate correct frontmatter', () => {
      const frontmatter = {
        targets: ['claude', 'cursor'],
        tags: ['git', 'commit'],
        aliases: ['c', 'ci'],
        version: 1,
        'allowed-tools': ['git', 'bash'],
      };

      expect(() => validateFrontmatter(frontmatter)).not.toThrow();
    });

    it('should reject invalid targets', () => {
      const frontmatter = {
        targets: ['invalid-client'],
      };

      expect(() => validateFrontmatter(frontmatter)).toThrow('Invalid targets');
    });

    it('should reject non-array targets', () => {
      const frontmatter = {
        targets: 'not an array',
      };

      expect(() => validateFrontmatter(frontmatter)).toThrow('targets must be an array');
    });

    it('should reject non-array tags', () => {
      const frontmatter = {
        tags: 'not an array',
      };

      expect(() => validateFrontmatter(frontmatter)).toThrow('tags must be an array');
    });

    it('should reject non-number version', () => {
      const frontmatter = {
        version: 'not a number',
      };

      expect(() => validateFrontmatter(frontmatter)).toThrow('version must be a number');
    });
  });

  describe('stripFrontmatter', () => {
    it('should remove frontmatter and return content', () => {
      const content = `---
title: Test
---
# Content
Body text`;

      const result = stripFrontmatter(content);
      expect(result).toBe('# Content\nBody text');
    });

    it('should return original content if no frontmatter', () => {
      const content = '# Just content\nNo frontmatter here';
      const result = stripFrontmatter(content);
      expect(result).toBe(content);
    });

    it('should handle malformed frontmatter gracefully', () => {
      const content = `---
invalid yaml: [
---
Content`;

      const result = stripFrontmatter(content);
      expect(result).toBe(content); // Should return original if parsing fails
    });
  });

  describe('reconstructContent', () => {
    it('should reconstruct content with frontmatter when requested', () => {
      const content = 'This is content';
      const frontmatter = { title: 'Test', version: 1 };

      const result = reconstructContent(content, frontmatter, true);
      expect(result).toContain('---');
      expect(result).toContain('title: Test');
      expect(result).toContain('version: 1');
      expect(result).toContain('This is content');
    });

    it('should return content only when frontmatter not requested', () => {
      const content = 'This is content';
      const frontmatter = { title: 'Test' };

      const result = reconstructContent(content, frontmatter, false);
      expect(result).toBe('This is content');
    });

    it('should return content only when no frontmatter', () => {
      const content = 'This is content';

      const result = reconstructContent(content, null, true);
      expect(result).toBe('This is content');
    });
  });

  describe('isTargetAllowed', () => {
    it('should allow all clients when no targets specified', () => {
      expect(isTargetAllowed(null, 'claude')).toBe(true);
      expect(isTargetAllowed({}, 'cursor')).toBe(true);
      expect(isTargetAllowed({ targets: undefined }, 'codex')).toBe(true);
    });

    it('should allow specified clients', () => {
      const frontmatter = { targets: ['claude', 'cursor'] };
      expect(isTargetAllowed(frontmatter, 'claude')).toBe(true);
      expect(isTargetAllowed(frontmatter, 'cursor')).toBe(true);
    });

    it('should reject non-specified clients', () => {
      const frontmatter = { targets: ['claude'] };
      expect(isTargetAllowed(frontmatter, 'cursor')).toBe(false);
      expect(isTargetAllowed(frontmatter, 'codex')).toBe(false);
    });
  });

  describe('expandAliases', () => {
    it('should return original name when no aliases', () => {
      const result = expandAliases('commit', null);
      expect(result).toEqual(['commit']);
    });

    it('should include aliases from frontmatter', () => {
      const frontmatter = { aliases: ['c', 'ci'] };
      const result = expandAliases('commit', frontmatter);
      expect(result).toEqual(['commit', 'c', 'ci']);
    });

    it('should handle non-array aliases', () => {
      const frontmatter = { aliases: 'not an array' };
      const result = expandAliases('commit', frontmatter);
      expect(result).toEqual(['commit']);
    });
  });
});
