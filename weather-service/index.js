const functions = require('@google-cloud/functions-framework');
const axios = require('axios');

const WEATHER_API_KEY = '4d605a9337f647cdb2f81737263004';
const WEATHER_API_BASE = 'https://api.weatherapi.com/v1';

functions.http('weather', async (req, res) => {
  // Allow CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Only GET method is allowed' });
    return;
  }

  // Accept ?city=Riyadh or ?lat=24.7&lon=46.7 or ?ip=auto
  const { city, lat, lon, ip } = req.query;

  let location;
  if (city) {
    location = city;
  } else if (lat && lon) {
    location = `${lat},${lon}`;
  } else if (ip) {
    location = 'auto:ip';
  } else {
    location = 'auto:ip'; // default: detect by IP
  }

  try {
    const response = await axios.get(`${WEATHER_API_BASE}/current.json`, {
      params: {
        key: WEATHER_API_KEY,
        q: location,
        aqi: 'no'
      }
    });

    const data = response.data;

    const result = {
      location: {
        name: data.location.name,
        region: data.location.region,
        country: data.location.country,
        lat: data.location.lat,
        lon: data.location.lon,
        localtime: data.location.localtime
      },
      weather: {
        temp_c: data.current.temp_c,
        temp_f: data.current.temp_f,
        feels_like_c: data.current.feelslike_c,
        feels_like_f: data.current.feelslike_f,
        condition: {
          text: data.current.condition.text,
          icon: 'https:' + data.current.condition.icon,
          code: data.current.condition.code
        },
        humidity: data.current.humidity,
        wind_kph: data.current.wind_kph,
        wind_dir: data.current.wind_dir,
        is_day: data.current.is_day
      }
    };

    res.status(200).json(result);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({
        error: error.response.data.error?.message || 'Weather API error'
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});
