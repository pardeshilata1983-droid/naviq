const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf-8');

if (!code.includes('import { processCustomerQuery }')) {
  code = code.replace(
    "import { v4 as uuidv4 } from 'uuid';",
    "import { v4 as uuidv4 } from 'uuid';\nimport { processCustomerQuery } from './server/customerAgent.js';"
  );
  fs.writeFileSync('server.ts', code);
  console.log('Fixed server.ts imports');
}
