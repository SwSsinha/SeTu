jest.mock('axios', () => ({ get: jest.fn() }));
const axios = require('axios');
const { translateText } = require('../../../src/services/translate.service');

describe('translate.service', () => {
  beforeEach(() => { jest.resetAllMocks(); });

  test('happy path short text', async () => {
    axios.get.mockResolvedValue({ data: { responseData: { translatedText: 'Hola' } } });
    const res = await translateText({ text: 'Hello', targetLang: 'es', allowPartial: false, metrics: {} });
    expect(res.text).toBe('Hola');
    expect(res.partial).toBe(false);
    expect(axios.get).toHaveBeenCalled();
  });

  test('partial allowed when failures', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    const res = await translateText({ text: 'Short', targetLang: 'es', allowPartial: true, metrics: {} });
    expect(res.partial).toBe(true);
    expect(res.text).toBe('');
  });
});
