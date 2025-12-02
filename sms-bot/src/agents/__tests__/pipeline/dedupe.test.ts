import { describe, it, expect } from 'vitest';
import { dedupeItems } from '../../pipeline/dedupe';
import { createTestItem } from '../fixtures/test-items';

describe('Dedupe Node', () => {
  describe('Dedupe by URL', () => {
    it('should remove duplicate URLs', () => {
      const items = [
        createTestItem({ id: '1', url: 'https://example.com/article' }),
        createTestItem({ id: '2', url: 'https://example.com/article' }),
        createTestItem({ id: '3', url: 'https://example.com/other' }),
      ];
      
      const result = dedupeItems(items, 'url');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('3');
    });

    it('should keep items without URL', () => {
      const items = [
        createTestItem({ id: '1', url: undefined }),
        createTestItem({ id: '2', url: undefined }),
      ];
      
      const result = dedupeItems(items, 'url');
      expect(result).toHaveLength(0);
    });
  });

  describe('Dedupe by ID', () => {
    it('should remove duplicate IDs', () => {
      const items = [
        createTestItem({ id: 'same-id' }),
        createTestItem({ id: 'same-id' }),
        createTestItem({ id: 'different-id' }),
      ];
      
      const result = dedupeItems(items, 'id');
      expect(result).toHaveLength(2);
    });
  });

  describe('Dedupe by Title', () => {
    it('should remove duplicate titles', () => {
      const items = [
        createTestItem({ id: '1', title: 'Same Title' }),
        createTestItem({ id: '2', title: 'Same Title' }),
        createTestItem({ id: '3', title: 'Different Title' }),
      ];
      
      const result = dedupeItems(items, 'title');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('3');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      const result = dedupeItems([], 'url');
      expect(result).toHaveLength(0);
    });

    it('should keep first occurrence of duplicate', () => {
      const items = [
        createTestItem({ id: '1', url: 'https://example.com', title: 'First' }),
        createTestItem({ id: '2', url: 'https://example.com', title: 'Second' }),
      ];
      
      const result = dedupeItems(items, 'url');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('First');
    });
  });
});
