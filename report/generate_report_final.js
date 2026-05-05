const {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, WidthType, ShadingType,
  PageBreak, BorderStyle, LevelFormat, Header, Footer, PageNumber,
  ImageRun
} = require('docx');
const fs = require('fs');

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════
const BLUE   = '1E3A8A';
const WHITE  = 'FFFFFF';
const LTBLUE = 'EFF4FF';
const DARK   = '1F2937';
const CONTENT_W = 9000; // 12240 - left(1800) - right(1440)

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════
const empty   = () => new Paragraph({ children: [new TextRun('')] });
const pgBreak = () => new Paragraph({ children: [new PageBreak()] });

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, color: BLUE, size: 32, font: 'Arial' })]
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, bold: true, color: BLUE, size: 26, font: 'Arial' })]
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, color: DARK, size: 24, font: 'Arial' })]
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    spacing: { after: opts.after !== undefined ? opts.after : 140 },
    children: [new TextRun({
      text,
      bold:    opts.bold   || false,
      italics: opts.italic || false,
      size:    (opts.size  || 11) * 2,
      color:   opts.color  || DARK,
      font:    opts.mono   ? 'Courier New' : 'Arial',
    })]
  });
}

function bul(text, prefix) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 80 },
    children: prefix
      ? [new TextRun({ text: prefix, bold: true, size: 20, font: 'Arial', color: DARK }),
         new TextRun({ text,                     size: 20, font: 'Arial', color: DARK })]
      : [new TextRun({ text, size: 20, font: 'Arial', color: DARK })]
  });
}

// Visual placeholder box for a screenshot (bordered table cell)
function imgPlaceholder(num, label, location) {
  const bd = { style: BorderStyle.DASH_DOT, size: 6, color: '94A3B8' };
  const borders = { top: bd, bottom: bd, left: bd, right: bd };
  const cell = new TableCell({
    width: { size: CONTENT_W, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: 'F7F9FC' },
    margins: { top: 200, bottom: 200, left: 160, right: 160 },
    borders,
    children: [
      new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: '' })] }),
      new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: '' })] }),
      new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: '' })] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 0 },
        children: [new TextRun({ text: '[ Insert Screenshot Here ]', size: 22, color: 'B0B8C8', italics: true, font: 'Arial' })]
      }),
      new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: '' })] }),
      new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: '' })] }),
      new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: '' })] }),
    ]
  });
  return [
    new Paragraph({
      spacing: { before: 220, after: 60 },
      children: [
        new TextRun({ text: `${num}.  `, bold: true, size: 22, color: BLUE, font: 'Arial' }),
        new TextRun({ text: label,       bold: true, size: 22, color: DARK, font: 'Arial' }),
      ]
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: `Where to take it:  ${location}`, size: 18, color: '888888', italics: true, font: 'Arial' })]
    }),
    new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [CONTENT_W], rows: [new TableRow({ children: [cell] })] }),
    new Paragraph({ spacing: { after: 260 }, children: [new TextRun({ text: '' })] })
  ];
}

// Embed actual screenshot image with label
function imgEmbed(num, label, location, imgPath) {
  const imgData = fs.readFileSync(imgPath);
  const ext = imgPath.split('.').pop().toLowerCase();
  return [
    new Paragraph({
      spacing: { before: 220, after: 60 },
      children: [
        new TextRun({ text: `${num}.  `, bold: true, size: 22, color: BLUE, font: 'Arial' }),
        new TextRun({ text: label, bold: true, size: 22, color: DARK, font: 'Arial' }),
      ]
    }),
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: `Where: ${location}`, size: 18, color: '888888', italics: true, font: 'Arial' })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [new ImageRun({
        type: ext === 'jpg' ? 'jpeg' : ext,
        data: imgData,
        transformation: { width: 590, height: 370 },
        altText: { title: label, description: label, name: `screenshot-${num}` }
      })]
    })
  ];
}

// Splits on \n — each line becomes its own paragraph with code block styling
function code(text) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const isFirst = i === 0;
    const isLast  = i === lines.length - 1;
    const border  = {};
    if (isFirst)  border.top    = { style: BorderStyle.SINGLE, size: 1, color: 'AABBDD' };
    if (isLast)   border.bottom = { style: BorderStyle.SINGLE, size: 1, color: 'AABBDD' };
    border.left  = { style: BorderStyle.SINGLE, size: 8, color: BLUE };
    return new Paragraph({
      spacing: { after: 0, before: isFirst ? 80 : 0, line: 240 },
      shading: { type: ShadingType.CLEAR, fill: 'EEF2FF' },
      border,
      children: [new TextRun({
        text: line.length ? line : ' ',
        font: 'Courier New', size: 18, color: BLUE
      })]
    });
  });
}

function tbl(headers, rows, colWidths) {
  const total = colWidths.reduce((a, b) => a + b, 0);
  const bd = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
  const borders = { top: bd, bottom: bd, left: bd, right: bd };

  function mkCell(text, width, fill, bold, color) {
    return new TableCell({
      width: { size: width, type: WidthType.DXA },
      borders,
      shading: { type: ShadingType.CLEAR, fill },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({
        children: [new TextRun({ text, bold: bold || false, color: color || DARK, size: 20, font: 'Arial' })]
      })]
    });
  }

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => mkCell(h, colWidths[i], BLUE, true, WHITE))
  });

  const dataRows = rows.map((row, ri) =>
    new TableRow({
      children: row.map((cell, ci) => mkCell(cell, colWidths[ci], ri % 2 === 0 ? LTBLUE : WHITE, false, DARK))
    })
  );

  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows]
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// DOCUMENT CHILDREN
// ══════════════════════════════════════════════════════════════════════════════
const children = [];

// ─── COVER PAGE ───────────────────────────────────────────────────────────────
children.push(empty(), empty(), empty());
children.push(p('King Fahd University of Petroleum and Minerals (KFUPM)', { bold: true, center: true, size: 14, color: BLUE }));
children.push(p('College of Computing and Mathematics', { center: true, size: 12 }));
children.push(empty(), empty(), empty());
children.push(p('Cloud AI Application', { bold: true, center: true, size: 28, color: BLUE }));
children.push(empty());
children.push(p('COE 558: Cloud and Edge Computing — Section 01', { center: true, size: 13 }));
children.push(p('Term 252 — Spring 2026', { center: true, size: 12 }));
children.push(empty());
children.push(p('Instructor: Dr. Mohammad Al-Mohsin', { center: true, size: 12 }));
children.push(p('Submission Date: May 9, 2026', { center: true, size: 12 }));
children.push(empty(), empty());
children.push(tbl(['Student Name', 'Student ID'], [['Abdullah Saeed Almalki', '202419960']], [4500, 4500]));
children.push(pgBreak());

// ─── 1. PROJECT OVERVIEW ──────────────────────────────────────────────────────
children.push(h1('1. Project Overview'));
children.push(p(
  'This report documents a complete cloud-native web application developed individually for COE 558: ' +
  'Cloud and Edge Computing at KFUPM. The entire project is deployed on Google Cloud Platform (GCP) under ' +
  'project ID manifest-bit-494908-a5 in region us-central1. The application consists of three independent ' +
  'backend microservices — a Weather Service (S1), a Generative AI Service (S2), and a CRUD Service ' +
  '(S3) — unified behind a GCP API Gateway, with a single-page frontend application hosted on Cloud Run.'
));
children.push(p(
  'Users can check real-time global weather conditions, generate AI images from natural language prompts ' +
  'using Google Imagen 3 (Vertex AI), and manage a personal gallery of generated images. All services run ' +
  'on Cloud Run (serverless or containerized) requiring zero server management. Structured data is stored ' +
  'in Google Firestore and binary image files in Google Cloud Storage.'
));
children.push(p(
  'The project also fully implements all three extra credit requirements: (EC1) a GraphQL API service ' +
  'wrapping all three REST microservices, (EC2) an event-driven asynchronous pipeline using Google Cloud ' +
  'Pub/Sub, and (EC3) complete DevOps with Terraform infrastructure-as-code and Cloud Build CI/CD pipelines.'
));

// ─── 2. SYSTEM ARCHITECTURE ───────────────────────────────────────────────────
children.push(h1('2. System Architecture'));
children.push(p(
  'The application follows a microservices architecture. Each service is independently deployable and ' +
  'scalable on Cloud Run. All client traffic routes through the API Gateway, which handles HTTPS ' +
  'termination, CORS preflight, and upstream routing via OpenAPI 2.0 x-google-backend rules.'
));
children.push(empty());
children.push(tbl(
  ['Layer', 'Component', 'Technology', 'GCP Service'],
  [
    ['Client',   'Web Browser',         'HTML5 / CSS3 / JS + Leaflet.js',                'Browser'],
    ['Frontend', 'Frontend SPA',        'Nginx Alpine container',                         'Cloud Run'],
    ['Gateway',  'API Gateway',         'OpenAPI 2.0 + x-google-backend',                'GCP API Gateway'],
    ['Backend',  'S1 Weather Service',  'Node.js 22 + Functions Framework + Axios',       'Cloud Run Function'],
    ['Backend',  'S2 GenAI Service',    'Node.js 22 + @google/genai SDK',                 'Cloud Run Function'],
    ['Backend',  'S3 CRUD Service',     'Node.js 22 + Express.js',                        'Cloud Run Container'],
    ['Data',     'NoSQL Database',      'Firestore Native Mode',                          'Google Firestore'],
    ['Data',     'Object Storage',      'Bucket (uniform bucket-level access)',            'Cloud Storage'],
    ['AI',       'Image Generation',    'Imagen 3 (imagen-3.0-generate-001)',              'Vertex AI'],
  ],
  [1200, 2100, 3000, 2700]
));
children.push(empty());
children.push(h2('2.1 Request Flow (Image Generation)'));
children.push(bul('User types a prompt in the Frontend and clicks Generate'));
children.push(bul('Frontend sends POST /genai to API Gateway (cloud-ai-gateway-2aslucyl.uc.gateway.dev)'));
children.push(bul('Gateway routes request to S2 using x-google-backend (CONSTANT_ADDRESS)'));
children.push(bul('S2 calls Vertex AI Imagen 3 using Application Default Credentials (ADC)'));
children.push(bul('Imagen 3 returns base64 JPEG; S2 sends it back through Gateway to Frontend'));
children.push(bul('User clicks Save — Frontend sends POST /history → S3 CRUD Service'));
children.push(bul('S3 uploads image to Cloud Storage bucket and saves metadata to Firestore'));
children.push(bul('Frontend calls GET /history to refresh the image gallery'));
children.push(pgBreak());

// ─── 3. S1 WEATHER SERVICE ────────────────────────────────────────────────────
children.push(h1('3. S1 — Weather Service'));
children.push(p(
  'S1 is a serverless Cloud Run function that proxies requests between the frontend and the external ' +
  'WeatherAPI.com REST API. It accepts location input in three formats, queries WeatherAPI.com, and ' +
  'returns a clean, normalized JSON response. CORS headers are set on every response to allow ' +
  'cross-origin requests from the browser-based frontend.'
));
children.push(h2('3.1 Technical Details'));
children.push(tbl(
  ['Property', 'Value'],
  [
    ['Runtime',      'Node.js 22 — Cloud Run (serverless function via --function=weather)'],
    ['Framework',    '@google-cloud/functions-framework'],
    ['Dependencies', 'axios (HTTP client for external API calls)'],
    ['External API', 'WeatherAPI.com — api.weatherapi.com/v1/current.json'],
    ['CORS',         'Access-Control-Allow-Origin: * on all responses'],
    ['Deployed URL', 'https://weather-service-180225892893.us-central1.run.app'],
  ],
  [2500, 6500]
));
children.push(empty());
children.push(h2('3.2 API Reference'));
children.push(p('GET /weather', { bold: true }));
children.push(tbl(
  ['Query Parameter', 'Type', 'Description'],
  [
    ['city',     'string', 'City name — e.g. city=Riyadh'],
    ['lat + lon', 'number', 'Latitude and longitude — e.g. lat=24.7&lon=46.7'],
    ['ip',       'string', 'Value "auto" — detect location by client IP address'],
  ],
  [2000, 1500, 5500]
));
children.push(empty());
children.push(p('Sample Success Response (200 OK):', { bold: true }));
children.push(...code(
`{
  "location": {
    "name": "Riyadh",
    "country": "Saudi Arabia",
    "lat": 24.6408,
    "lon": 46.7728,
    "localtime": "2026-04-30 11:22"
  },
  "weather": {
    "temp_c": 30.4,
    "temp_f": 86.7,
    "feels_like_c": 29.0,
    "feels_like_f": 84.2,
    "condition": {
      "text": "Sunny",
      "code": 1000,
      "icon": "https://cdn.weatherapi.com/weather/64x64/day/113.png"
    },
    "humidity": 22,
    "wind_kph": 16.9,
    "wind_dir": "E",
    "is_day": 1
  }
}`));
children.push(empty());

// ─── 4. S2 GENAI SERVICE ──────────────────────────────────────────────────────
children.push(h1('4. S2 — GenAI Service'));
children.push(p(
  'S2 is a serverless Cloud Run function that integrates with Google Vertex AI to generate ' +
  'high-quality images from text prompts. It uses the Google Imagen 3 model ' +
  '(imagen-3.0-generate-001) — one of the most capable text-to-image models on Google Cloud. ' +
  'Authentication to Vertex AI is handled automatically via the Cloud Run service account ' +
  '(Application Default Credentials), which holds the Vertex AI User IAM role.'
));
children.push(h2('4.1 Technical Details'));
children.push(tbl(
  ['Property', 'Value'],
  [
    ['Runtime',      'Node.js 22 — Cloud Run (serverless function via --function=genai)'],
    ['Framework',    '@google-cloud/functions-framework'],
    ['AI Library',   '@google/genai SDK configured with { vertexai: true, project, location }'],
    ['AI Model',     'imagen-3.0-generate-001 via Vertex AI (generateImages API)'],
    ['GCP Project',  'manifest-bit-494908-a5 — us-central1'],
    ['Output',       'Base64-encoded JPEG image (mimeType: image/jpeg)'],
    ['Auth',         'Application Default Credentials (ADC) via Cloud Run service account'],
    ['Deployed URL', 'https://genai-service-180225892893.us-central1.run.app'],
  ],
  [2500, 6500]
));
children.push(empty());
children.push(h2('4.2 API Reference'));
children.push(p('POST /genai  —  Content-Type: application/json', { bold: true }));
children.push(p('Request Body:'));
children.push(...code('{\n  "prompt": "A futuristic city at night with glowing neon lights"\n}'));
children.push(empty());
children.push(p('Success Response (200 OK):'));
children.push(...code(
`{
  "prompt": "A futuristic city at night with glowing neon lights",
  "image": "/9j/4AAQSkZJRgABAQAAAQABAAD...(base64 JPEG data, ~200KB)",
  "mimeType": "image/jpeg",
  "model": "imagen-3.0-generate-001"
}`));
children.push(empty());
children.push(pgBreak());

// ─── 5. S3 CRUD SERVICE ───────────────────────────────────────────────────────
children.push(h1('5. S3 — CRUD Service'));
children.push(p(
  'S3 is a containerized Express.js REST API that manages the full lifecycle of AI-generated content. ' +
  'When saving a result, it decodes the base64 image, uploads it to Google Cloud Storage, and saves ' +
  'the metadata (prompt, model, image URL, timestamp) to a Firestore collection. When deleting a ' +
  'record, it removes both the Firestore document and the corresponding Cloud Storage object atomically. ' +
  'Uniform bucket-level access is enabled on the bucket, with public read granted via IAM (allUsers ' +
  'objectViewer) — allowing anyone to view saved images via their storage URL.'
));
children.push(h2('5.1 Technical Details'));
children.push(tbl(
  ['Property', 'Value'],
  [
    ['Runtime',      'Node.js 22 — Cloud Run (containerized service)'],
    ['Framework',    'Express.js'],
    ['Database',     'Google Firestore (Native Mode) — collection: genai-history'],
    ['Storage',      'Cloud Storage — bucket: manifest-bit-494908-a5-genai-images'],
    ['Libraries',    '@google-cloud/firestore, @google-cloud/storage, express, body-parser'],
    ['IAM Access',   'Uniform bucket-level access + allUsers roles/storage.objectViewer'],
    ['Deployed URL', 'https://crud-service-180225892893.us-central1.run.app'],
  ],
  [2500, 6500]
));
children.push(empty());
children.push(h2('5.2 Endpoints'));
children.push(tbl(
  ['Method', 'Endpoint', 'Description'],
  [
    ['POST',   '/api/history',     'Upload image to Cloud Storage + save metadata to Firestore (returns 201)'],
    ['GET',    '/api/history',     'Fetch all records sorted by createdAt descending (returns array)'],
    ['GET',    '/api/history/:id', 'Fetch one record by Firestore document ID (returns object)'],
    ['PUT',    '/api/history/:id', 'Update the prompt text of an existing record (returns updated object)'],
    ['DELETE', '/api/history/:id', 'Delete Firestore document AND Cloud Storage image file (returns 200)'],
  ],
  [1200, 2500, 5300]
));
children.push(empty());
children.push(h2('5.3 Firestore Document Schema'));
children.push(tbl(
  ['Field', 'Type', 'Description'],
  [
    ['id',        'string (doc ID)', 'Auto-generated Firestore document ID (e.g., DK4KVCDl5jm6SwmWN4kF)'],
    ['prompt',    'string',          'Original text prompt used for image generation'],
    ['model',     'string',          'AI model name: imagen-3.0-generate-001'],
    ['imageUrl',  'string',          'Public Cloud Storage URL to the uploaded JPEG file'],
    ['createdAt', 'timestamp',       'ISO 8601 creation timestamp (e.g., 2026-04-30T10:57:03.790Z)'],
  ],
  [2000, 1800, 5200]
));
children.push(empty());
children.push(h2('5.4 Sample Responses'));
children.push(p('POST /api/history — 201 Created:', { bold: true }));
children.push(...code(
`{
  "id": "DK4KVCDl5jm6SwmWN4kF",
  "prompt": "A beautiful sunset over mountains",
  "model": "imagen-3.0-generate-001",
  "imageUrl": "https://storage.googleapis.com/manifest-bit-494908-a5-genai-images/images/1746005823790.jpg",
  "createdAt": "2026-04-30T10:57:03.790Z"
}`));
children.push(empty());
children.push(p('DELETE /api/history/:id — 200 OK:', { bold: true }));
children.push(...code('{\n  "message": "Deleted successfully",\n  "id": "DK4KVCDl5jm6SwmWN4kF"\n}'));
children.push(empty());
children.push(pgBreak());

// ─── 6. FRONTEND ──────────────────────────────────────────────────────────────
children.push(h1('6. Frontend Web Application'));
children.push(p(
  'The frontend is a single-page application (SPA) built with vanilla HTML5, CSS3, and JavaScript. ' +
  'It is containerized using Nginx and deployed on Cloud Run listening on port 8080 (Cloud Run ' +
  'requirement). The application communicates exclusively with the API Gateway — never directly ' +
  'with individual backend services. All three core features are accessible from a single page ' +
  'organized into clearly defined sections.'
));
children.push(h2('6.1 Weather Section'));
children.push(bul('City search bar: type a city name and press Enter or click Search to fetch weather'));
children.push(bul('"My Location" button: uses browser Geolocation API for GPS-based weather'));
children.push(bul('Interactive Leaflet.js map: click any point on the world map to fetch weather for that coordinate'));
children.push(bul('Weather card: emoji condition icon, temperature with live °C/°F toggle, humidity, wind speed/direction, feels-like temperature'));
children.push(h2('6.2 AI Image Generation Section'));
children.push(bul('Text prompt input + Generate button calls POST /genai via API Gateway'));
children.push(bul('Loading spinner shown during the 10–20 second Imagen 3 generation process'));
children.push(bul('Generated image displayed immediately using a data:image/jpeg;base64 URL'));
children.push(bul('"Save to History" calls POST /history to store image + metadata via S3'));
children.push(h2('6.3 History Gallery Section'));
children.push(bul('Responsive grid of all saved AI-generated images loaded from Firestore (via GET /history)'));
children.push(bul('Each card shows: image from Cloud Storage URL, text prompt, and creation timestamp'));
children.push(bul('Delete button on each card calls DELETE /history/:id and refreshes the gallery'));
children.push(empty());
children.push(tbl(
  ['Property', 'Value'],
  [
    ['Container',    'nginx:alpine (FROM nginx:alpine)'],
    ['Port',         '8080 (listen 8080 in nginx.conf — required for Cloud Run)'],
    ['Map Library',  'Leaflet.js with OpenStreetMap tile provider'],
    ['Deployed URL', 'https://frontend-180225892893.us-central1.run.app'],
  ],
  [2500, 6500]
));
children.push(empty());

// ─── 7. API GATEWAY ───────────────────────────────────────────────────────────
children.push(h1('7. API Gateway'));
children.push(p(
  'The GCP API Gateway serves as the single unified HTTPS entry point for all client traffic. It is ' +
  'configured using an OpenAPI 2.0 Swagger specification (openapi.yaml) with x-google-backend extensions ' +
  'for backend routing. API config version 2 (cloud-ai-config-v2) added explicit OPTIONS method ' +
  'handlers for every route to resolve CORS preflight issues from the browser-based frontend.'
));
children.push(empty());
children.push(tbl(
  ['Gateway Route',   'Methods',                    'Backend Service', 'Purpose'],
  [
    ['/weather',      'GET, OPTIONS',                'S1 Weather Service', 'Fetch weather data by city/coordinates'],
    ['/genai',        'POST, OPTIONS',               'S2 GenAI Service',   'Generate AI image from text prompt'],
    ['/history',      'GET, POST, OPTIONS',          'S3 CRUD Service',    'List records or create a new record'],
    ['/history/{id}', 'GET, PUT, DELETE, OPTIONS',   'S3 CRUD Service',    'Read, update, or delete one record'],
  ],
  [1900, 2300, 2200, 2600]
));
children.push(empty());
children.push(tbl(
  ['Property', 'Value'],
  [
    ['Gateway Name', 'cloud-ai-gateway'],
    ['API Config',   'cloud-ai-config-v2 (Swagger 2.0 with CORS OPTIONS handlers)'],
    ['Routing',      'x-google-backend with path_translation: CONSTANT_ADDRESS'],
    ['Region',       'us-central1'],
    ['Gateway URL',  'https://cloud-ai-gateway-2aslucyl.uc.gateway.dev'],
  ],
  [2500, 6500]
));
children.push(pgBreak());

// ─── 8. SWAGGER UI ────────────────────────────────────────────────────────────
children.push(h1('8. API Documentation (Swagger UI)'));
children.push(p(
  'An interactive Swagger UI documentation site is deployed as a separate Nginx Cloud Run container. ' +
  'It uses SwaggerUIBundle with inline OpenAPI 3.0 specifications and organizes the three backend ' +
  'services into separate tabs: S1 Weather, S2 GenAI, and S3 CRUD. Users can read endpoint ' +
  'descriptions, inspect request/response schemas, and execute live API calls directly in the browser.'
));
children.push(tbl(
  ['Property', 'Value'],
  [
    ['Technology',   'SwaggerUIBundle with inline OpenAPI 3.0 specs per service'],
    ['Container',    'Nginx Alpine — same Docker pattern as the frontend'],
    ['Port',         '8080 (Cloud Run requirement)'],
    ['Deployed URL', 'https://swagger-ui-180225892893.us-central1.run.app'],
  ],
  [2500, 6500]
));
children.push(empty());

// ─── 9. EXTRA CREDIT 1: GRAPHQL ───────────────────────────────────────────────
children.push(h1('9. Extra Credit 1 — GraphQL API'));
children.push(p(
  'A dedicated GraphQL service was implemented using Express.js and the express-graphql middleware, ' +
  'deployed as a Cloud Run container. This service wraps all three REST microservices (S1, S2, S3) ' +
  'behind a single, typed GraphQL endpoint. Clients can request exactly the fields they need, combine ' +
  'multiple operations in a single HTTP request, and use mutations for all write operations. ' +
  'The GraphiQL browser IDE is enabled for interactive query development.'
));
children.push(h2('9.1 Technical Details'));
children.push(tbl(
  ['Property', 'Value'],
  [
    ['Framework',    'Express.js + express-graphql + graphql'],
    ['Runtime',      'Node.js 22 — Cloud Run Container'],
    ['GraphiQL',     'Enabled — interactive browser IDE at /graphql'],
    ['Backend',      'Proxies to S1 (weather-service), S2 (genai-service), S3 (crud-service) via axios'],
    ['Deployed URL', 'https://graphql-service-180225892893.us-central1.run.app/graphql'],
  ],
  [2500, 6500]
));
children.push(empty());
children.push(h2('9.2 GraphQL Schema'));
children.push(h3('Types'));
children.push(...code(
`type WeatherResult {
  location: String
  country: String
  temp_c: Float
  temp_f: Float
  condition: String
  humidity: Int
  wind_kph: Float
  is_day: Int
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
}`));
children.push(empty());
children.push(h3('Queries'));
children.push(tbl(
  ['Query', 'Arguments', 'Returns', 'Proxies To'],
  [
    ['weather',     'city: String!', 'WeatherResult',    'S1 — GET /weather?city=...'],
    ['history',     '(none)',        '[HistoryItem]',    'S3 — GET /api/history'],
    ['historyItem', 'id: String!',   'HistoryItem',      'S3 — GET /api/history/:id'],
  ],
  [1800, 1800, 2000, 3400]
));
children.push(empty());
children.push(h3('Mutations'));
children.push(tbl(
  ['Mutation', 'Key Arguments', 'Returns', 'Proxies To'],
  [
    ['generateImage',  'prompt: String!',                'GenAIResult',  'S2 — POST /genai'],
    ['saveHistory',    'prompt, image, mimeType, model', 'HistoryItem',  'S3 — POST /api/history'],
    ['updateHistory',  'id: String!, prompt: String!',   'HistoryItem',  'S3 — PUT /api/history/:id'],
    ['deleteHistory',  'id: String!',                    'String',       'S3 — DELETE /api/history/:id'],
  ],
  [2000, 2800, 1600, 2600]
));
children.push(empty());
children.push(h2('9.3 Sample Queries'));
children.push(...code(
`# Weather query
query {
  weather(city: "Riyadh") {
    temp_c
    condition
    humidity
  }
}

# Generate image mutation
mutation {
  generateImage(prompt: "A desert oasis at sunset") {
    image
    model
    mimeType
  }
}

# List all history
query {
  history {
    id
    prompt
    imageUrl
    createdAt
  }
}`));
children.push(empty());
children.push(pgBreak());

// ─── 10. EXTRA CREDIT 2: EVENT-DRIVEN ────────────────────────────────────────
children.push(h1('10. Extra Credit 2 — Event-Driven Architecture (Cloud Pub/Sub)'));
children.push(p(
  'An event-driven asynchronous image generation pipeline was implemented using Google Cloud Pub/Sub. ' +
  'The pipeline decouples the submission of a generation request from its execution, enabling clients ' +
  'to fire-and-forget the request and poll for results. This pattern is a core event-driven architecture ' +
  'pattern in cloud computing. Two dedicated services handle the pipeline: async-service (publisher) ' +
  'and worker-service (subscriber).'
));
children.push(h2('10.1 Architecture Flow'));
children.push(bul('Step 1:', 'Client sends POST /generate-async with a text prompt to async-service'));
children.push(bul('Step 2:', 'async-service generates a UUID requestId and publishes a Pub/Sub message to topic genai-requests'));
children.push(bul('Step 3:', 'async-service immediately returns HTTP 202 Accepted with the requestId (non-blocking)'));
children.push(bul('Step 4:', 'Cloud Pub/Sub delivers the push message to worker-service at POST /process'));
children.push(bul('Step 5:', 'worker-service calls S2 GenAI to generate the image, then calls S3 to save result to Firestore with the requestId'));
children.push(bul('Step 6:', 'Client polls GET /status/:requestId on async-service'));
children.push(bul('Step 7:', 'async-service queries Firestore by requestId and returns status "processing" or "completed" with full result'));
children.push(empty());
children.push(h2('10.2 Pub/Sub Resources'));
children.push(tbl(
  ['Resource', 'Name', 'Configuration'],
  [
    ['Topic',        'genai-requests',    'Standard Cloud Pub/Sub topic in project manifest-bit-494908-a5'],
    ['Subscription', 'genai-worker-push', 'Push subscription → https://worker-service-180225892893.us-central1.run.app/process'],
    ['Push Auth',    'OIDC Token',        'Compute Engine default service account used for push authentication'],
  ],
  [1800, 2700, 4500]
));
children.push(empty());
children.push(h2('10.3 Service API Reference'));
children.push(tbl(
  ['Service', 'Endpoint', 'Method', 'Function'],
  [
    ['async-service',  '/generate-async',   'POST', 'Accept prompt, publish to Pub/Sub, return requestId'],
    ['async-service',  '/status/:requestId', 'GET',  'Query Firestore for completion status'],
    ['worker-service', '/process',           'POST', 'Receive Pub/Sub push, call S2 + S3, persist result'],
  ],
  [2000, 2500, 900, 3600]
));
children.push(empty());
children.push(h2('10.4 Sample Async Request/Response'));
children.push(p('POST /generate-async — 202 Accepted (immediate):', { bold: true }));
children.push(...code('{\n  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",\n  "status": "processing"\n}'));
children.push(empty());
children.push(p('GET /status/a1b2c3d4-... — When completed:', { bold: true }));
children.push(...code(
`{
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "completed",
  "result": {
    "id": "XjK9mLpQ2wR4tNvB",
    "prompt": "A coral reef with tropical fish",
    "imageUrl": "https://storage.googleapis.com/manifest-bit-494908-a5-genai-images/images/17460123.jpg",
    "createdAt": "2026-04-30T12:03:45.000Z"
  }
}`));
children.push(empty());
children.push(pgBreak());

// ─── 11. EXTRA CREDIT 3: DEVOPS ───────────────────────────────────────────────
children.push(h1('11. Extra Credit 3 — DevOps: Terraform IaC + CI/CD (Cloud Build)'));
children.push(p(
  'All GCP infrastructure is defined and managed as code using Terraform (HashiCorp). A single ' +
  'terraform/main.tf file provisions every cloud resource required by the project declaratively. ' +
  'Additionally, each service directory contains a cloudbuild.yaml file that defines a Cloud Build ' +
  'CI/CD pipeline for automated deployment to Cloud Run on every push to the main GitHub branch.'
));
children.push(h2('11.1 Terraform Infrastructure as Code'));
children.push(p(
  'The terraform/main.tf file uses the hashicorp/google provider (version ~> 5.0) targeting project ' +
  'manifest-bit-494908-a5, region us-central1. It defines:'
));
children.push(tbl(
  ['Terraform Resource', 'GCP Resource Created', 'Purpose'],
  [
    ['google_project_service (x7)',   'API Enablement',                           'Enables: Cloud Run, Firestore, Storage, Pub/Sub, Vertex AI, API Gateway, Cloud Build'],
    ['google_storage_bucket',         'manifest-bit-494908-a5-genai-images',      'Image storage with uniform bucket-level access enabled'],
    ['google_storage_bucket_iam_member', 'IAM Policy (allUsers objectViewer)',    'Grants public read access to all stored images'],
    ['google_pubsub_topic',           'genai-requests',                           'Message queue topic for async image pipeline'],
    ['google_pubsub_subscription',    'genai-worker-push',                        'Push subscription routing messages to worker-service with OIDC auth'],
    ['google_project_iam_member (x4)', 'IAM Bindings on Compute SA',             'Vertex AI User + Datastore User + Storage Object Admin + Pub/Sub Publisher'],
  ],
  [2700, 2800, 3500]
));
children.push(empty());
children.push(h2('11.2 CI/CD Pipelines (Cloud Build)'));
children.push(tbl(
  ['Service', 'Config File', 'Cloud Build Command', 'Key Flags'],
  [
    ['S1 Weather',  'weather-service/cloudbuild.yaml',  'gcloud run deploy weather-service', '--function=weather --base-image=nodejs22'],
    ['S2 GenAI',    'genai-service/cloudbuild.yaml',    'gcloud run deploy genai-service',   '--function=genai --base-image=nodejs22'],
    ['S3 CRUD',     'crud-service/cloudbuild.yaml',     'gcloud run deploy crud-service',    '--source=. (container deploy)'],
    ['Frontend',    'frontend/cloudbuild.yaml',         'gcloud run deploy frontend',        '--source=. --port=8080'],
  ],
  [1500, 2700, 2500, 2300]
));
children.push(empty());
children.push(h2('11.3 Cloud Build Trigger Configuration'));
children.push(bul('Source:', 'GitHub repository — https://github.com/asash3-lang/coe558-cloud-ai-app'));
children.push(bul('Branch filter:', '^main$ (triggers on every push to main branch)'));
children.push(bul('Build config:', 'Path to each service\'s cloudbuild.yaml file'));
children.push(bul('Substitution:', '_PROJECT_ID=manifest-bit-494908-a5'));
children.push(bul('Logging:', 'CLOUD_LOGGING_ONLY (no GCS artifact storage required)'));
children.push(empty());
children.push(h2('11.4 Project Repository Structure'));
children.push(...code(
`coe558-cloud-ai-app/
├── weather-service/      # S1: index.js, package.json, cloudbuild.yaml
├── genai-service/        # S2: index.js, package.json, cloudbuild.yaml
├── crud-service/         # S3: index.js, package.json, Dockerfile, cloudbuild.yaml
├── frontend/             # SPA: index.html, Dockerfile, nginx.conf, cloudbuild.yaml
├── swagger-ui/           # API docs: index.html, Dockerfile, nginx.conf
├── api-gateway/          # openapi.yaml (OpenAPI 2.0 API Gateway spec)
├── graphql-service/      # EC1: index.js, package.json
├── async-service/        # EC2: index.js, package.json
├── worker-service/       # EC2: index.js, package.json
├── terraform/            # EC3: main.tf (all GCP resources)
├── postman/              # COE558-Cloud-AI-App.postman_collection.json
├── report/               # Project_Report_COE558_Final.docx
└── .gitignore`));
children.push(empty());
children.push(pgBreak());

// ─── 12. CLOUD RESOURCES ──────────────────────────────────────────────────────
children.push(h1('12. Cloud Resources Summary'));
children.push(tbl(
  ['GCP Service', 'Resource Name', 'Purpose'],
  [
    ['Cloud Run',     'weather-service',                      'S1 — Weather serverless function'],
    ['Cloud Run',     'genai-service',                        'S2 — GenAI image generation function'],
    ['Cloud Run',     'crud-service',                         'S3 — CRUD history REST API'],
    ['Cloud Run',     'frontend',                             'Frontend Nginx SPA container'],
    ['Cloud Run',     'swagger-ui',                           'Interactive API documentation'],
    ['Cloud Run',     'graphql-service',                      'EC1 — GraphQL API service'],
    ['Cloud Run',     'async-service',                        'EC2 — Async Pub/Sub publisher + status poller'],
    ['Cloud Run',     'worker-service',                       'EC2 — Pub/Sub push subscriber'],
    ['API Gateway',   'cloud-ai-gateway',                     'Unified HTTPS API entry point'],
    ['Firestore',     'genai-history (collection)',            'NoSQL document storage for image metadata'],
    ['Cloud Storage', 'manifest-bit-494908-a5-genai-images',  'Binary storage for AI-generated JPEG files'],
    ['Vertex AI',     'imagen-3.0-generate-001',              'Text-to-image AI model (Imagen 3)'],
    ['Cloud Pub/Sub', 'genai-requests',                       'Message queue topic for async generation'],
    ['Cloud Pub/Sub', 'genai-worker-push',                    'Push subscription delivering to worker-service'],
    ['Cloud Build',   '4 triggers',                           'CI/CD for weather, genai, crud, frontend'],
    ['GCP Project',   'manifest-bit-494908-a5',               'All resources in us-central1'],
  ],
  [2000, 3500, 3500]
));
children.push(empty());

// ─── 13. EXTERNAL APIS ────────────────────────────────────────────────────────
children.push(h1('13. External APIs and Libraries'));
children.push(tbl(
  ['API / Library', 'Provider', 'Purpose in Project'],
  [
    ['WeatherAPI.com',         'weatherapi.com',   'Real-time weather data source for S1 Weather Service'],
    ['Imagen 3 (Vertex AI)',   'Google Cloud',     'Text-to-image AI generation for S2 GenAI Service'],
    ['Leaflet.js',             'leafletjs.com',    'Interactive world map widget in the frontend'],
    ['OpenStreetMap',          'openstreetmap.org','Map tile provider for Leaflet map'],
    ['SwaggerUIBundle',        'swagger.io',       'API documentation rendering in Swagger UI container'],
    ['@google/genai SDK',      'Google',           'Vertex AI client library for S2 (imagen API)'],
    ['@google-cloud/pubsub',   'Google Cloud',     'Pub/Sub client for async-service (EC2 publisher)'],
    ['@google-cloud/firestore','Google Cloud',     'Firestore client for S3 CRUD and async-service'],
    ['@google-cloud/storage',  'Google Cloud',     'Cloud Storage client for S3 CRUD'],
    ['express-graphql',        'npm',              'GraphQL HTTP middleware for EC1 GraphQL service'],
    ['Functions Framework',    'Google Cloud',     'Serverless function handler for S1 and S2'],
  ],
  [2800, 2200, 4000]
));
children.push(pgBreak());

// ─── 14. APPLICATION URLS ─────────────────────────────────────────────────────
children.push(h1('14. Application URLs'));
children.push(tbl(
  ['Component', 'Deployed URL'],
  [
    ['Frontend (Main Application)',      'https://frontend-180225892893.us-central1.run.app'],
    ['API Gateway (Unified Entry Point)', 'https://cloud-ai-gateway-2aslucyl.uc.gateway.dev'],
    ['Swagger UI (API Documentation)',   'https://swagger-ui-180225892893.us-central1.run.app'],
    ['S1 — Weather Service',        'https://weather-service-180225892893.us-central1.run.app'],
    ['S2 — GenAI Service',          'https://genai-service-180225892893.us-central1.run.app'],
    ['S3 — CRUD Service',           'https://crud-service-180225892893.us-central1.run.app'],
    ['EC1 — GraphQL Service',       'https://graphql-service-180225892893.us-central1.run.app/graphql'],
    ['EC2 — Async Service',         'https://async-service-180225892893.us-central1.run.app'],
    ['EC2 — Worker Service',        'https://worker-service-180225892893.us-central1.run.app'],
    ['GitHub Repository',               'https://github.com/asash3-lang/coe558-cloud-ai-app'],
    ['Demo Recording',                  'https://drive.google.com/file/d/1wY5cBikgvICOAo52dJQFpbQYekBTbvYL/view?usp=sharing'],
  ],
  [3200, 5800]
));
children.push(empty());

// ─── 15. CHALLENGES & SOLUTIONS ───────────────────────────────────────────────
children.push(h1('15. Challenges and Solutions'));
children.push(tbl(
  ['Challenge', 'Root Cause', 'Solution Applied'],
  [
    [
      'Gemini API credits exhausted (HTTP 429 RESOURCE_EXHAUSTED)',
      'Standalone Gemini API key (AIzaSy...) ran out of free-tier quota',
      'Switched to Vertex AI backend: @google/genai SDK with { vertexai: true, project, location } — uses GCP project billing instead of API key credits'
    ],
    [
      'Image generation model not found (HTTP 404)',
      'gemini-2.0-flash-*-image-generation models are not available in Vertex AI catalog',
      'Used imagen-3.0-generate-001 with generateImages() API — Imagen 3 is the correct model for Vertex AI image generation'
    ],
    [
      'Cloud Storage upload error: "Cannot insert legacy ACL when uniform bucket-level access is enabled"',
      'Attempted to set public: true per-object ACL on a uniform-access bucket',
      'Removed public:true from file.save() call. Public access is granted at bucket level via IAM (allUsers roles/storage.objectViewer), not per object'
    ],
    [
      'CORS error in browser when calling API Gateway endpoints',
      'API Gateway had no OPTIONS method handlers; browser preflight requests were rejected with 405',
      'Added explicit OPTIONS method handler for every route in the OpenAPI spec (cloud-ai-config-v2) returning the required CORS headers'
    ],
    [
      'Frontend Nginx container failed to start on Cloud Run',
      'Default Dockerfile exposed port 80; Cloud Run only allows port 8080 by default',
      'Created a custom nginx.conf with listen 8080 and copied it into the Docker image. Added --port=8080 to Cloud Run deploy command'
    ],
  ],
  [2500, 2500, 4000]
));
children.push(pgBreak());

// ─── 16. SCREENSHOTS ──────────────────────────────────────────────────────────
const SS = 'C:\\Users\\user\\Desktop\\project\\screenshot\\';

children.push(h1('16. Screenshots'));
children.push(empty());

children.push(...imgEmbed(1,  'Cloud Run — All 8 services showing Status: Active',
  'GCP Console → Cloud Run',
  SS + 'cloudrun.png'));
children.push(...imgEmbed(2,  'API Gateway — cloud-ai-gateway Active with the gateway URL',
  'GCP Console → API Gateway → Gateways',
  SS + 'gateways.png'));
children.push(...imgEmbed(3,  'Firestore — genai-history collection with sample documents',
  'GCP Console → Firestore → Data',
  SS + 'firestore.png'));
children.push(...imgEmbed(4,  'Cloud Storage — bucket with uploaded JPEG image files',
  'GCP Console → Cloud Storage',
  SS + 'cloudstorge.png'));
children.push(...imgEmbed(5,  'Vertex AI — API enabled confirmation',
  'GCP Console → APIs & Services → Enabled APIs',
  SS + 'vertex.png'));
children.push(...imgEmbed(6,  'Pub/Sub — genai-requests topic and genai-worker-push subscription',
  'GCP Console → Pub/Sub',
  SS + 'pup-sub.png'));
children.push(...imgEmbed(7,  'Frontend — Weather section showing weather for a city',
  'Browser → Frontend App',
  SS + 'frontend weather.png'));
children.push(...imgEmbed(8,  'Frontend — AI image generation with prompt and result',
  'Browser → Frontend App → Generate Image',
  SS + 'image frontend .png'));
children.push(...imgEmbed(9,  'Frontend — History gallery with saved AI images',
  'Browser → Frontend App → History',
  SS + 's3 history.png'));
children.push(...imgEmbed(10, 'Swagger UI — API documentation all three services',
  'Browser → Swagger UI',
  SS + 'swagger ui.png'));
children.push(...imgEmbed(11, 'GraphiQL — Running a weather query in the browser IDE',
  'Browser → GraphQL Service /graphql',
  SS + 'graphsql.png'));
children.push(...imgEmbed(12, 'Postman — Requests to all 3 services with sample responses',
  'Postman Application',
  SS + 'postman.png'));
children.push(...imgEmbed(13, 'Cloud Build — 4 CI/CD triggers configured for GitHub',
  'GCP Console → Cloud Build → Triggers',
  SS + 'cloudbuildtrigger.png'));
children.push(...imgEmbed(14, 'Terraform — terraform/main.tf showing all GCP resources',
  'VS Code → terraform/main.tf',
  SS + 'terraform.png'));
children.push(empty());

// ─── 17. DEMO RECORDING ───────────────────────────────────────────────────────
children.push(h1('17. Demo Recording'));
children.push(p('https://drive.google.com/file/d/1wY5cBikgvICOAo52dJQFpbQYekBTbvYL/view?usp=sharing', { bold: true, color: BLUE, size: 13 }));
children.push(empty());
children.push(p('The demo recording follows this structure:'));
children.push(tbl(
  ['Step', 'Section', 'What to Show'],
  [
    ['1', 'GCP Infrastructure',        'Cloud Run services, API Gateway, Firestore collection, Cloud Storage bucket, Pub/Sub topic and subscription'],
    ['2', 'Code Walkthrough',          'weather-service/index.js, genai-service/index.js, crud-service/index.js, terraform/main.tf, one cloudbuild.yaml'],
    ['3', 'Weather Feature',           'Search a city by name, click My Location, click on the map — show weather card'],
    ['4', 'GenAI Feature',             'Enter a prompt, click Generate, wait for Imagen 3 result, click Save to History'],
    ['5', 'History Feature',           'Show gallery, delete a record, refresh to confirm deletion in Firestore'],
    ['6', 'Swagger UI',                'Navigate to Swagger UI, execute a live request against S1 GET /weather and S2 POST /genai'],
    ['7', 'Postman Collection',        'Run the COE558-Cloud-AI-App collection — show all 10 saved requests with responses'],
    ['8', 'EC1: GraphQL',              'Open GraphiQL at /graphql, run a weather query and a generateImage mutation'],
    ['9', 'EC2: Pub/Sub Pipeline',     'POST to /generate-async, show the 202 response with requestId, poll /status/:id until completed'],
    ['10', 'EC3: Terraform + CI/CD',   'Show terraform/main.tf resource definitions, show Cloud Build triggers in GCP Console'],
  ],
  [500, 2200, 6300]
));

// ══════════════════════════════════════════════════════════════════════════════
// BUILD DOCUMENT
// ══════════════════════════════════════════════════════════════════════════════
const doc = new Document({
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [{
        level: 0,
        format: LevelFormat.BULLET,
        text: '•',
        alignment: AlignmentType.LEFT,
        style: {
          paragraph: { indent: { left: 720, hanging: 360 } }
        }
      }]
    }]
  },
  styles: {
    default: {
      document: { run: { font: 'Arial', size: 22, color: DARK } }
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, color: BLUE, font: 'Arial' },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 }
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, color: BLUE, font: 'Arial' },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 }
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, color: DARK, font: 'Arial' },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 }
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, bottom: 1440, left: 1800, right: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 1 } },
          spacing: { after: 120 },
          children: [new TextRun({
            text: 'COE 558 — Cloud and Edge Computing — Abdullah Saeed Almalki — Term 252',
            size: 18, color: '888888', font: 'Arial'
          })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 1 } },
          spacing: { before: 80 },
          children: [
            new TextRun({ text: 'Page ', size: 18, color: '888888', font: 'Arial' }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '888888', font: 'Arial' }),
            new TextRun({ text: ' of ', size: 18, color: '888888', font: 'Arial' }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '888888', font: 'Arial' }),
          ]
        })]
      })
    },
    children
  }]
});

Packer.toBuffer(doc)
  .then(buffer => {
    const out = 'C:\\Users\\user\\Desktop\\project\\report\\Project_Report_COE558_Final.docx';
    fs.writeFileSync(out, buffer);
    console.log('Report saved to:', out);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
