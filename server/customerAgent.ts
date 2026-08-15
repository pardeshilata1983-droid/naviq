import { GoogleGenAI, Type } from '@google/genai';
import { datasetManager } from './data/dataset';
import { ChatMessage } from '../src/types';
import { customDatasets, searchDataset, getDatasetOverview } from './datasetUpload';

let _ai: GoogleGenAI | null = null;
function getAI() {
  if (!_ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('AI_SERVICE_UNCONFIGURED');
    }
    _ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return _ai;
}

export async function processCustomerQuery(
  query: string,
  history: ChatMessage[],
  context?: any,
  onLog?: (log: string) => void,
  onChunk?: (chunk: string) => void
) {
  const datasetId = context?.datasetId;
  const isCustomDataset = datasetId && customDatasets.has(datasetId);
  const customDataset = isCustomDataset ? customDatasets.get(datasetId) : null;

  let dynamicSystemPrompt = `You are Naviq, an intelligent AI agent for Customer Success and Solutions Engineering teams. Your goal is to navigate every customer conversation.

You have access to provided datasets (which could be the hackathon defaults or user-uploaded company data).
When a user asks a question, use the tools provided to query this data.
Never invent data. If the data does not exist, say you couldn't find it in the provided customer data.
Identify risks, opportunities, and recommend actions based on the data.
When providing AI inference or recommendations, label it as "AI INSIGHT" or "AI RECOMMENDATION" and explain the reasoning based on the data.
When asked to prepare for a meeting or a 360 view, provide a MEETING BRIEF covering: CUSTOMER HEALTH, ARR, OWNER, WHAT'S HAPPENING, ATTENTION REQUIRED (Issues), CUSTOMER REQUESTS (Feature Requests), OPEN WORK (Tasks), MEETING CONTEXT, RISKS, RECOMMENDED NEXT ACTIONS.
CRITICAL: Return responses formatted in Markdown. For lists and structured data, use clear headings, tables, and bullet points.`;

  if (customDataset) {
    dynamicSystemPrompt += `\n\n[UPLOADED CUSTOM COMPANY DATA ACTIVE]:
Dataset Name: "${customDataset.name}"
Total Files: ${customDataset.files.length}
Total Records: ${customDataset.totalRecords}
Summary of Uploaded Files:
${customDataset.summary || ''}

When answering queries, prioritize the search_company_data and get_dataset_summary tools to extract insights from this uploaded data!`;
  }

  const log = (msg: string) => {
    activityLog.push(msg);
    if (onLog) onLog(msg);
  };

  let activityLog: string[] = [];
  let actionResult: any = null;

  let ai: GoogleGenAI;
  try {
    ai = getAI();
  } catch (err: any) {
    // If API key is not configured, give a clear explanation
    return {
      reply: `⚠️ **Gemini API Key Required**: Please configure your \`GEMINI_API_KEY\` in your environment or Settings to enable real-time AI reasoning over your company datasets.`,
      activityLog: ['AI Service Not Configured'],
      actionResult: null,
    };
  }

  try {
    const chat = ai.chats.create({
      model: 'gemini-3.7-flash',
      config: {
        systemInstruction: dynamicSystemPrompt,
        tools: [
          {
            functionDeclarations: [
              {
                name: 'search_company_data',
                description: 'Searches across all uploaded company files for a keyword, account name, customer ticket, or snippet. ALWAYS use this when answering questions about user-uploaded files.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    query: {
                      type: Type.STRING,
                      description: 'The search query or keyword to search across the uploaded documents and spreadsheets.'
                    }
                  },
                  required: ['query']
                }
              },
              {
                name: 'get_dataset_summary',
                description: 'Returns the high-level schema, list of files, sheet names, and record counts for the currently uploaded dataset.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {},
                  required: []
                }
              },
              {
                name: 'search_dataset',
                description: 'Searches across default demo datasets (Accounts, Issues, Feature Requests, Tasks, Meetings) for a query string.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    query: {
                      type: Type.STRING,
                      description: 'The search term (e.g. customer name, keyword).'
                    }
                  },
                  required: ['query']
                }
              },
              {
                name: 'get_account_360',
                description: 'Gets a full 360 view of a specific account in the default demo dataset.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    accountName: {
                      type: Type.STRING,
                      description: 'The exact or partial name of the account (e.g. Meridian AgriTech).'
                    }
                  },
                  required: ['accountName']
                }
              },
              {
                name: 'get_all_at_risk_accounts',
                description: 'Returns a list of all accounts that are currently marked as "At Risk" in the default demo dataset.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {},
                  required: []
                }
              },
              {
                name: 'get_high_impact_features',
                description: 'Returns feature requests sorted by estimated revenue impact or mentions in the default demo dataset.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {},
                  required: []
                }
              }
            ]
          }
        ]
      }
    });

    const response = await chat.sendMessage({ message: query });
    
    let finalMessage = response.text || '';
    let toolCalls = response.functionCalls;

    while (toolCalls && toolCalls.length > 0) {
      const functionResponses = [];

      for (const call of toolCalls) {
        let result: any = {};
        
        if (call.name === 'search_company_data') {
          const q = (call.args as any).query;
          log(`✓ Searching uploaded company data for "${q}"`);
          if (isCustomDataset) {
            const res = searchDataset(datasetId, q);
            result = res;
            actionResult = { type: 'search_results', data: result };
          } else {
            result = { error: 'No custom company dataset active. Using default datasets instead.' };
          }
        } else if (call.name === 'get_dataset_summary') {
          log(`✓ Inspecting uploaded files schema and record indices`);
          if (isCustomDataset) {
            result = getDatasetOverview(datasetId) || { error: 'Dataset not found' };
            actionResult = { type: 'dataset_summary', data: result };
          } else {
            result = { error: 'No custom dataset currently loaded.' };
          }
        } else if (call.name === 'search_dataset') {
          const q = (call.args as any).query;
          log(`✓ Searching demo dataset for "${q}"`);
          result = datasetManager.search(q);
          actionResult = { type: 'search_results', data: result };
        } else if (call.name === 'get_account_360') {
          const acc = (call.args as any).accountName;
          log(`✓ Found account: ${acc}`);
          log(`✓ Retrieving account telemetry`);
          log(`✓ Retrieving open issues & tickets`);
          log(`✓ Retrieving feature requests`);
          log(`✓ Retrieving pending tasks`);
          log(`✓ Cross-referencing action items`);
          result = datasetManager.getAccount360(acc) || { error: 'Account not found' };
          if (!result.error) {
            actionResult = { type: 'customer_360', data: result };
          }
        } else if (call.name === 'get_all_at_risk_accounts') {
          log(`✓ Finding at-risk accounts`);
          result = datasetManager.accounts.filter((a: any) => a.health === 'At Risk');
          actionResult = { type: 'at_risk_accounts', data: result };
        } else if (call.name === 'get_high_impact_features') {
          log(`✓ Analyzing feature requests for revenue impact`);
          result = [...datasetManager.featureRequests].sort((a: any, b: any) => b.estimatedRevenueImpact - a.estimatedRevenueImpact);
          actionResult = { type: 'feature_opportunities', data: result };
        }

        // The Gemini protobuf FunctionResponse.response field requires a Struct (JSON Object), NOT a top-level Array.
        const safeResponseObject =
          typeof result === 'object' && result !== null && !Array.isArray(result)
            ? result
            : { results: result };

        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: safeResponseObject,
          },
        });
      }

      const nextResponse = await chat.sendMessage({
        message: functionResponses,
      });
      
      finalMessage = nextResponse.text || '';
      toolCalls = nextResponse.functionCalls;
    }
    
    if (activityLog.length === 0) {
      log(`✓ Understood request`);
      log(`✓ Analyzed company context`);
    }
    
    log(`● Prepared response`);

    // Stream out chunks smoothly to client
    if (onChunk && finalMessage) {
      const words = finalMessage.split(' ');
      for (const word of words) {
        onChunk(word + ' ');
        await new Promise(r => setTimeout(r, 8));
      }
    }

    return {
      reply: finalMessage,
      activityLog,
      actionResult
    };
  } catch (err: any) {
    console.error('Gemini query execution error:', err);
    throw err;
  }
}
