import { describe, it, expect } from 'vitest';
import {
  renderTemplate,
  extractTemplateVariables,
  validateTemplate,
  previewTemplate,
} from '../src/templating.js';

describe('templating', () => {
  describe('renderTemplate', () => {
    it('should replace positional arguments', () => {
      const template = 'Hello $1, welcome to $2!';
      const result = renderTemplate(template, ['Alice', 'GitHub']);
      expect(result).toBe('Hello Alice, welcome to GitHub!');
    });

    it('should replace named arguments', () => {
      const template = 'Hello {{name}}, your score is {{score}}';
      const result = renderTemplate(template, [], { name: 'Bob', score: '95' });
      expect(result).toBe('Hello Bob, your score is 95');
    });

    it('should handle mixed positional and named arguments', () => {
      const template = 'User $1 has {{role}} permissions';
      const result = renderTemplate(template, ['alice'], { role: 'admin' });
      expect(result).toBe('User alice has admin permissions');
    });

    it('should handle escaped arguments', () => {
      const template = 'Escaped: $$1 and {{{name}}}';
      const result = renderTemplate(template, ['value'], { name: 'test' });
      expect(result).toBe('Escaped: $1 and {{name}}');
    });

    it('should leave unresolved placeholders in non-strict mode', () => {
      const template = 'Hello $1, your {{status}} is unknown';
      const result = renderTemplate(template, [], {}, false);
      expect(result).toBe('Hello $1, your {{status}} is unknown');
    });

    it('should throw error for missing arguments in strict mode', () => {
      const template = 'Hello $1, your {{status}} is unknown';
      expect(() => renderTemplate(template, [], {}, true)).toThrow();
    });

    it('should handle empty arguments', () => {
      const template = 'Value: $1, Name: {{name}}';
      const result = renderTemplate(template, [''], { name: '' });
      expect(result).toBe('Value: , Name: ');
    });

    it('should handle multiple occurrences of same placeholder', () => {
      const template = '$1 said "$1" to {{name}} and {{name}}';
      const result = renderTemplate(template, ['Alice'], { name: 'Bob' });
      expect(result).toBe('Alice said "Alice" to Bob and Bob');
    });
  });

  describe('extractTemplateVariables', () => {
    it('should extract positional variables', () => {
      const template = 'Hello $1, welcome to $2 and $1 again';
      const result = extractTemplateVariables(template);
      expect(result.positional).toEqual([1, 2]);
    });

    it('should extract named variables', () => {
      const template = 'Hello {{name}}, your {{score}} is great, {{name}}!';
      const result = extractTemplateVariables(template);
      expect(result.named).toEqual(['name', 'score']);
    });

    it('should ignore escaped variables', () => {
      const template = 'Normal $1 and {{name}}, escaped $$2 and {{{other}}}';
      const result = extractTemplateVariables(template);
      expect(result.positional).toEqual([1]);
      expect(result.named).toEqual(['name']);
    });

    it('should handle templates with no variables', () => {
      const template = 'This is just plain text';
      const result = extractTemplateVariables(template);
      expect(result.positional).toEqual([]);
      expect(result.named).toEqual([]);
    });

    it('should sort variables', () => {
      const template = '$3 {{zebra}} $1 {{alpha}} $2';
      const result = extractTemplateVariables(template);
      expect(result.positional).toEqual([1, 2, 3]);
      expect(result.named).toEqual(['alpha', 'zebra']);
    });
  });

  describe('validateTemplate', () => {
    it('should validate correct templates', () => {
      const template = 'Hello $1 and {{name}}';
      const result = validateTemplate(template);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect unmatched braces', () => {
      const template = 'Hello {{name} with missing brace';
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Unmatched braces');
    });

    it('should detect invalid positional syntax', () => {
      const template = 'Invalid $a positional argument';
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid positional argument syntax');
    });

    it('should detect invalid named syntax', () => {
      const template = 'Invalid {{name-with-dash}} argument';
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid named argument syntax');
    });
  });

  describe('previewTemplate', () => {
    it('should generate preview with sample arguments', () => {
      const template = 'Hello $1, your role is {{role}}';
      const result = previewTemplate(template);
      expect(result).toBe('Hello <arg1>, your role is <role>');
    });

    it('should use provided sample arguments', () => {
      const template = 'Hello $1, your role is {{role}}';
      const result = previewTemplate(template, ['Alice'], { role: 'admin' });
      expect(result).toBe('Hello Alice, your role is admin');
    });

    it('should handle templates without variables', () => {
      const template = 'This is plain text';
      const result = previewTemplate(template);
      expect(result).toBe('This is plain text');
    });
  });
});
