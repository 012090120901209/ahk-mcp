import { describe, it } from 'node:test';
import assert from 'node:assert';
import { resolveContentParameter, detectDeprecatedParameters, addDeprecationWarning, resolveWithTracking } from '../../src/core/parameter-aliases.js';

describe('Parameter Aliases Utility', () => {
  describe('resolveContentParameter', () => {
    it('should return newContent when only newContent provided', () => {
      const result = resolveContentParameter({ newContent: 'test' });
      assert.strictEqual(result, 'test');
    });

    it('should return content when only content provided (deprecated)', () => {
      const result = resolveContentParameter({ content: 'test' });
      assert.strictEqual(result, 'test');
    });

    it('should return newContent when both provided (priority)', () => {
      const result = resolveContentParameter({
        content: 'old',
        newContent: 'new'
      });
      assert.strictEqual(result, 'new');
    });

    it('should return undefined when neither provided', () => {
      const result = resolveContentParameter({});
      assert.strictEqual(result, undefined);
    });

    it('should handle empty strings correctly', () => {
      const result1 = resolveContentParameter({ newContent: '' });
      assert.strictEqual(result1, '');

      const result2 = resolveContentParameter({ content: '' });
      assert.strictEqual(result2, '');
    });

    it('should handle null-like values', () => {
      const result1 = resolveContentParameter({ newContent: null });
      assert.strictEqual(result1, undefined);

      const result2 = resolveContentParameter({ content: undefined });
      assert.strictEqual(result2, undefined);
    });
  });

  describe('detectDeprecatedParameters', () => {
    it('should detect content when used alone', () => {
      const result = detectDeprecatedParameters({ content: 'test' });
      assert.deepStrictEqual(result, ['"content" (use "newContent")']);
    });

    it('should not detect when newContent provided', () => {
      const result = detectDeprecatedParameters({ newContent: 'test' });
      assert.deepStrictEqual(result, []);
    });

    it('should not detect when both provided (newContent takes priority)', () => {
      const result = detectDeprecatedParameters({
        content: 'old',
        newContent: 'new'
      });
      assert.deepStrictEqual(result, []);
    });

    it('should return empty array when neither provided', () => {
      const result = detectDeprecatedParameters({});
      assert.deepStrictEqual(result, []);
    });

    it('should handle object with other properties', () => {
      const result = detectDeprecatedParameters({
        content: 'test',
        action: 'replace',
        search: 'foo'
      });
      assert.deepStrictEqual(result, ['"content" (use "newContent")']);
    });
  });

  describe('addDeprecationWarning', () => {
    it('should prepend warning to text content', () => {
      const result = {
        content: [{ type: 'text', text: 'Original message' }]
      };

      const updated = addDeprecationWarning(result, ['"content" (use "newContent")']);

      assert.ok(updated.content[0].text.includes('⚠️ **Deprecated parameter(s)**'));
      assert.ok(updated.content[0].text.includes('"content" (use "newContent")'));
      assert.ok(updated.content[0].text.includes('Original message'));
    });

    it('should handle multiple deprecated parameters', () => {
      const result = {
        content: [{ type: 'text', text: 'Original' }]
      };

      const updated = addDeprecationWarning(result, [
        '"content" (use "newContent")',
        '"preview" (use "dryRun")'
      ]);

      assert.ok(updated.content[0].text.includes('"content" (use "newContent")'));
      assert.ok(updated.content[0].text.includes('"preview" (use "dryRun")'));
    });

    it('should not modify result when no deprecated params', () => {
      const result = {
        content: [{ type: 'text', text: 'Original message' }]
      };

      const updated = addDeprecationWarning(result, []);

      assert.strictEqual(updated.content[0].text, 'Original message');
    });

    it('should handle empty content array', () => {
      const result = { content: [] };
      const updated = addDeprecationWarning(result, ['"content"']);
      assert.deepStrictEqual(updated.content, []);
    });

    it('should handle non-text content types', () => {
      const result = {
        content: [{ type: 'image', data: 'base64...' }]
      };

      const updated = addDeprecationWarning(result, ['"content"']);
      assert.strictEqual(updated.content[0].type, 'image');
    });
  });

  describe('resolveWithTracking', () => {
    it('should return content and deprecated list', () => {
      const result = resolveWithTracking({ content: 'test' });

      assert.strictEqual(result.content, 'test');
      assert.deepStrictEqual(result.deprecatedUsed, ['"content" (use "newContent")']);
    });

    it('should return newContent with empty deprecated list', () => {
      const result = resolveWithTracking({ newContent: 'test' });

      assert.strictEqual(result.content, 'test');
      assert.deepStrictEqual(result.deprecatedUsed, []);
    });

    it('should prioritize newContent and return empty deprecated list', () => {
      const result = resolveWithTracking({
        content: 'old',
        newContent: 'new'
      });

      assert.strictEqual(result.content, 'new');
      assert.deepStrictEqual(result.deprecatedUsed, []);
    });

    it('should return undefined content when neither provided', () => {
      const result = resolveWithTracking({});

      assert.strictEqual(result.content, undefined);
      assert.deepStrictEqual(result.deprecatedUsed, []);
    });
  });

  describe('Edge cases', () => {
    it('should handle numeric values in content fields', () => {
      const result1 = resolveContentParameter({ newContent: 0 });
      assert.strictEqual(result1, undefined); // 0 is falsy but not undefined

      const result2 = resolveContentParameter({ content: 123 });
      assert.strictEqual(result2, undefined);
    });

    it('should handle boolean values', () => {
      const result1 = resolveContentParameter({ newContent: false });
      assert.strictEqual(result1, undefined);

      const result2 = resolveContentParameter({ newContent: true });
      assert.strictEqual(result2, undefined);
    });

    it('should preserve whitespace-only strings', () => {
      const result = resolveContentParameter({ newContent: '   ' });
      assert.strictEqual(result, '   ');
    });
  });
});
