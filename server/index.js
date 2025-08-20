require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { getEnv } = require('./src/config/env');

const { cfg, missing } = getEnv();
if (missing.length) {
  console.error('Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

const app = express();
const PORT = cfg.PORT;

app.use(cors());
app.use(express.json());

// TODO: Implement the /process route for the pipeline
app.get('/', (req, res) => {
  res.send('Setu backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
