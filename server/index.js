require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// TODO: Implement the /process route for the pipeline
app.get('/', (req, res) => {
  res.send('Setu backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
