const fs = require('fs');
let code = fs.readFileSync('server/customerAgent.ts', 'utf-8');

code = code.replace("import { GoogleGenAI } from '@google/genai';", "import { GoogleGenAI, Type } from '@google/genai';");

code = code.replace(/'OBJECT'/g, "Type.OBJECT");
code = code.replace(/'STRING'/g, "Type.STRING");

fs.writeFileSync('server/customerAgent.ts', code);
console.log('Fixed customerAgent.ts');
