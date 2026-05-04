const functions = require('@google-cloud/functions-framework');
const { GoogleGenAI } = require('@google/genai');

// Use Vertex AI - authenticated via Cloud Run service account automatically
const ai = new GoogleGenAI({
  vertexai: true,
  project: 'manifest-bit-494908-a5',
  location: 'us-central1',
});

functions.http('genai', async (req, res) => {
  // CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Only POST method is allowed' });
    return;
  }

  const { prompt } = req.body;

  if (!prompt) {
    res.status(400).json({ error: 'prompt is required in request body' });
    return;
  }

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    const imageBytes = response.generatedImages[0].image.imageBytes;

    res.status(200).json({
      prompt: prompt,
      image: imageBytes,
      mimeType: 'image/jpeg',
      model: 'imagen-3.0-generate-001'
    });

  } catch (error) {
    console.error('GenAI error:', error.message);
    res.status(500).json({ error: error.message });
  }
});
