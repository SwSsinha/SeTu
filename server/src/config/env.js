const required = [
	'PORTIA_API_KEY',
	'PORTIA_TOOL_ID',
	'ELEVENLABS_API_KEY',
];

function getEnv() {
	const cfg = {
		NODE_ENV: process.env.NODE_ENV || 'development',
		PORT: Number(process.env.PORT || 5000),
		PORTIA_API_KEY: process.env.PORTIA_API_KEY,
		PORTIA_TOOL_ID: process.env.PORTIA_TOOL_ID,
	PORTIA_BASE_URL: process.env.PORTIA_BASE_URL, // optional override, e.g. https://api.portialabs.ai
		PORTIA_ORG_ID: process.env.PORTIA_ORG_ID, // optional but may be required for custom MCP tools
		ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
		ELEVENLABS_VOICE_ID: process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM',
	};

	const missing = required.filter((k) => !cfg[k]);
	return { cfg, missing };
}

module.exports = { getEnv };
