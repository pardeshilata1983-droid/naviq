const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('import multer')) {
  code = code.replace("import express from 'express';", "import express from 'express';\nimport multer from 'multer';\nimport { processUpload, customDatasets } from './server/datasetUpload.js';");
}

if (!code.includes('const upload = multer')) {
  code = code.replace("const app = express();", "const app = express();\nconst upload = multer({ dest: 'uploads/' });");
}

if (!code.includes('app.post(\'/api/datasets/upload\'')) {
  const uploadEndpoint = `
// POST /api/datasets/upload
app.post('/api/datasets/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const store = (req as any).userStore;
    const dataset = await processUpload(req.file, store.id);
    res.json({ success: true, dataset });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/datasets
app.get('/api/datasets', requireAuth, (req, res) => {
  const store = (req as any).userStore;
  const datasets = Array.from(customDatasets.values()).filter(d => d.ownerId === store.id);
  res.json({ datasets });
});
`;
  code = code.replace("// GET /api/conversations/:id", uploadEndpoint + "\n// GET /api/conversations/:id");
}

fs.writeFileSync('server.ts', code);
