import type { NormalizedItem } from '@vibeceo/shared-types';

export const createTestItem = (overrides: Partial<NormalizedItem> = {}): NormalizedItem => ({
  id: 'test-id-1',
  title: 'Test Article',
  summary: 'This is a test article summary about technology and innovation.',
  url: 'https://example.com/article',
  publishedAt: '2025-11-26T12:00:00Z',
  author: 'Test Author',
  score: 100,
  ...overrides,
});

export const createTestItems = (count: number): NormalizedItem[] => {
  const items: NormalizedItem[] = [];
  for (let i = 0; i < count; i++) {
    items.push(createTestItem({
      id: `test-id-${i + 1}`,
      title: `Test Article ${i + 1}`,
      score: (i + 1) * 10,
      publishedAt: new Date(Date.now() - i * 3600000).toISOString(),
    }));
  }
  return items;
};

export const testItemWithKeywords: NormalizedItem = createTestItem({
  id: 'keyword-test',
  title: 'Breaking: OpenAI Releases GPT-5',
  summary: 'OpenAI announced today the release of GPT-5, their latest AI model with breakthrough capabilities.',
});

export const testItemWithoutKeywords: NormalizedItem = createTestItem({
  id: 'no-keywords',
  title: 'Weather Update',
  summary: 'Sunny weather expected this weekend across the region.',
});

export const testItemsWithScores: NormalizedItem[] = [
  createTestItem({ id: 'score-1', score: 150, title: 'High Score Article' }),
  createTestItem({ id: 'score-2', score: 75, title: 'Medium Score Article' }),
  createTestItem({ id: 'score-3', score: 25, title: 'Low Score Article' }),
  createTestItem({ id: 'score-4', score: undefined, title: 'No Score Article' }),
];

export const testItemsWithDates: NormalizedItem[] = [
  createTestItem({ id: 'date-1', publishedAt: '2025-11-26T12:00:00Z', title: 'Recent Article' }),
  createTestItem({ id: 'date-2', publishedAt: '2025-11-20T12:00:00Z', title: 'Week Old Article' }),
  createTestItem({ id: 'date-3', publishedAt: '2025-11-01T12:00:00Z', title: 'Month Old Article' }),
  createTestItem({ id: 'date-4', publishedAt: undefined, title: 'No Date Article' }),
];

export const testItemsWithAuthors: NormalizedItem[] = [
  createTestItem({ id: 'author-1', author: 'John Doe', title: 'Article by John' }),
  createTestItem({ id: 'author-2', author: 'Jane Smith', title: 'Article by Jane' }),
  createTestItem({ id: 'author-3', author: 'Bob Johnson', title: 'Article by Bob' }),
  createTestItem({ id: 'author-4', author: undefined, title: 'Anonymous Article' }),
];
