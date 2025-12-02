import { describe, it, expect } from 'vitest';
import { filterByKeywords } from '../../pipeline/keyword-filter';
import { createTestItem, testItemWithKeywords, testItemWithoutKeywords } from '../fixtures/test-items';
import type { KeywordFilterStep } from '@vibeceo/shared-types';

describe('Keyword Filter Node', () => {
  describe('Include Mode', () => {
    it('should include items matching keywords in title', () => {
      const items = [testItemWithKeywords, testItemWithoutKeywords];
      const config: KeywordFilterStep = {
        type: 'keyword_filter',
        include: ['OpenAI', 'GPT'],
      };
      
      const result = filterByKeywords(items, config);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('keyword-test');
    });

    it('should include items matching keywords in summary', () => {
      const items = [testItemWithKeywords, testItemWithoutKeywords];
      const config: KeywordFilterStep = {
        type: 'keyword_filter',
        include: ['announced', 'capabilities'],
      };
      
      const result = filterByKeywords(items, config);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('keyword-test');
    });

    it('should be case-insensitive by default', () => {
      const items = [testItemWithKeywords];
      const config: KeywordFilterStep = {
        type: 'keyword_filter',
        include: ['openai', 'gpt-5'],
      };
      
      const result = filterByKeywords(items, config);
      expect(result).toHaveLength(1);
    });

    it('should respect case sensitivity when enabled', () => {
      const items = [testItemWithKeywords];
      const config: KeywordFilterStep = {
        type: 'keyword_filter',
        include: ['openai'],
        caseSensitive: true,
      };
      
      const result = filterByKeywords(items, config);
      expect(result).toHaveLength(0);
    });

    it('should return empty array when no items match', () => {
      const items = [testItemWithoutKeywords];
      const config: KeywordFilterStep = {
        type: 'keyword_filter',
        include: ['AI', 'machine learning'],
      };
      
      const result = filterByKeywords(items, config);
      expect(result).toHaveLength(0);
    });
  });

  describe('Exclude Mode', () => {
    it('should exclude items matching keywords', () => {
      const items = [testItemWithKeywords, testItemWithoutKeywords];
      const config: KeywordFilterStep = {
        type: 'keyword_filter',
        exclude: ['OpenAI'],
      };
      
      const result = filterByKeywords(items, config);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('no-keywords');
    });

    it('should exclude items matching any excluded keyword', () => {
      const items = [testItemWithKeywords, testItemWithoutKeywords];
      const config: KeywordFilterStep = {
        type: 'keyword_filter',
        exclude: ['Weather', 'OpenAI'],
      };
      
      const result = filterByKeywords(items, config);
      expect(result).toHaveLength(0);
    });
  });

  describe('Combined Include and Exclude', () => {
    it('should apply exclude first, then include', () => {
      const item1 = createTestItem({ id: '1', title: 'News about OpenAI', summary: 'OpenAI developments' });
      const item2 = createTestItem({ id: '2', title: 'AI Research', summary: 'Latest in AI research' });
      const item3 = createTestItem({ id: '3', title: 'Weather Report', summary: 'Sunny today' });
      const items = [item1, item2, item3];
      
      const config: KeywordFilterStep = {
        type: 'keyword_filter',
        include: ['AI'],
        exclude: ['OpenAI'],
      };
      
      const result = filterByKeywords(items, config);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });
  });

  describe('Edge Cases', () => {
    it('should return empty array for empty input', () => {
      const config: KeywordFilterStep = {
        type: 'keyword_filter',
        include: ['test'],
      };
      
      const result = filterByKeywords([], config);
      expect(result).toHaveLength(0);
    });

    it('should return all items when no filters specified', () => {
      const items = [testItemWithKeywords, testItemWithoutKeywords];
      const config: KeywordFilterStep = {
        type: 'keyword_filter',
      };
      
      const result = filterByKeywords(items, config);
      expect(result).toHaveLength(2);
    });

    it('should handle items with undefined title/summary', () => {
      const item = createTestItem({ id: '1', title: undefined, summary: undefined });
      const config: KeywordFilterStep = {
        type: 'keyword_filter',
        include: ['test'],
      };
      
      const result = filterByKeywords([item], config);
      expect(result).toHaveLength(0);
    });
  });
});
