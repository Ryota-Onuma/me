import { describe, it, expect } from 'vitest';
import {
  getClientPolicy,
  applyClientPolicy,
  isClientSupported,
  normalizeClientId,
  shouldIncludePromptForClient,
  getClientCapabilities,
  optimizeForClient,
} from '../src/clientProfile.js';

describe('clientProfile', () => {
  describe('getClientPolicy', () => {
    it('should return keep policy for Claude', () => {
      const policy = getClientPolicy('claude');
      expect(policy.frontmatterHandling).toBe('keep');
    });

    it('should return strip policy for Cursor', () => {
      const policy = getClientPolicy('cursor');
      expect(policy.frontmatterHandling).toBe('strip');
    });

    it('should return strip policy for Codex', () => {
      const policy = getClientPolicy('codex');
      expect(policy.frontmatterHandling).toBe('strip');
    });

    it('should return keep policy for generic', () => {
      const policy = getClientPolicy('generic');
      expect(policy.frontmatterHandling).toBe('keep');
    });
  });

  describe('applyClientPolicy', () => {
    const content = 'This is prompt content';
    const frontmatter = {
      model: 'claude-3-haiku',
      'allowed-tools': ['git', 'bash'],
      tags: ['git', 'commit'],
    };

    it('should keep frontmatter for Claude by default', () => {
      const result = applyClientPolicy(content, frontmatter, 'claude');
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content).toContain('---');
      expect(result.messages[0].content).toContain('model: claude-3-haiku');
      expect(result.messages[0].content).toContain(content);
    });

    it('should strip frontmatter for Cursor', () => {
      const result = applyClientPolicy(content, frontmatter, 'cursor');
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content).toBe(content);
      expect(result.messages[0].content).not.toContain('---');
    });

    it('should strip frontmatter for Codex', () => {
      const result = applyClientPolicy(content, frontmatter, 'codex');
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content).toBe(content);
      expect(result.messages[0].content).not.toContain('model');
    });

    it('should use system policy when specified', () => {
      const result = applyClientPolicy(content, frontmatter, 'claude', 'system');
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].role).toBe('system');
      expect(result.messages[0].content).toContain('model: claude-3-haiku');
      expect(result.messages[1].role).toBe('user');
      expect(result.messages[1].content).toBe(content);
    });

    it('should handle null frontmatter', () => {
      const result = applyClientPolicy(content, null, 'claude');
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content).toBe(content);
    });

    it('should handle system policy with null frontmatter', () => {
      const result = applyClientPolicy(content, null, 'claude', 'system');
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content).toBe(content);
    });
  });

  describe('isClientSupported', () => {
    it('should support valid clients', () => {
      expect(isClientSupported('claude')).toBe(true);
      expect(isClientSupported('cursor')).toBe(true);
      expect(isClientSupported('codex')).toBe(true);
      expect(isClientSupported('generic')).toBe(true);
    });

    it('should reject invalid clients', () => {
      expect(isClientSupported('invalid')).toBe(false);
      expect(isClientSupported('unknown')).toBe(false);
      expect(isClientSupported('')).toBe(false);
    });
  });

  describe('normalizeClientId', () => {
    it('should return valid client IDs unchanged', () => {
      expect(normalizeClientId('claude')).toBe('claude');
      expect(normalizeClientId('cursor')).toBe('cursor');
      expect(normalizeClientId('codex')).toBe('codex');
      expect(normalizeClientId('generic')).toBe('generic');
    });

    it('should return generic for invalid clients', () => {
      expect(normalizeClientId('invalid')).toBe('generic');
      expect(normalizeClientId('')).toBe('generic');
      expect(normalizeClientId(undefined)).toBe('generic');
    });
  });

  describe('shouldIncludePromptForClient', () => {
    it('should include prompt when no targets specified', () => {
      expect(shouldIncludePromptForClient(null, 'claude')).toBe(true);
      expect(shouldIncludePromptForClient({}, 'cursor')).toBe(true);
      expect(shouldIncludePromptForClient({ targets: undefined }, 'codex')).toBe(true);
    });

    it('should include prompt when client is in targets', () => {
      const frontmatter = { targets: ['claude', 'cursor'] };
      expect(shouldIncludePromptForClient(frontmatter, 'claude')).toBe(true);
      expect(shouldIncludePromptForClient(frontmatter, 'cursor')).toBe(true);
    });

    it('should exclude prompt when client is not in targets', () => {
      const frontmatter = { targets: ['claude'] };
      expect(shouldIncludePromptForClient(frontmatter, 'cursor')).toBe(false);
      expect(shouldIncludePromptForClient(frontmatter, 'codex')).toBe(false);
    });

    it('should handle non-array targets', () => {
      const frontmatter = { targets: 'not-an-array' };
      expect(shouldIncludePromptForClient(frontmatter, 'claude')).toBe(true);
    });
  });

  describe('getClientCapabilities', () => {
    it('should return correct capabilities for Claude', () => {
      const caps = getClientCapabilities('claude');
      expect(caps.supportsFrontmatter).toBe(true);
      expect(caps.supportsSystemMessages).toBe(true);
      expect(caps.preferredPolicy).toBe('keep');
    });

    it('should return correct capabilities for Cursor', () => {
      const caps = getClientCapabilities('cursor');
      expect(caps.supportsFrontmatter).toBe(false);
      expect(caps.supportsSystemMessages).toBe(true);
      expect(caps.preferredPolicy).toBe('strip');
    });

    it('should return correct capabilities for Codex', () => {
      const caps = getClientCapabilities('codex');
      expect(caps.supportsFrontmatter).toBe(false);
      expect(caps.supportsSystemMessages).toBe(false);
      expect(caps.preferredPolicy).toBe('strip');
    });

    it('should return default capabilities for generic', () => {
      const caps = getClientCapabilities('generic');
      expect(caps.supportsFrontmatter).toBe(true);
      expect(caps.supportsSystemMessages).toBe(true);
      expect(caps.preferredPolicy).toBe('keep');
    });
  });

  describe('optimizeForClient', () => {
    const content = 'Test content';

    it('should add default model for Claude when missing', () => {
      const frontmatter = { tags: ['test'] };
      const result = optimizeForClient(content, frontmatter, 'claude');

      expect(result.frontmatter?.model).toBe('claude-3-haiku');
      expect(result.optimizations).toContain('Added default model');
      expect(result.content).toBe(content);
    });

    it('should not override existing model for Claude', () => {
      const frontmatter = { model: 'claude-3-opus' };
      const result = optimizeForClient(content, frontmatter, 'claude');

      expect(result.frontmatter?.model).toBe('claude-3-opus');
      expect(result.optimizations).not.toContain('Added default model');
    });

    it('should optimize for Cursor', () => {
      const frontmatter = { 'allowed-tools': ['git', 'bash'] };
      const result = optimizeForClient(content, frontmatter, 'cursor');

      expect(result.optimizations).toContain('Removed Claude-specific tool syntax');
    });

    it('should convert system instructions for Codex', () => {
      const frontmatter = {
        model: 'claude-3-haiku',
        'allowed-tools': ['git'],
        'argument-hint': 'test [arg]',
      };
      const result = optimizeForClient(content, frontmatter, 'codex');

      expect(result.content).toContain('Model: claude-3-haiku');
      expect(result.content).toContain('Available tools: git');
      expect(result.content).toContain('Usage: test [arg]');
      expect(result.content).toContain(content);
      expect(result.optimizations).toContain('Converted system instructions to user content');
    });

    it('should handle null frontmatter', () => {
      const result = optimizeForClient(content, null, 'claude');
      expect(result.content).toBe(content);
      expect(result.frontmatter).toBeNull();
      expect(result.optimizations).toEqual([]);
    });
  });
});
