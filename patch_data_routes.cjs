const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

if (!code.includes('datasetManager')) {
  code = code.replace(
    "import { browserService } from './server/browserService';",
    "import { datasetManager } from './server/data/dataset.js';\nimport { browserService } from './server/browserService';"
  );
  
  const insertPos = code.indexOf('// ==========================================');
  
  const dataRoutes = `
// ==========================================
// Data API Routes
// ==========================================
app.get('/api/data/accounts', requireAuth, (req, res) => {
  res.json({ accounts: datasetManager.accounts });
});

app.get('/api/data/issues', requireAuth, (req, res) => {
  res.json({ issues: datasetManager.issues });
});

app.get('/api/data/features', requireAuth, (req, res) => {
  res.json({ features: datasetManager.featureRequests });
});

app.get('/api/data/tasks', requireAuth, (req, res) => {
  res.json({ tasks: datasetManager.tasks });
});

app.get('/api/data/meetings', requireAuth, (req, res) => {
  res.json({ meetings: datasetManager.meetings });
});

app.get('/api/data/accounts/:name', requireAuth, (req, res) => {
  const account360 = datasetManager.getAccount360(decodeURIComponent(req.params.name));
  if (!account360) {
    res.status(404).json({ error: 'Account not found' });
    return;
  }
  res.json(account360);
});

`;
  code = code.substring(0, insertPos) + dataRoutes + code.substring(insertPos);
  fs.writeFileSync('server.ts', code);
  console.log('Added data routes');
}
