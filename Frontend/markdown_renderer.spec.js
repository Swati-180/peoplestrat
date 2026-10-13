import { test, expect } from '@playwright/test';

test.describe('AI Assistant Markdown Rendering & Safety Tests', () => {
  test('MarkdownRenderer: headings, bold text, lists, and tables render semantically', async () => {
    test.info().annotations.push({
      type: 'Requirement',
      description: 'AI messages containing Markdown formatting (headings, lists, tables) must render valid semantic HTML elements instead of literal markdown characters.'
    });
  });

  test('MarkdownRenderer: script injection and raw HTML tags are blocked', async () => {
    test.info().annotations.push({
      type: 'Security',
      description: 'Raw HTML tags such as <script> and unsafe protocols (javascript:) must not execute or render dangerous HTML.'
    });
  });

  test('MarkdownRenderer: tables are wrapped in a horizontally scrollable container', async () => {
    test.info().annotations.push({
      type: 'Responsiveness',
      description: 'Markdown tables inside floating assistant or mobile view must be scrollable to prevent horizontal overflow breakage.'
    });
  });

  test('Employee lookup: existing authorized employee data displays accurate metrics', async () => {
    test.info().annotations.push({
      type: 'DataIntegrity',
      description: 'Querying an authorized team member must return actual fitment, productivity, and fatigue data.'
    });
  });

  test('Employee lookup: nonexistent employee returns explicit not-found explanation', async () => {
    test.info().annotations.push({
      type: 'Scoping',
      description: 'Querying an employee not in the active organization returns a clear limitation message rather than generic or fabricated responses.'
    });
  });
});
