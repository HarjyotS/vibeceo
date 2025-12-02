import { describe, it, expect, beforeEach, vi } from 'vitest';
import { filterByDate } from '../../pipeline/date-filter';
import { testItemsWithDates, createTestItem } from '../fixtures/test-items';
import type { DateFilterStep } from '@vibeceo/shared-types';

describe('Date Filter Node', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-11-26T12:00:00Z'));
  });

  describe('Relative Time Ranges', () => {
    it('should filter items from last 24 hours', () => {
      const config: DateFilterStep = {
        type: 'date_filter',
        timeRange: '24h',
      };
      
      const result = filterByDate(testItemsWithDates, config);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('date-1');
    });

    it('should filter items from last 7 days', () => {
      const config: DateFilterStep = {
        type: 'date_filter',
        timeRange: '7d',
      };
      
      const result = filterByDate(testItemsWithDates, config);
      expect(result).toHaveLength(2);
    });

    it('should filter items from last 30 days', () => {
      const config: DateFilterStep = {
        type: 'date_filter',
        timeRange: '30d',
      };
      
      const result = filterByDate(testItemsWithDates, config);
      expect(result).toHaveLength(3);
    });
  });

  describe('Absolute Date Ranges', () => {
    it('should filter items with start date only', () => {
      const config: DateFilterStep = {
        type: 'date_filter',
        startDate: '2025-11-20T00:00:00Z',
      };
      
      const result = filterByDate(testItemsWithDates, config);
      expect(result).toHaveLength(2);
    });

    it('should filter items with end date only', () => {
      const config: DateFilterStep = {
        type: 'date_filter',
        endDate: '2025-11-20T23:59:59Z',
      };
      
      const result = filterByDate(testItemsWithDates, config);
      expect(result).toHaveLength(2);
    });

    it('should filter items within date range', () => {
      const config: DateFilterStep = {
        type: 'date_filter',
        startDate: '2025-11-15T00:00:00Z',
        endDate: '2025-11-25T23:59:59Z',
      };
      
      const result = filterByDate(testItemsWithDates, config);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('date-2');
    });
  });

  describe('Edge Cases', () => {
    it('should exclude items without publishedAt', () => {
      const config: DateFilterStep = {
        type: 'date_filter',
        timeRange: '30d',
      };
      
      const result = filterByDate(testItemsWithDates, config);
      expect(result.every(item => item.publishedAt !== undefined)).toBe(true);
    });

    it('should handle empty input', () => {
      const config: DateFilterStep = {
        type: 'date_filter',
        timeRange: '24h',
      };
      
      const result = filterByDate([], config);
      expect(result).toHaveLength(0);
    });

    it('should exclude items with invalid dates', () => {
      const items = [createTestItem({ id: '1', publishedAt: 'invalid-date' })];
      const config: DateFilterStep = {
        type: 'date_filter',
        timeRange: '24h',
      };
      
      const result = filterByDate(items, config);
      expect(result).toHaveLength(0);
    });
  });
});
