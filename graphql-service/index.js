const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8080;

// Service URLs
const S1 = 'https://weather-service-180225892893.us-central1.run.app';
const S2 = 'https://genai-service-180225892893.us-central1.run.app';
const S3 = 'https://crud-service-180225892893.us-central1.run.app';

// ── GraphQL Schema ─────────────────────────────────────────────────────────
const schema = buildSchema(`
  type WeatherCondition {
    text: String
    icon: String
    code: Int
  }

  type Weather {
    temp_c: Float
    temp_f: Float
    feels_like_c: Float
    feels_like_f: Float
    condition: WeatherCondition
    humidity: Int
    wind_kph: Float
    wind_dir: String
    is_day: Int
  }

  type Location {
    name: String
    region: String
    country: String
    lat: Float
    lon: Float
    localtime: String
  }

  type WeatherResult {
    location: Location
    weather: Weather
  }

  type GenAIResult {
    prompt: String
    image: String
    mimeType: String
    model: String
  }

  type HistoryItem {
    id: String
    prompt: String
    model: String
    imageUrl: String
    createdAt: String
    updatedAt: String
  }

  type DeleteResult {
    message: String
    id: String
  }

  type Query {
    # S1 - Weather
    weather(city: String, lat: Float, lon: Float, ip: String): WeatherResult

    # S3 - Read
    history: [HistoryItem]
    historyItem(id: String!): HistoryItem
  }

  type Mutation {
    # S2 - GenAI
    generateImage(prompt: String!): GenAIResult

    # S3 - Create / Update / Delete
    saveHistory(prompt: String!, image: String, mimeType: String, model: String): HistoryItem
    updateHistory(id: String!, prompt: String, model: String): HistoryItem
    deleteHistory(id: String!): DeleteResult
  }
`);

// ── Resolvers ──────────────────────────────────────────────────────────────
const root = {
  // S1 - Weather
  weather: async ({ city, lat, lon, ip }) => {
    let params = '';
    if (city)       params = `city=${encodeURIComponent(city)}`;
    else if (lat && lon) params = `lat=${lat}&lon=${lon}`;
    else if (ip)    params = `ip=${ip}`;
    else            params = 'ip=auto';

    const res = await axios.get(`${S1}/?${params}`);
    return res.data;
  },

  // S2 - Generate Image
  generateImage: async ({ prompt }) => {
    const res = await axios.post(`${S2}/`, { prompt });
    return res.data;
  },

  // S3 - Read All
  history: async () => {
    const res = await axios.get(`${S3}/api/history`);
    return res.data;
  },

  // S3 - Read One
  historyItem: async ({ id }) => {
    const res = await axios.get(`${S3}/api/history/${id}`);
    return { id, ...res.data };
  },

  // S3 - Create
  saveHistory: async ({ prompt, image, mimeType, model }) => {
    const res = await axios.post(`${S3}/api/history`, { prompt, image, mimeType, model });
    return res.data;
  },

  // S3 - Update
  updateHistory: async ({ id, prompt, model }) => {
    const res = await axios.put(`${S3}/api/history/${id}`, { prompt, model });
    return { id, ...res.data };
  },

  // S3 - Delete
  deleteHistory: async ({ id }) => {
    const res = await axios.delete(`${S3}/api/history/${id}`);
    return res.data;
  },
};

// ── CORS ───────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  next();
});

// ── GraphQL Endpoint ───────────────────────────────────────────────────────
app.use('/graphql', graphqlHTTP({
  schema,
  rootValue: root,
  graphiql: true, // Built-in GraphQL playground
}));

app.get('/', (req, res) => {
  res.json({ status: 'GraphQL Service running', endpoint: '/graphql' });
});

app.listen(PORT, () => {
  console.log(`GraphQL Service running on port ${PORT}`);
});
