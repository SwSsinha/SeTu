const { generateRunId } = require('../../../src/utils/id');

describe('generateRunId', () => {
  test('returns a non-empty string', () => {
    const id = generateRunId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  test('generates unique values across multiple calls', () => {
    const set = new Set();
    for (let i = 0; i < 100; i++) {
      set.add(generateRunId());
    }
    expect(set.size).toBe(100);
  });

  test('looks like a UUID v4 when supported', () => {
    let hasRandomUUID = false;
    try {
      hasRandomUUID = typeof require('node:crypto').randomUUID === 'function';
    } catch {}

    if (hasRandomUUID) {
      const uuid = generateRunId();
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuidV4Regex.test(uuid)).toBe(true);
    } else {
      const id = generateRunId();
      expect(/\s/.test(id)).toBe(false);
    }
  });
});
