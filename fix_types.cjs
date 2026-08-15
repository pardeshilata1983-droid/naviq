const fs = require('fs');

let code = fs.readFileSync('src/types.ts', 'utf-8');

// The replacement was: s/activityLog?: string\[\];/activityLog?: string[];\n  actionResult?: any;/g
// Since activityLog occurs twice (in ChatMessage and Conversation), it added actionResult twice to ChatMessage and Conversation. But ChatResponse ALREADY had actionResult?
// Let's just restore src/types.ts from a clean state or manually fix it.
// Actually, I can just replace all occurrences of `actionResult?: any;` and add it back once to ChatMessage and Conversation.

code = code.replace(/actionResult\?: any;/g, '');

// Now add it to ChatMessage
code = code.replace(
  'export interface ChatMessage {\n  id: string;',
  'export interface ChatMessage {\n  id: string;\n  actionResult?: any;'
);

// Add it to Conversation
code = code.replace(
  'export interface Conversation {\n  id: string;',
  'export interface Conversation {\n  id: string;\n  actionResult?: any;'
);

// Add it to ChatResponse
code = code.replace(
  'export interface ChatResponse {\n  type: \'conversation\'',
  'export interface ChatResponse {\n  actionResult?: any;\n  type: \'conversation\''
);

fs.writeFileSync('src/types.ts', code);
console.log('Fixed types.ts');
