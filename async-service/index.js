const express = require('express');
const { PubSub } = require('@google-cloud/pubsub');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const pubsub = new PubSub({ projectId: 'manifest-bit-494908-a5' });
const TOPIC = 'genai-requests';

app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  next();
});

// POST /generate-async — publish prompt to Pub/Sub
app.post('/generate-async', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  const requestId = uuidv4();
  const message = { prompt, requestId };

  try {
    const messageId = await pubsub
      .topic(TOPIC)
      .publishMessage({ data: Buffer.from(JSON.stringify(message)) });

    console.log(`Published request ${requestId} as Pub/Sub message ${messageId}`);

    res.status(202).json({
      requestId,
      messageId,
      status: 'processing',
      message: 'Your image is being generated. Poll /status/:requestId for the result.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /status/:requestId — poll Firestore for result
app.get('/status/:requestId', async (req, res) => {
  try {
    const { Firestore } = require('@google-cloud/firestore');
    const db = new Firestore({ projectId: 'manifest-bit-494908-a5' });

    const snapshot = await db.collection('genai-history')
      .where('requestId', '==', req.params.requestId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ status: 'processing', requestId: req.params.requestId });
    }

    const doc = snapshot.docs[0];
    res.status(200).json({
      status: 'completed',
      requestId: req.params.requestId,
      result: { id: doc.id, ...doc.data() },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'Async Service running', topic: TOPIC });
});

app.listen(PORT, () => console.log(`Async Service on port ${PORT}`));
