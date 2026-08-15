const fs = require('fs');
let code = fs.readFileSync('src/services/api.ts', 'utf8');

if (!code.includes('uploadDataset')) {
  const uploadMethod = `
  async uploadDataset(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await authFetch(\`\${API_BASE}/datasets/upload\`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
       const err = await res.json();
       throw new Error(err.error || 'Failed to upload dataset');
    }
    return res.json();
  },
`;
  code = code.replace("async sendMessage(message: string", uploadMethod + "\n  async sendMessage(message: string");
  fs.writeFileSync('src/services/api.ts', code);
}
