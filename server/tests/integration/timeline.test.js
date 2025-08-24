const request = require('supertest');
jest.mock('../../src/services/portia.service', () => ({ scrapeArticle: jest.fn() }));
jest.mock('../../src/services/translate.service', () => ({ translateText: jest.fn() }));
jest.mock('../../src/services/ttsOrchestrator.service', () => ({ generateTts: jest.fn() }));

const { scrapeArticle } = require('../../src/services/portia.service');
const { translateText } = require('../../src/services/translate.service');
const { generateTts } = require('../../src/services/ttsOrchestrator.service');

process.env.PORTIA_API_KEY = 'x';
process.env.PORTIA_TOOL_ID = 'y';
process.env.ELEVENLABS_API_KEY = 'z';

const app = require('../../src/app');
const { Readable } = require('stream');

function mockAudioStream(str) {
  const r = new Readable(); r.push(str); r.push(null); return r;
}

describe('POST /process/timeline', () => {
  beforeEach(() => {
    scrapeArticle.mockReset();
    translateText.mockReset();
    generateTts.mockReset();
  });

  test('success path returns phases, audio, and caches result', async () => {
    scrapeArticle.mockResolvedValue('Example article content.');
    translateText.mockResolvedValue({ text: 'Contenido de ejemplo', partial: false });
    generateTts.mockResolvedValue({ stream: mockAudioStream('AUDIO'), provider: 'mock' });

  const first = await request(app).post('/api/process/timeline').send({ url: 'https://ex.com/a', lang: 'es' });
    expect(first.status).toBe(200);
    expect(first.body.status).toBe('success');
    expect(first.body.phases).toBeDefined();
    expect(first.body.audio).toBeDefined();
    expect(first.body.resultId).toBeTruthy();

    // second call should be cache hit
  const second = await request(app).post('/api/process/timeline').send({ url: 'https://ex.com/a', lang: 'es' });
    expect(second.status).toBe(200);
    expect(second.body.cacheHit).toBe(true);
    expect(second.body.resultId).toBe(first.body.resultId);
  });

  test('scrape failure returns error status', async () => {
    scrapeArticle.mockRejectedValue(Object.assign(new Error('fail scrape'), { status: 502 }));
  const res = await request(app).post('/api/process/timeline').send({ url: 'https://ex.com/b', lang: 'es' });
    expect(res.status).toBe(502);
    expect(res.body.status).toBe('error');
  });
});
