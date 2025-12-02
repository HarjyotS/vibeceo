import { describe, it, expect } from 'vitest';
import { limitItems } from '../../pipeline/limit-filter';
import { createTestItems } from '../fixtures/test-items';
import type { LimitFilterStep } from '@vibeceo/shared-types';

describe('Limit Filter Node', () => {
  it('should limit items to specified maximum', () => {
    const items = createTestItems(10);
    const config: LimitFilterStep = {
      type: 'limit_filter',
      maxItems: 5,
    };
    
    const result = limitItems(items, config);
    expect(result).toHaveLength(5);
    expect(result[0].id).toBe('test-id-1');
    expect(result[4].id).toBe('test-id-5');
  });

  it('should return all items when limit exceeds count', () => {
    const items = createTestItems(3);
    const config: LimitFilterStep = {
      type: 'limit_filter',
      maxItems: 10,
    };
    
    const result = limitItems(items, config);
    expect(result).toHaveLength(3);
  });

  it('should handle limit of 0', () => {
    const items = createTestItems(5);
    const config: LimitFilterStep = {
      type: 'limit_filter',
      maxItems: 0,
    };
    
    const result = limitItems(items, config);
    expect(result).toHaveLength(0);
  });

  it('should handle empty input', () => {
    const config: LimitFilterStep = {
      type: 'limit_filter',
      maxItems: 5,
    };
    
    const result = limitItems([], config);
    expect(result).toHaveLength(0);
  });

  it('should preserve item order', () => {
    const items = createTestItems(10);
    const config: LimitFilterStep = {
      type: 'limit_filter',
      maxItems: 3,
    };
    
    const result = limitItems(items, config);
    expect(result.map(i => i.id)).toEqual(['test-id-1', 'test-id-2', 'test-id-3']);
  });
});
