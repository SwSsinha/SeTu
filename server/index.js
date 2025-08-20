require('dotenv').config();
const { getEnv } = require('./src/config/env');
const app = require('./src/app');

const { cfg, missing } = getEnv();
if (missing.length) {
  console.error('Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

const PORT = cfg.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
