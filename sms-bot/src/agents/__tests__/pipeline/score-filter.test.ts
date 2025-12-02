import { describe, it, expect } from 'vitest';
import { filterByScore } from '../../pipeline/score-filter';
import { testItemsWithScores } from '../fixtures/test-items';
import type { ScoreFilterStep } from '@vibeceo/shared-types';

describe('Score Filter Node', () => {
  it('should filter items by minimum score', () => {
    const config: ScoreFilterStep = {
      type: 'score_filter',
      minScore: 50,
    };
    
    const result = filterByScore(testItemsWithScores, config);
    expect(result).toHaveLength(2);
    expect(result.every(item => item.score! >= 50)).toBe(true);
  });

  it('should exclude items without score', () => {
    const config: ScoreFilterStep = {
      type: 'score_filter',
      minScore: 0,
    };
    
    const result = filterByScore(testItemsWithScores, config);
    expect(result).toHaveLength(3);
    expect(result.every(item => item.score !== undefined)).toBe(true);
  });

  it('should return empty array when no items meet threshold', () => {
    const config: ScoreFilterStep = {
      type: 'score_filter',
      minScore: 200,
    };
    
    const result = filterByScore(testItemsWithScores, config);
    expect(result).toHaveLength(0);
  });

  it('should handle empty input', () => {
    const config: ScoreFilterStep = {
      type: 'score_filter',
      minScore: 50,
    };
    
    const result = filterByScore([], config);
    expect(result).toHaveLength(0);
  });

  it('should include items with score equal to minimum', () => {
    const config: ScoreFilterStep = {
      type: 'score_filter',
      minScore: 75,
    };
    
    const result = filterByScore(testItemsWithScores, config);
    expect(result).toHaveLength(2);
    expect(result.some(item => item.score === 75)).toBe(true);
  });
});
