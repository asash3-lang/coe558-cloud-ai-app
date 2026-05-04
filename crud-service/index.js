const express = require('express');
const bodyParser = require('body-parser');
const { Firestore } = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');

const app = express();
const firestore = new Firestore({ projectId: 'manifest-bit-494908-a5' });
const storage = new Storage({ projectId: 'manifest-bit-494908-a5' });

const BUCKET_NAME = 'manifest-bit-494908-a5-genai-images';
const COLLECTION = 'genai-history';
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json({ limit: '10mb' }));

// CORS
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  next();
});

app.listen(PORT, () => {
  console.log(`S3 CRUD Service running on port ${PORT}`);
});

// Health check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'S3 CRUD Service is running' });
});

// CREATE - Save a new GenAI result
// Body: { prompt, image (base64), mimeType, model }
app.post('/api/history', async (req, res) => {
  try {
    const { prompt, image, mimeType = 'image/jpeg', model } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    let imageUrl = null;

    // Upload image to Cloud Storage if provided
    if (image) {
      const fileName = `images/${Date.now()}.jpg`;
      const bucket = storage.bucket(BUCKET_NAME);
      const file = bucket.file(fileName);
      const imageBuffer = Buffer.from(image, 'base64');

      await file.save(imageBuffer, {
        metadata: { contentType: mimeType },
      });

      imageUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`;
    }

    // Save to Firestore
    const docData = {
      prompt,
      model: model || 'unknown',
      imageUrl,
      createdAt: new Date().toISOString(),
    };

    const docRef = await firestore.collection(COLLECTION).add(docData);

    res.status(201).json({
      id: docRef.id,
      ...docData,
    });

  } catch (error) {
    console.error('Create error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// READ ALL - Get all GenAI history
app.get('/api/history', async (req, res) => {
  try {
    const snapshot = await firestore
      .collection(COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const results = [];
    snapshot.forEach(doc => {
      results.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(results);

  } catch (error) {
    console.error('Read all error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// READ ONE - Get a specific result by ID
app.get('/api/history/:id', async (req, res) => {
  try {
    const doc = await firestore.collection(COLLECTION).doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.status(200).json({ id: doc.id, ...doc.data() });

  } catch (error) {
    console.error('Read one error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE - Update prompt or metadata by ID
app.put('/api/history/:id', async (req, res) => {
  try {
    const { prompt, model } = req.body;
    const updateData = {};
    if (prompt) updateData.prompt = prompt;
    if (model) updateData.model = model;
    updateData.updatedAt = new Date().toISOString();

    const docRef = firestore.collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Not found' });
    }

    await docRef.update(updateData);
    res.status(200).json({ id: req.params.id, ...updateData });

  } catch (error) {
    console.error('Update error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Delete a result by ID
app.delete('/api/history/:id', async (req, res) => {
  try {
    const docRef = firestore.collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Delete image from Cloud Storage if exists
    const data = doc.data();
    if (data.imageUrl) {
      const fileName = data.imageUrl.split(`${BUCKET_NAME}/`)[1];
      if (fileName) {
        await storage.bucket(BUCKET_NAME).file(fileName).delete().catch(() => {});
      }
    }

    await docRef.delete();
    res.status(200).json({ message: 'Deleted successfully', id: req.params.id });

  } catch (error) {
    console.error('Delete error:', error.message);
    res.status(500).json({ error: error.message });
  }
});
