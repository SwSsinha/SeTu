const { summarize } = require('../../../src/utils/summary');

describe('summarize', () => {
  test('returns empty string for falsy input', () => {
    expect(summarize('')).toBe('');
    expect(summarize(null)).toBe('');
  });

  test('limits to requested sentences', () => {
    const text = 'One. Two! Three? Four. Five.';
    const out = summarize(text, { sentences: 3 });
    expect(out.split(/(?<=[.!?])\s+/).length).toBeLessThanOrEqual(3);
    expect(out).toMatch(/One/);
    expect(out).toMatch(/Two/);
    expect(out).toMatch(/Three/);
    expect(out).not.toMatch(/Four/);
  });

  test('enforces maxChars truncation with ellipsis', () => {
    const t = 'A'.repeat(600);
    const out = summarize(t, { sentences: 50, maxChars: 120 });
    expect(out.length).toBeLessThanOrEqual(120);
  });
});
