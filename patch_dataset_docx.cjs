const fs = require('fs');
let code = fs.readFileSync('server/datasetUpload.ts', 'utf-8');

if (!code.includes('import mammoth from')) {
  code = code.replace(
    "import { v4 as uuidv4 } from 'uuid';",
    "import { v4 as uuidv4 } from 'uuid';\n// @ts-ignore\nimport mammoth from 'mammoth';"
  );
}

const target = `      } else if (fileExt === '.txt' || fileExt === '.md') {`;
const replacement = `      } else if (fileExt === '.docx') {
        const result = await mammoth.extractRawText({ buffer });
        content = result.value;
        records = 1;
      } else if (fileExt === '.txt' || fileExt === '.md') {`;

if (!code.includes(fileExt === '.docx')) {
  code = code.replace(target, replacement);
}

fs.writeFileSync('server/datasetUpload.ts', code);
