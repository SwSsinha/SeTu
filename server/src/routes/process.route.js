const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const validateProcess = require('../middleware/validateProcess');
const { scrapeArticle } = require('../services/portia.service');
const { translateText } = require('../services/translate.service');
const { synthesizeToMp3Stream } = require('../services/tts.service');

const router = Router();

router.post(
	'/',
	validateProcess,
	asyncHandler(async (req, res) => {
		const { url, lang } = req.processInput;

		const articleText = await scrapeArticle({ url });
		const translated = await translateText({ text: articleText, targetLang: lang });
		const audioStream = await synthesizeToMp3Stream({ text: translated });

		res.setHeader('Content-Type', 'audio/mpeg');
		res.setHeader('Content-Disposition', `attachment; filename="setu_${lang}.mp3"`);
		audioStream.pipe(res);
	})
);

module.exports = router;
