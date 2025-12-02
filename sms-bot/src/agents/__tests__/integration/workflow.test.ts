import { describe, it, expect } from 'vitest';
import { filterByKeywords } from '../../pipeline/keyword-filter';
import { filterByScore } from '../../pipeline/score-filter';
import { limitItems } from '../../pipeline/limit-filter';
import { dedupeItems } from '../../pipeline/dedupe';
import { generateSMS } from '../../output/sms';
import { createTestItem } from '../fixtures/test-items';
import type { KeywordFilterStep, ScoreFilterStep, LimitFilterStep, AgentMetadata } from '@vibeceo/shared-types';

describe('Workflow Integration Tests', () => {
  const agentMetadata: AgentMetadata = {
    name: 'AI News Agent',
    description: 'Curates AI news',
    slug: 'ai-news',
  };

  it('should execute complete workflow: fetch → filter → limit → output', () => {
    // Simulate fetched items from a source
    const sourceItems = [
      createTestItem({ id: '1', title: 'OpenAI Releases GPT-5', score: 150, url: 'https://example.com/1' }),
      createTestItem({ id: '2', title: 'Google Announces Gemini 2', score: 120, url: 'https://example.com/2' }),
      createTestItem({ id: '3', title: 'Weather Update', score: 50, url: 'https://example.com/3' }),
      createTestItem({ id: '4', title: 'AI Breakthrough in Medicine', score: 90, url: 'https://example.com/4' }),
      createTestItem({ id: '5', title: 'Stock Market News', score: 30, url: 'https://example.com/5' }),
      createTestItem({ id: '6', title: 'New AI Model Released', score: 110, url: 'https://example.com/6' }),
    ];

    // Step 1: Keyword Filter (include AI-related content)
    const keywordConfig: KeywordFilterStep = {
      type: 'keyword_filter',
      include: ['AI', 'OpenAI', 'Gemini', 'GPT'],
    };
    const afterKeywords = filterByKeywords(sourceItems, keywordConfig);
    expect(afterKeywords).toHaveLength(4); // Filters out weather and stock news

    // Step 2: Score Filter (minimum score of 100)
    const scoreConfig: ScoreFilterStep = {
      type: 'score_filter',
      minScore: 100,
    };
    const afterScore = filterByScore(afterKeywords, scoreConfig);
    expect(afterScore).toHaveLength(3); // Filters out score 90 item

    // Step 3: Limit to top 2
    const limitConfig: LimitFilterStep = {
      type: 'limit_filter',
      maxItems: 2,
    };
    const afterLimit = limitItems(afterScore, limitConfig);
    expect(afterLimit).toHaveLength(2);

    // Step 4: Generate SMS
    const smsConfig = {
      template: '{{agentName}} - {{count}} top stories:\n\n{{#each items}}• {{title}}\n{{/each}}',
      maxLength: 300,
    };
    const reportUrl = 'https://example.com/report';
    const sms = generateSMS(afterLimit, smsConfig, agentMetadata, reportUrl);

    expect(sms).toContain('AI News Agent');
    expect(sms).toContain('2 top stories');
    expect(sms).toContain('OpenAI Releases GPT-5');
    expect(sms).toContain('Google Announces Gemini 2');
    expect(sms).toContain('Full report: https://example.com/report');
  });

  it('should handle duplicate items in workflow', () => {
    const sourceItems = [
      createTestItem({ id: '1', title: 'AI News', url: 'https://example.com/1', score: 100 }),
      createTestItem({ id: '2', title: 'AI News', url: 'https://example.com/1', score: 90 }), // Duplicate URL
      createTestItem({ id: '3', title: 'ML Update', url: 'https://example.com/2', score: 110 }),
    ];

    // Dedupe by URL
    const afterDedupe = dedupeItems(sourceItems, 'url');
    expect(afterDedupe).toHaveLength(2);

    // Filter by keyword
    const keywordConfig: KeywordFilterStep = {
      type: 'keyword_filter',
      include: ['AI', 'ML'],
    };
    const afterKeywords = filterByKeywords(afterDedupe, keywordConfig);
    expect(afterKeywords).toHaveLength(2);

    // Filter by score
    const scoreConfig: ScoreFilterStep = {
      type: 'score_filter',
      minScore: 95,
    };
    const afterScore = filterByScore(afterKeywords, scoreConfig);
    expect(afterScore).toHaveLength(2);
  });

  it('should handle workflow with no matching items', () => {
    const sourceItems = [
      createTestItem({ id: '1', title: 'Weather News', score: 50 }),
      createTestItem({ id: '2', title: 'Sports Update', score: 60 }),
    ];

    // Filter for AI keywords (no matches)
    const keywordConfig: KeywordFilterStep = {
      type: 'keyword_filter',
      include: ['AI', 'ML'],
    };
    const afterKeywords = filterByKeywords(sourceItems, keywordConfig);
    expect(afterKeywords).toHaveLength(0);

    // SMS should handle empty results gracefully
    const smsConfig = {
      template: '{{agentName}} found {{count}} items',
      maxLength: 160,
    };
    const sms = generateSMS(afterKeywords, smsConfig, agentMetadata);
    expect(sms).toContain('0 items');
  });

  it('should preserve item order through workflow', () => {
    const sourceItems = [
      createTestItem({ id: '1', title: 'First AI Article', score: 100 }),
      createTestItem({ id: '2', title: 'Second AI Article', score: 90 }),
      createTestItem({ id: '3', title: 'Third AI Article', score: 80 }),
    ];

    const keywordConfig: KeywordFilterStep = {
      type: 'keyword_filter',
      include: ['AI'],
    };
    const afterKeywords = filterByKeywords(sourceItems, keywordConfig);

    const limitConfig: LimitFilterStep = {
      type: 'limit_filter',
      maxItems: 2,
    };
    const afterLimit = limitItems(afterKeywords, limitConfig);

    expect(afterLimit[0].id).toBe('1');
    expect(afterLimit[1].id).toBe('2');
  });
});
