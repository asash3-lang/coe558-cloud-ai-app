const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const S2 = 'https://genai-service-180225892893.us-central1.run.app';
const S3 = 'https://crud-service-180225892893.us-central1.run.app';

// Pub/Sub pushes messages to this endpoint
app.post('/process', async (req, res) => {
  try {
    // Decode Pub/Sub message
    const message = req.body.message;
    if (!message || !message.data) {
      return res.status(400).json({ error: 'Invalid Pub/Sub message' });
    }

    const payload = JSON.parse(Buffer.from(message.data, 'base64').toString());
    const { prompt, requestId } = payload;

    console.log(`Processing request ${requestId}: "${prompt}"`);

    // Step 1: Call S2 to generate image
    const genRes = await axios.post(`${S2}/`, { prompt });
    const { image, mimeType, model } = genRes.data;

    // Step 2: Save result via S3
    const saveRes = await axios.post(`${S3}/api/history`, {
      prompt,
      image,
      mimeType,
      model,
      requestId,
    });

    console.log(`Request ${requestId} completed. Saved ID: ${saveRes.data.id}`);
    res.status(200).json({ success: true, id: saveRes.data.id });

  } catch (error) {
    console.error('Worker error:', error.message);
    // Return 200 to avoid Pub/Sub retrying on app errors
    res.status(200).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'Worker Service running — listening for Pub/Sub messages' });
});

app.listen(PORT, () => {
  console.log(`Worker Service running on port ${PORT}`);
});
