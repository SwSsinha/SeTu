const { setCached, getCached, getById } = require('../../../src/utils/cache');

describe('cache utils', () => {
  test('set/get roundtrip', () => {
    const { id } = setCached({ url: 'u1', lang: 'en', voice: '' }, { audioBuffer: Buffer.from('abc'), meta: { foo: 'bar' } }, { ttl: 5000 });
    const hit = getCached({ url: 'u1', lang: 'en', voice: '' });
    expect(hit.hit).toBe(true);
    expect(hit.entry.meta.foo).toBe('bar');
    expect(hit.entry.audioBuffer.toString()).toBe('abc');
    const byId = getById(id);
    expect(byId.entry.meta.foo).toBe('bar');
  });

  test('miss after different params', () => {
    setCached({ url: 'u2', lang: 'en', voice: '' }, { audioBuffer: Buffer.from('x'), meta: {} });
    const miss = getCached({ url: 'u2', lang: 'hi', voice: '' });
    expect(miss.hit).toBe(false);
  });
});
