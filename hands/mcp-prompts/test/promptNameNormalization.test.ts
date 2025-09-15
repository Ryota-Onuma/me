import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PromptStore } from '../src/promptStore.js';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';

describe('Prompt Name Normalization', () => {
  let tempDir: string;
  let store: PromptStore;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-prompts-test-'));
    store = new PromptStore(tempDir, {
      flattenPaths: false,
      enableCache: false,
      enableWatch: false,
    });
  });

  afterEach(async () => {
    await store.dispose();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('normalizePromptName', () => {
    it('should convert uppercase to lowercase', () => {
      // Access private method for testing
      const normalizePromptName = (store as any).normalizePromptName.bind(store);
      expect(normalizePromptName('MyPrompt')).toBe('myprompt');
      expect(normalizePromptName('UPPERCASE')).toBe('uppercase');
    });

    it('should replace spaces with underscores', () => {
      const normalizePromptName = (store as any).normalizePromptName.bind(store);
      expect(normalizePromptName('my prompt')).toBe('my_prompt');
      expect(normalizePromptName('multi word prompt')).toBe('multi_word_prompt');
    });

    it('should replace special characters with underscores', () => {
      const normalizePromptName = (store as any).normalizePromptName.bind(store);
      expect(normalizePromptName('prompt-name')).toBe('prompt_name');
      expect(normalizePromptName('prompt.name')).toBe('prompt_name');
      expect(normalizePromptName('prompt@name')).toBe('prompt_name');
      expect(normalizePromptName('prompt#name')).toBe('prompt_name');
    });

    it('should remove leading and trailing underscores', () => {
      const normalizePromptName = (store as any).normalizePromptName.bind(store);
      expect(normalizePromptName('_prompt_')).toBe('prompt');
      expect(normalizePromptName('__prompt__')).toBe('prompt');
      expect(normalizePromptName('___prompt')).toBe('prompt');
      expect(normalizePromptName('prompt___')).toBe('prompt');
    });

    it('should handle multiple consecutive special characters', () => {
      const normalizePromptName = (store as any).normalizePromptName.bind(store);
      expect(normalizePromptName('prompt---name')).toBe('prompt_name');
      expect(normalizePromptName('prompt...name')).toBe('prompt_name');
      expect(normalizePromptName('prompt   name')).toBe('prompt_name');
    });

    it('should preserve alphanumeric characters and underscores', () => {
      const normalizePromptName = (store as any).normalizePromptName.bind(store);
      expect(normalizePromptName('prompt123')).toBe('prompt123');
      expect(normalizePromptName('prompt_name')).toBe('prompt_name');
      expect(normalizePromptName('123prompt')).toBe('123prompt');
    });
  });

  describe('generatePromptName integration', () => {
    it('should normalize simple file names', () => {
      const generatePromptName = (store as any).generatePromptName.bind(store);
      expect(generatePromptName('My Prompt.md')).toBe('my_prompt');
      expect(generatePromptName('special-chars@file.md')).toBe('special_chars_file');
    });

    it('should normalize flattened paths', () => {
      const storeWithFlatten = new PromptStore(tempDir, {
        flattenPaths: true,
        enableCache: false,
        enableWatch: false,
      });
      const generatePromptName = (storeWithFlatten as any).generatePromptName.bind(storeWithFlatten);

      expect(generatePromptName('path/to/My Prompt.md')).toBe('path_to_my_prompt');
      expect(generatePromptName('Special-Dir/file@name.md')).toBe('special_dir_file_name');
    });

    it('should handle edge cases', () => {
      const generatePromptName = (store as any).generatePromptName.bind(store);
      expect(generatePromptName('___test___.md')).toBe('test');
      expect(generatePromptName('UPPER-case.md')).toBe('upper_case');
      expect(generatePromptName('numbers123.md')).toBe('numbers123');
    });
  });
});