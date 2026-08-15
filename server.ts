import { processCustomerQuery } from "./server/customerAgent";
import express from 'express';
import multer from 'multer';
import * as fs from 'fs';
import { processUpload, customDatasets } from './server/datasetUpload';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { datasetManager } from './server/data/dataset';
import { browserService } from './server/browserService';
import { browserToolRegistry } from './server/browserToolRegistry';
import { NavigationEngine } from './server/navigationEngine';
import {
  FixMission,
  ActivityItem,
  NotificationItem,
  Connection,
  VaultDocument,
  MemoryItem,
  AgentPermission,
  ChatMessage,
  ChatResponse,
  MessageIntent,
  Conversation,
  UserProfile,
  AuthResponse,
  NavigationSession,
  NavigationMode,
} from './src/types';

dotenv.config();

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
}

const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = 3000;

export const navigationEngine = new NavigationEngine(browserService);

app.use(express.json());

// Lazy-initialized Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// -------------------------------------------------------------
// Per-User In-Memory Stateful Data Engine
// -------------------------------------------------------------
export interface UserDataStore {
  user: UserProfile;
  tasks: FixMission[];
  conversations: Conversation[];
  chatHistory: ChatMessage[];
  activityLog: ActivityItem[];
  notifications: NotificationItem[];
  connections: Connection[];
  vaultDocuments: VaultDocument[];
  memoryItems: MemoryItem[];
  agentPermissions: AgentPermission[];
}

const userStores = new Map<string, UserDataStore>();
const activeSessions = new Map<string, { userId: string; createdAt: number }>();

function createInitialUserData(user: UserProfile): UserDataStore {
  return {
    user,
    tasks: [],
    conversations: [],
    chatHistory: [
      {
        id: 'msg-init',
        sender: 'assistant',
        text: "Hi! I'm Naviq. Tell me what you'd like me to get done.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: 'conversation',
      },
    ],
    activityLog: [
      {
        id: `act-engine-init-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dayGroup: 'Today',
        title: 'Naviq Agent Engine active',
        description: 'Hardware security enclave & autonomous browser worker initialized for account.',
        type: 'investigation',
      },
    ],
    notifications: [],
    connections: [
      {
        id: 'conn-gmail',
        name: 'Gmail',
        iconName: 'Mail',
        category: 'Communication',
        status: 'connected',
        description: 'Allows Naviq to locate order receipts, invoices, and merchant communications.',
        lastSynced: 'Live Sync',
      },
      {
        id: 'conn-calendar',
        name: 'Google Calendar',
        iconName: 'Calendar',
        category: 'System',
        status: 'connected',
        description: 'Allows Naviq to verify booking schedules and appointment conflicts.',
        lastSynced: 'Live Sync',
      },
      {
        id: 'conn-browser',
        name: 'Browser Agent (Playwright / DOM)',
        iconName: 'Globe',
        category: 'System',
        status: 'connected',
        isBrowserAgent: true,
        description: 'Autonomous secure browser worker for navigating merchant websites and portals.',
        lastSynced: 'Active Worker',
      },
      {
        id: 'conn-drive',
        name: 'Google Drive / Storage',
        iconName: 'HardDrive',
        category: 'System',
        status: 'connected',
        description: 'Access authorized invoices and warranties in your personal drive.',
        lastSynced: 'Connected',
      },
      {
        id: 'conn-amazon',
        name: 'Amazon India',
        iconName: 'ShoppingBag',
        category: 'Shopping & Travel',
        status: 'connected',
        description: 'Retrieve order tracking and return statuses.',
        lastSynced: 'Connected',
      },
      {
        id: 'conn-whatsapp',
        name: 'WhatsApp Alerts',
        iconName: 'MessageSquare',
        category: 'Communication',
        status: 'not_connected',
        description: 'Receive instant approval requests on WhatsApp.',
      },
      {
        id: 'conn-payments',
        name: 'UPI & Banking Statements',
        iconName: 'CreditCard',
        category: 'Payments',
        status: 'connected',
        description: 'Verify refund credits and avoid manual statement checking.',
        lastSynced: 'Connected',
      },
    ],
    vaultDocuments: [
      { id: 'v1', name: 'Order Receipt #AMZ-9102.pdf', category: 'Receipts', date: '10 Aug 2026', source: 'Gmail', size: '240 KB', verified: true },
      { id: 'v2', name: 'Purchase Invoice & Warranty.pdf', category: 'Warranty', date: '15 Jul 2026', source: 'Vault Upload', size: '310 KB', verified: true },
      { id: 'v3', name: 'Flight E-Ticket Booking.pdf', category: 'Travel', date: '2 Aug 2026', source: 'Gmail', size: '185 KB', verified: true },
    ],
    memoryItems: [
      { id: 'm1', key: 'city', label: 'Preferred City', value: 'Pune, Maharashtra', category: 'Location & Currency', lastUpdated: 'Today' },
      { id: 'm2', key: 'currency', label: 'Default Currency', value: 'INR (₹)', category: 'Location & Currency', lastUpdated: 'Today' },
      { id: 'm3', key: 'appt_time', label: 'Preferred Appointment Window', value: 'Weekdays after 5:30 PM', category: 'Preferences', lastUpdated: 'Today' },
      { id: 'm4', key: 'comm_channel', label: 'Primary Contact Method', value: 'In-App Approvals & Email', category: 'Communication', lastUpdated: 'Today' },
      { id: 'm5', key: 'travel_pref', label: 'Flight Preference', value: 'Window seat, direct routes', category: 'Travel', lastUpdated: 'Today' },
    ],
    agentPermissions: [
      { id: 'p1', title: 'Search emails & order receipts', description: 'Investigate order numbers, delivery dates, and return confirmations in connected inbox.', setting: 'on' },
      { id: 'p2', title: 'Read documents in Personal Vault', description: 'Reference warranty cards, medical certificates, and receipts to prove claims.', setting: 'on' },
      { id: 'p3', title: 'Submit dispute and support forms', description: 'Fill and submit official escalation tickets on merchant and service portals.', setting: 'ask' },
      { id: 'p4', title: 'Send formal support / escalation emails', description: 'Dispatch pre-composed escalation messages to customer grievance desks.', setting: 'ask' },
      { id: 'p5', title: 'Execute financial transactions / payments', description: 'Pay fees, purchase replacements, or authorize billing.', setting: 'never' },
    ],
  };
}

// Seed Demo User
const demoUser: UserProfile = {
  id: 'usr_demo',
  email: 'user@fixly.ai',
  name: 'Naviq User',
  onboardingCompleted: true,
  createdAt: new Date().toISOString(),
};
userStores.set(demoUser.id, createInitialUserData(demoUser));

// -------------------------------------------------------------
// Authentication & Session Management Middleware
// -------------------------------------------------------------
function generateToken(): string {
  return `fx_tok_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
}

interface AuthenticatedRequest extends express.Request {
  userId: string;
  userStore: UserDataStore;
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Authentication required' });
    return;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Missing session token' });
    return;
  }

  const session = activeSessions.get(token);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
    return;
  }

  const store = userStores.get(session.userId);
  if (!store) {
    res.status(401).json({ error: 'Unauthorized: User account not found' });
    return;
  }

  (req as any).userId = session.userId;
  (req as any).userStore = store;
  next();
}

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------

// POST /api/auth/demo (Create authenticated demo session)
app.post('/api/auth/demo', (req, res) => {
  const token = generateToken();
  activeSessions.set(token, { userId: demoUser.id, createdAt: Date.now() });
  const authResponse: AuthResponse = {
    user: demoUser,
    token,
  };
  res.json(authResponse);
});

// POST /api/auth/login (Email/Password Login)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Valid email is required' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  
  // Find existing user or check if demo user
  let targetUser: UserProfile | undefined;
  for (const store of userStores.values()) {
    if (store.user.email.toLowerCase() === normalizedEmail) {
      targetUser = store.user;
      break;
    }
  }

  if (!targetUser) {
    // If not found, create new user account automatically for convenience
    const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const namePart = normalizedEmail.split('@')[0];
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    targetUser = {
      id: newUserId,
      email: normalizedEmail,
      name: formattedName,
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
    };
    userStores.set(newUserId, createInitialUserData(targetUser));
  }

  const token = generateToken();
  activeSessions.set(token, { userId: targetUser.id, createdAt: Date.now() });

  const authResponse: AuthResponse = {
    user: targetUser,
    token,
  };
  res.json(authResponse);
});

// POST /api/auth/register (Create new account with onboarding requirement)
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Valid email is required' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const userName = name && typeof name === 'string' && name.trim().length > 0 
    ? name.trim() 
    : normalizedEmail.split('@')[0].charAt(0).toUpperCase() + normalizedEmail.split('@')[0].slice(1);

  const newUser: UserProfile = {
    id: newUserId,
    email: normalizedEmail,
    name: userName,
    onboardingCompleted: false, // Must go through onboarding
    createdAt: new Date().toISOString(),
  };

  userStores.set(newUserId, createInitialUserData(newUser));

  const token = generateToken();
  activeSessions.set(token, { userId: newUserId, createdAt: Date.now() });

  const authResponse: AuthResponse = {
    user: newUser,
    token,
  };
  res.json(authResponse);
});

// GET /api/auth/me (Get current session user)
app.get('/api/auth/me', requireAuth, (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest;
  res.json({ user: authReq.userStore.user });
});

// POST /api/auth/onboarding/complete (Complete onboarding for user)
app.post('/api/auth/onboarding/complete', requireAuth, (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest;
  authReq.userStore.user.onboardingCompleted = true;
  res.json({ success: true, user: authReq.userStore.user });
});

// POST /api/auth/logout (Revoke session)
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    activeSessions.delete(token);
  }
  res.json({ success: true });
});

// -------------------------------------------------------------
// Intent Classification & Conversational Engine (Gemini + Fallback)
// -------------------------------------------------------------
interface IntentClassificationResult {
  intent: MessageIntent;
  replyMessage: string;
  taskDetails?: {
    title: string;
    category: FixMission['category'];
    companyOrTarget: string;
    summary: string;
    monetaryValue?: string;
    estimatedTimeSaved: string;
    targetUrl?: string;
    reasoningRationale?: string;
  };
}

async function classifyIntentWithGemini(
  userMessage: string,
  activeTasks: FixMission[],
  history?: ChatMessage[],
  attachedTask?: FixMission | null
): Promise<IntentClassificationResult> {
  const ai = getGemini();
  const trimmed = userMessage.trim();
  const lower = trimmed.toLowerCase();

  // Format context history if present
  const recentHistory = (history || [])
    .slice(-6)
    .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
    .join('\n');

  const attachedTaskSummary = attachedTask
    ? `Current Attached Task for this Conversation:
ID: ${attachedTask.id}, Title: ${attachedTask.title}, Status: ${attachedTask.status}, Company: ${attachedTask.companyOrTarget}, Progress: ${attachedTask.progress}%`
    : '';

  // Try Structured Gemini 3.7 Flash Classification & Response Generation
  if (ai) {
    try {
      const activeTasksSummary = activeTasks
        .map((t) => `ID: ${t.id}, Title: ${t.title}, Status: ${t.status}, Company: ${t.companyOrTarget}`)
        .join('\n');

      const prompt = `You are Naviq, an intelligent AI assistant, "Google Maps for Software", and autonomous personal navigator.
Analyze the user's message in the context of the current conversation and determine their exact intent.

CRITICAL INTENT RULES:
1. "navigation_request" (or "guided_task" / "autonomous_task"):
   - User wants to navigate, accomplish an action, find a button/setting, or complete a workflow inside digital software / apps / websites (e.g. Canva, Excel, Gmail, Fusion 360, Figma, PowerPoint, Notion, Google Docs, IRS Portal, Salesforce, Jira, Photoshop, Spotify, Zoom, AWS console, GitHub, etc.).
   - Examples:
     - "I want to export this Canva design as a transparent PNG"
     - "How do I make a pivot table in Excel?"
     - "Where do I change my Gmail signature?"
     - "I need to create a 3D hole in Fusion 360"
     - "How do I remove background in Photoshop?"
     - "Guide me through creating a GitHub release"
     - "Show me how to invite teammates in Slack"
     - "Export my presentation as PDF"
     - "Do it for me: download all invoices"
   - For software navigation requests, specify intent as "navigation_request" (or "autonomous_task" if they said "do it for me" / "automate this").

2. "conversation":
   - Greetings, casual chat, pleasantries ("Hi", "Hello", "Thanks", "How are you?").
   - General knowledge, questions about people, concepts, science, history ("Who is Elon Musk?", "What is an API?", "Explain quantum computing", "Tell me a joke", "What is the capital of Japan?").
   - Informational conceptual questions about how real-world things work.
   - For "conversation", YOU MUST write a comprehensive, accurate, helpful, and natural conversational response in "replyMessage". DO NOT create task details.

3. "task_request":
   - Real-world life-admin / dispute / refund / grievance resolution (e.g. "Get my refund from Amazon", "Cancel my Netflix subscription", "Claim boAt warranty replacement", "Resolve my complaint with Airtel").

4. "task_update":
   - Providing parameters/info for an active task ("Also attach receipt #401", "My phone is 9876543210").

5. "approval_response":
   - Responding to an approval request ("Yes, send it", "Approve", "Go ahead", "Reject", "No, cancel", "Authorized").

6. "question_about_task":
   - Inquiring about progress of an active task.

7. "cancel_task":
   - Explicitly asking to halt/abort an active task ("Stop the task", "Cancel fix", "Abort mission").

Conversation History:
${recentHistory || 'None'}

${attachedTaskSummary}

Global Active Tasks:
${activeTasksSummary || 'None'}

Current User Message: "${trimmed}"

Return ONLY valid JSON matching this schema:
{
  "intent": "navigation_request" | "guided_task" | "autonomous_task" | "conversation" | "task_request" | "task_update" | "approval_response" | "question_about_task" | "cancel_task",
  "replyMessage": "Direct, helpful response to the user. For navigation, provide a clear confirmation and intro to the route.",
  "taskDetails": {
    "title": "Clear task/navigation title",
    "category": "Money" | "Travel" | "Subscriptions" | "Warranty" | "Complaints" | "Appointments" | "Other",
    "companyOrTarget": "Target software/application name",
    "summary": "1-2 sentence description of the goal",
    "monetaryValue": "Extracted value or empty",
    "estimatedTimeSaved": "~10 minutes",
    "targetUrl": "Portal/application URL",
    "reasoningRationale": "User-facing concise explanation"
  }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.intent) {
        return parsed as IntentClassificationResult;
      }
    } catch (err) {
      console.warn('Gemini intent classification error, using deterministic fallback:', err);
    }
  }

  // -------------------------------------------------------------
  // Deterministic Fallback Classifier (Guarantees Navigation / Conversation)
  // -------------------------------------------------------------

  // 1. Approval responses
  const approvalKeywords = ['approve', 'yes', 'confirm', 'go ahead', 'send it', 'proceed', 'do it', 'authorize'];
  if (approvalKeywords.some((w) => lower === w || lower.startsWith(w + ' '))) {
    return {
      intent: 'approval_response',
      replyMessage: 'Got your approval. Executing the escalation right away.',
    };
  }

  // 2. Cancellation
  const cancelKeywords = ['stop', 'cancel task', 'abort', 'halt', 'cancel fix', 'stop task'];
  if (cancelKeywords.some((w) => lower.includes(w))) {
    return {
      intent: 'cancel_task',
      replyMessage: 'Task has been paused and cancelled as requested.',
    };
  }

  // 3. Software Navigation Requests (e.g. Canva, Excel, Gmail, Fusion 360, Figma, Notion, Slack, Google Docs, etc.)
  const isSoftwareNavigation =
    lower.includes('canva') ||
    lower.includes('transparent png') ||
    lower.includes('pivot table') ||
    lower.includes('excel') ||
    lower.includes('fusion 360') ||
    lower.includes('3d hole') ||
    lower.includes('gmail signature') ||
    lower.includes('export this') ||
    lower.includes('how do i export') ||
    lower.includes('how do i change my signature') ||
    lower.includes('how do i create a pivot') ||
    lower.includes('show me how to') ||
    lower.includes('guide me through') ||
    lower.includes('where is the button') ||
    lower.includes('how do i find');

  if (isSoftwareNavigation) {
    let appName = 'Digital Software';
    if (lower.includes('canva')) appName = 'Canva';
    else if (lower.includes('excel') || lower.includes('pivot')) appName = 'Microsoft Excel';
    else if (lower.includes('gmail') || lower.includes('signature')) appName = 'Gmail';
    else if (lower.includes('fusion')) appName = 'Autodesk Fusion 360';
    else if (lower.includes('figma')) appName = 'Figma';
    else if (lower.includes('notion')) appName = 'Notion';

    const isAutonomous = lower.includes('do it for me') || lower.includes('automate') || lower.includes('take control');

    return {
      intent: isAutonomous ? 'autonomous_task' : 'navigation_request',
      replyMessage: `I've mapped out the route to accomplish your goal in **${appName}**. Starting turn-by-turn navigation.`,
      taskDetails: {
        title: `Navigate: ${trimmed}`,
        category: 'Other',
        companyOrTarget: appName,
        summary: `Turn-by-turn navigation for: "${trimmed}"`,
        estimatedTimeSaved: '~10 minutes',
      },
    };
  }

  // 4. Strict Real-World Life-Admin Task Request Detection (Requires explicit action verb + problem/target)
  const isExplicitAction =
    (/\b(get|recover|claim|cancel|book|file|dispute|resolve|fix|escalate|submit|contact support for)\b/i.test(lower) &&
      /\b(refund|money|subscription|membership|warranty|replacement|ticket|booking|flight|complaint|broadband|order|charge)\b/i.test(lower)) ||
    lower.startsWith('i need you to get') ||
    lower.startsWith('can you help me get my') ||
    lower.startsWith('please cancel my');

  const isQuestionAboutSomething =
    lower.startsWith('who is') ||
    lower.startsWith('who was') ||
    lower.startsWith('what is') ||
    lower.startsWith('what are') ||
    lower.startsWith('why is') ||
    lower.startsWith('why do') ||
    lower.startsWith('why does') ||
    lower.startsWith('explain') ||
    lower.startsWith('how do i') ||
    lower.startsWith('how does') ||
    lower.startsWith('how do you') ||
    lower.startsWith('tell me') ||
    lower.startsWith('can you explain') ||
    lower.startsWith('where is');

  if (isExplicitAction && !isQuestionAboutSomething) {
    let category: FixMission['category'] = 'Other';
    let company = 'Service Desk';
    let value: string | undefined = undefined;
    let targetUrl = 'https://support.google.com';

    // Extract company
    if (lower.includes('amazon')) { company = 'Amazon'; targetUrl = 'https://www.amazon.in/gp/help/customer/display.html'; }
    else if (lower.includes('netflix')) { company = 'Netflix'; targetUrl = 'https://help.netflix.com'; }
    else if (lower.includes('boat')) { company = 'boAt Lifestyle'; targetUrl = 'https://service.boat-lifestyle.com'; }
    else if (lower.includes('indigo')) { company = 'IndiGo Airlines'; targetUrl = 'https://www.goindigo.in/contact-us.html'; }
    else if (lower.includes('airtel')) { company = 'Airtel'; targetUrl = 'https://www.airtel.in/broadband-support'; }
    else if (lower.includes('flipkart')) { company = 'Flipkart'; targetUrl = 'https://www.flipkart.com/helpcentre'; }
    else if (lower.includes('swiggy')) { company = 'Swiggy'; targetUrl = 'https://www.swiggy.com/support'; }
    else if (lower.includes('zomato')) { company = 'Zomato'; targetUrl = 'https://www.zomato.com/contact'; }

    // Extract category
    if (lower.includes('refund') || lower.includes('money') || lower.includes('chargeback') || lower.includes('return')) {
      category = 'Money';
      const moneyMatch = trimmed.match(/(?:₹|\$|rs\.?|inr)\s?([0-9,]+)/i);
      if (moneyMatch) {
        value = `₹${moneyMatch[1]}`;
      }
    } else if (lower.includes('cancel') || lower.includes('subscription') || lower.includes('membership')) {
      category = 'Subscriptions';
    } else if (lower.includes('warranty') || lower.includes('replace') || lower.includes('repair') || lower.includes('defect')) {
      category = 'Warranty';
    } else if (lower.includes('flight') || lower.includes('hotel') || lower.includes('booking') || lower.includes('travel') || lower.includes('train')) {
      category = 'Travel';
    } else if (lower.includes('complaint') || lower.includes('broadband') || lower.includes('network') || lower.includes('service')) {
      category = 'Complaints';
    } else if (lower.includes('appointment') || lower.includes('doctor') || lower.includes('slot')) {
      category = 'Appointments';
    }

    const title = `Resolve: ${trimmed.length > 40 ? trimmed.substring(0, 38) + '...' : trimmed}`;

    return {
      intent: 'task_request',
      replyMessage: `Got it. I'm starting an autonomous investigation to ${trimmed.toLowerCase().replace(/^(please|i want to|can you|fixly)\s+/i, '')}. I will gather evidence, inspect the merchant portal, and prepare the resolution.`,
      taskDetails: {
        title,
        category,
        companyOrTarget: company,
        summary: `Autonomous resolution for: "${trimmed}" with ${company}.`,
        monetaryValue: value,
        estimatedTimeSaved: '~35 minutes',
        targetUrl,
        reasoningRationale: `Analyzed customer protection guidelines and merchant SLA. Naviq selected the direct resolution path with verified documentation to avoid delay loops.`,
      },
    };
  }

  // 4. Default to Conversation (Answers questions naturally with zero task creation)
  let conversationalReply = "Hi! I'm Naviq. Tell me what you'd like me to get done.";

  if (lower === 'hi' || lower === 'hello' || lower === 'hey' || lower === 'namaste' || lower === 'hola') {
    conversationalReply = "Hi! I'm Naviq. Tell me what you'd like me to get done.";
  } else if (lower.includes('who is elon musk') || lower.includes('who elon musk')) {
    conversationalReply = "Elon Musk is a prominent technology entrepreneur, investor, and engineer. He is the CEO of Tesla and SpaceX, founder of xAI, The Boring Company, and Neuralink, and the owner of X (formerly Twitter).";
  } else if (lower.includes('what is an api') || lower.includes('what is api') || lower.includes('what are apis')) {
    conversationalReply = "An API (Application Programming Interface) is a set of rules and protocols that allows different software applications to communicate and share data with one another seamlessly.";
  } else if (lower.includes('quantum computing')) {
    conversationalReply = "Quantum computing leverages the principles of quantum mechanics—such as superposition and entanglement—to process complex calculations exponentially faster than classical computers for specific types of problems.";
  } else if (lower.includes('joke')) {
    conversationalReply = "Why do programmers prefer dark mode? Because light attracts bugs!";
  } else if (lower.includes('capital of japan')) {
    conversationalReply = "The capital of Japan is Tokyo.";
  } else if (lower.includes('who are you') || lower.includes('what can you do') || lower.includes('how does fixly work') || lower.includes('how do you work')) {
    conversationalReply = "I'm Naviq, your autonomous personal agent. I help you solve real-world digital friction: recovering delayed refunds, canceling stubborn subscriptions, claiming warranty replacements, and filing consumer escalations. You can also chat with me or ask me any question!";
  } else if (lower.includes('why do amazon refunds take') || lower.includes('amazon refund take so long') || lower.includes('how long do refunds take')) {
    conversationalReply = "Refund processing timelines generally depend on payment methods and merchant inspection cycles. Credit cards typically take 3-5 business days after warehouse inspection, UPI takes 24-48 hours, and bank transfers can take up to 7 business days. If your refund is delayed past the SLA, you can ask me to recover it for you!";
  } else if (lower.includes('thanks') || lower.includes('thank you')) {
    conversationalReply = "You're welcome! Feel free to ask another question or assign a task whenever you're ready.";
  } else {
    conversationalReply = `I understand. You can ask me any question, or if there's a real-world task you'd like me to resolve (like getting a refund, canceling a subscription, or claiming a warranty), just let me know!`;
  }

  return {
    intent: 'conversation',
    replyMessage: conversationalReply,
  };
}

// Helper: Smart Concise Title Generator for Conversations
function generateConversationTitle(prompt: string): string {
  const trimmed = prompt.trim();
  const lower = trimmed.toLowerCase();

  if (lower.includes('amazon') && lower.includes('refund')) return 'Amazon refund';
  if (lower.includes('netflix') && lower.includes('cancel')) return 'Cancel Netflix';
  if (lower.includes('boat') && (lower.includes('warranty') || lower.includes('replace'))) return 'boAt warranty';
  if (lower.includes('indigo') || (lower.includes('flight') && lower.includes('refund'))) return 'Flight refund';
  if (lower.includes('airtel') && lower.includes('complaint')) return 'Airtel broadband complaint';
  if (lower.includes('dentist') || lower.includes('doctor') || lower.includes('appointment')) return 'Dentist appointment';
  if (lower.includes('elon musk')) return 'Elon Musk inquiry';
  if (lower.includes('what is an api') || lower.includes('api')) return 'API explanation';
  if (lower.includes('quantum computing')) return 'Quantum computing';
  if (lower.includes('joke')) return 'Lighthearted chat';
  if (lower.includes('refund')) return 'Refund claim';
  if (lower.includes('subscription')) return 'Subscription management';
  if (lower.includes('warranty')) return 'Warranty claim';
  if (lower === 'hi' || lower === 'hello' || lower === 'hey') return 'General greeting';

  const words = trimmed.replace(/[^\w\s]/gi, '').split(/\s+/).slice(0, 4).join(' ');
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'New Conversation';
}

// Core Message Processing Function for Stateful Conversations


async function processConversationTurn(
  store: UserDataStore,
  conversation: Conversation,
  userMessageText: string,
  context?: any
): Promise<ChatResponse> {
  const trimmed = userMessageText.trim();
  const lower = trimmed.toLowerCase();
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Add User Message to Conversation
  const userMsg: ChatMessage = {
    id: `msg-user-${Date.now()}`,
    conversationId: conversation.id,
    sender: 'user',
    text: trimmed,
    timestamp: nowStr,
  };
  conversation.messages.push(userMsg);
  conversation.updatedAt = new Date().toISOString();

  // 2. Process query with new Customer Success Agent
  let agentResponse;
  try {
    agentResponse = await processCustomerQuery(trimmed, conversation.messages, context);
  } catch(e: any) {
    agentResponse = { reply: 'Sorry, I encountered an error: ' + e.message, activityLog: ['Error connecting to agent'] };
  }

  const assistantMsg: ChatMessage = {
    id: `msg-asst-${Date.now()}`,
    conversationId: conversation.id,
    sender: 'assistant',
    text: agentResponse.reply,
    timestamp: nowStr,
    intent: 'conversation',
    activityLog: agentResponse.activityLog,
    actionResult: agentResponse.actionResult
  };
  
  conversation.messages.push(assistantMsg);
  
  return {
    type: 'conversation',
    intent: 'conversation',
    message: agentResponse.reply,
    conversationId: conversation.id,
    conversation,
    actionResult: agentResponse.actionResult
  };
}



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

// ==========================================
// Modern Conversation APIs (ChatGPT-style)
// ==========================================

// POST /api/conversations
app.post('/api/conversations', requireAuth, async (req, res) => {
  const store = (req as any).userStore;
  const { initialMessage, context } = req.body;
  
  const conversation = {
    id: `conv-${Date.now()}`,
    title: initialMessage ? initialMessage.substring(0, 30) + (initialMessage.length > 30 ? '...' : '') : 'New Conversation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: []
  };
  
  store.conversations.unshift(conversation);
  
  if (initialMessage) {
    try {
      const response = await processConversationTurn(store, conversation, initialMessage, context);
      res.json({ conversation, response });
      return;
    } catch (err) {
      console.error('Error processing turn:', err);
      res.status(500).json({ error: 'Failed to process message' });
      return;
    }
  }
  
  res.json({ conversation });
});

// GET /api/conversations
app.get('/api/conversations', requireAuth, (req, res) => {
  const store = (req as any).userStore;
  res.json({ conversations: store.conversations });
});


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

// GET /api/conversations/:id
app.get('/api/conversations/:id', requireAuth, (req, res) => {
  const store = (req as any).userStore;
  const conversation = store.conversations.find(c => c.id === req.params.id);
  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  res.json({ conversation });
});

// POST /api/conversations/:id/messages
app.post('/api/conversations/:id/messages', requireAuth, async (req, res) => {
  const store = (req as any).userStore;
  const conversation = store.conversations.find(c => c.id === req.params.id);
  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  
  const { message, context } = req.body;
  
  try {
    const response = await processConversationTurn(store, conversation, message, context);
    res.json({ response });
  } catch (err) {
    console.error('Error processing turn:', err);
    res.status(500).json({ error: 'Failed to process message' });
  }
});


// POST /api/conversations/:id/stream
app.post('/api/conversations/:id/stream', requireAuth, async (req, res) => {
  const store = (req as any).userStore;
  const conversation = store.conversations.find((c: any) => c.id === req.params.id);
  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  
  const { message, context } = req.body;
  const trimmed = message.trim();
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const userMsg = {
    id: `msg-user-${Date.now()}`,
    conversationId: conversation.id,
    sender: 'user',
    text: trimmed,
    timestamp: nowStr,
  };
  conversation.messages.push(userMsg);
  conversation.updatedAt = new Date().toISOString();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const onLog = (log: string) => {
      res.write(`data: ${JSON.stringify({ type: 'log', log })}

`);
    };
    const onChunk = (chunk: string) => {
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}

`);
    };

    const agentResponse = await processCustomerQuery(trimmed, conversation.messages, context, onLog, onChunk);
    
    const assistantMsg = {
      id: `msg-asst-${Date.now()}`,
      conversationId: conversation.id,
      sender: 'assistant',
      text: agentResponse.reply,
      timestamp: nowStr,
      intent: 'conversation',
      activityLog: agentResponse.activityLog,
      actionResult: agentResponse.actionResult
    };
    conversation.messages.push(assistantMsg);

    res.write(`data: ${JSON.stringify({ type: 'done', message: assistantMsg })}

`);
    res.end();
  } catch (err: any) {
    console.error('Error processing turn:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}

`);
    res.end();
  }
});

// DELETE /api/conversations/:id
app.delete('/api/conversations/:id', requireAuth, (req, res) => {
  const store = (req as any).userStore;
  store.conversations = store.conversations.filter(c => c.id !== req.params.id);
  res.json({ success: true });
});

// ==========================================
// Digital Navigation & Software Maps APIs
// ==========================================
// Since we removed these, we can just return dummy or simple 404 for them, or just ignore since UI doesn't use them if we replaced it.
// Actually, UI might still call navigation. Let's add dummy routes for navigation to prevent crashes.

app.get('/api/navigation/:id', requireAuth, (req, res) => {
  res.json({ session: null });
});

app.post('/api/navigation/:id/mode', requireAuth, (req, res) => {
  res.json({ success: true });
});

app.post('/api/navigation/:id/advance', requireAuth, (req, res) => {
  res.json({ success: true });
});

app.post('/api/navigation/:id/observe', requireAuth, (req, res) => {
  res.json({ success: true });
});

app.post('/api/navigation/:id/execute', requireAuth, (req, res) => {
  res.json({ success: true });
});

app.post('/api/navigation/:id/stop', requireAuth, (req, res) => {
  res.json({ success: true });
});


// Legacy Chat APIs
app.post('/api/chat', requireAuth, (req, res) => {
  res.json({ error: 'Deprecated' });
});

app.get('/api/chat/history', requireAuth, (req, res) => {
  const store = (req as any).userStore;
  const allMessages = store.conversations.flatMap(c => c.messages);
  res.json({ messages: allMessages });
});

app.post('/api/chat/clear', requireAuth, (req, res) => {
  const store = (req as any).userStore;
  store.conversations = [];
  res.json({ success: true });
});

// GET /api/tasks
app.get('/api/tasks', requireAuth, (req, res) => {
  const store = (req as any).userStore as UserDataStore;
  const { status } = req.query;
  let filtered = [...store.tasks];
  if (status && status !== 'all') {
    if (status === 'active') {
      filtered = filtered.filter((t) => t.status === 'working' || t.status === 'needs_approval');
    } else {
      filtered = filtered.filter((t) => t.status === status);
    }
  }
  res.json({ tasks: filtered });
});

// GET /api/tasks/:id
app.get('/api/tasks/:id', requireAuth, (req, res) => {
  const store = (req as any).userStore as UserDataStore;
  const task = store.tasks.find((t) => t.id === req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json({ task });
});

// POST /api/tasks (Direct creation fallback)
app.post('/api/tasks', requireAuth, async (req, res) => {
  const store = (req as any).userStore as UserDataStore;
  const { problem, context } = req.body;
  if (!problem || typeof problem !== 'string' || problem.trim().length === 0) {
    res.status(400).json({ error: 'Problem description is required' });
    return;
  }

  const classification = await classifyIntentWithGemini(problem.trim(), store.tasks);
  const details = classification.taskDetails || {
    title: `Fix: ${problem.trim().substring(0, 30)}`,
    category: 'Other' as const,
    companyOrTarget: 'Service Desk',
    summary: `Autonomous resolution for ${problem.trim()}`,
    estimatedTimeSaved: '~35 minutes',
  };

  const newTask: FixMission = {
    id: `mission-${Date.now()}`,
    title: details.title,
    category: details.category,
    status: 'needs_approval',
    progress: 70,
    summary: details.summary,
    lastAction: 'Compiled escalation packet with verified evidence',
    nextAction: 'Awaiting your approval to dispatch priority escalation',
    createdDate: 'Today',
    estimatedTimeSaved: details.estimatedTimeSaved || '~35 minutes',
    monetaryValue: details.monetaryValue,
    companyOrTarget: details.companyOrTarget,
    autonomyLevel: 'Standard (Approve Sensitive)',
    reasoningRationale: details.reasoningRationale || 'Naviq compiled direct resolution documentation.',
    steps: [
      { id: 's1', title: 'Understanding request', status: 'completed', description: `Parsed goal: "${problem.trim().substring(0, 45)}"`, timestamp: 'Just now' },
      { id: 's2', title: 'Finding evidence', status: 'completed', description: 'Found receipts and transaction records', timestamp: 'Just now' },
      { id: 's3', title: `Investigating portal`, status: 'completed', description: 'Verified merchant policies and SLA deadlines', timestamp: 'Just now' },
      { id: 's4', title: 'Reasoning & strategy', status: 'completed', description: 'Formulated escalation packet with cryptographic hashes', timestamp: 'Just now' },
      { id: 's5', title: 'Taking action', status: 'in_progress', description: 'Preparing escalation dispatch — requires user sign-off', timestamp: 'Working' },
      { id: 's6', title: 'Monitoring & verification', status: 'pending', description: 'Will verify outcome acknowledgment', timestamp: 'Upcoming' },
    ],
    browserSimulation: {
      targetUrl: details.targetUrl || 'https://support.google.com',
      siteName: `${details.companyOrTarget} Portal`,
      orderRef: 'FX-' + Math.floor(10000 + Math.random() * 90000),
      simulatedActions: ['Connected to portal', 'Injected verified evidence', 'Awaiting approval'],
      fields: [
        { label: 'Target', value: details.companyOrTarget },
        { label: 'Status', value: 'Action In-Flight' },
      ],
      currentStepIndex: 4,
    },
    approval: {
      required: true,
      actionTitle: `Submit Resolution Escalation to ${details.companyOrTarget}`,
      recipient: `${details.companyOrTarget} Support Desk`,
      messagePreview: `Naviq Notice: Regarding "${problem.trim()}". All prerequisites verified.`,
      attachedEvidence: ['Order Confirmation.pdf', 'Proof of Transaction.pdf'],
      status: 'pending',
    },
    evidence: [
      { id: `ev-${Date.now()}-1`, title: 'Verified Purchase Record', type: 'pdf', source: 'Gmail', date: 'Today', verified: true },
    ],
    reportTimeline: [
      { date: 'Today, Just now', event: `Naviq initiated mission: "${problem.trim()}"`, status: 'completed' },
      { date: 'Today, Just now', event: 'Escalation ready for approval', status: 'in_progress' },
    ],
  };

  store.tasks.unshift(newTask);
  res.json({ success: true, task: newTask });
});

// POST /api/tasks/:id/approve
app.post('/api/tasks/:id/approve', requireAuth, (req, res) => {
  const store = (req as any).userStore as UserDataStore;
  const taskIndex = store.tasks.findIndex((t) => t.id === req.params.id);
  if (taskIndex === -1) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const task = store.tasks[taskIndex];
  if (task.approval) {
    task.approval.status = 'approved';
  }

  task.steps = task.steps.map((s) => ({
    ...s,
    status: 'completed' as const,
  }));

  task.status = 'resolved';
  task.progress = 100;
  task.lastAction = 'Escalation submitted and verified with merchant';
  task.nextAction = 'Mission completed successfully';

  task.resolution = {
    outcomeTitle: `Fixed. ${task.monetaryValue ? task.monetaryValue + ' Recovered.' : 'Problem Resolved.'}`,
    outcomeDetail: `Naviq successfully executed the escalation with ${task.companyOrTarget} and verified receipt of the resolution.`,
    actionsTakenCount: task.steps.length,
    recoveryValue: task.monetaryValue,
    timeSavedMinutes: 42,
    resolvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
  };

  store.notifications.unshift({
    id: `notif-${Date.now()}`,
    title: 'Naviq resolved something',
    message: `${task.title} has been resolved successfully.`,
    time: 'Just now',
    type: 'resolved',
    missionId: task.id,
    read: false,
    actionLabel: 'View Report',
  });

  store.activityLog.unshift({
    id: `act-${Date.now()}`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    dayGroup: 'Today',
    title: `Approved & Resolved: ${task.title}`,
    description: `User authorized dispatch. Naviq submitted verified payload to ${task.companyOrTarget}.`,
    missionId: task.id,
    missionTitle: task.title,
    type: 'resolution',
  });

  res.json({ success: true, task });
});

// POST /api/tasks/:id/stop
app.post('/api/tasks/:id/stop', requireAuth, async (req, res) => {
  const store = (req as any).userStore as UserDataStore;
  const task = store.tasks.find((t) => t.id === req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  task.status = 'waiting';
  task.lastAction = 'Browser automation stopped by user.';
  task.nextAction = 'Paused. Resume or inspect portal manually.';

  let session = browserService.getSessionByTaskId(req.params.id);
  if (session) {
    session = await browserService.stopSession(session.sessionId);
  }

  store.activityLog.unshift({
    id: `act-${Date.now()}`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    dayGroup: 'Today',
    title: `Browser Automation Stopped: ${task.title}`,
    description: `User manually halted automated browser task execution.`,
    missionId: task.id,
    missionTitle: task.title,
    type: 'waiting',
  });

  res.json({ success: true, task, session });
});

// GET /api/browser/state/:taskId
app.get('/api/browser/state/:taskId', requireAuth, (req, res) => {
  const session = browserService.getSessionByTaskId(req.params.taskId);
  res.json({ success: true, session });
});

// POST /api/tasks/:id/browser-action
app.post('/api/tasks/:id/browser-action', requireAuth, async (req, res) => {
  const store = (req as any).userStore as UserDataStore;
  const task = store.tasks.find((t) => t.id === req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const { actionType, params } = req.body;
  const session = browserService.getSessionByTaskId(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'No active browser session' });
    return;
  }

  try {
    if (actionType === 'click') {
      await browserService.click(session.sessionId, params || {});
    } else if (actionType === 'type') {
      await browserService.type(session.sessionId, params || { text: '' });
    } else if (actionType === 'inspect') {
      await browserService.inspectInteractiveElements(session.sessionId);
    } else if (actionType === 'screenshot') {
      await browserService.captureScreenshot(session.sessionId);
    } else if (actionType === 'navigate') {
      await browserService.navigate(session.sessionId, params?.url || 'https://google.com');
    }

    const updated = browserService.getSession(session.sessionId);
    res.json({ success: true, session: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/reject
app.post('/api/tasks/:id/reject', requireAuth, (req, res) => {
  const store = (req as any).userStore as UserDataStore;
  const task = store.tasks.find((t) => t.id === req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  if (task.approval) {
    task.approval.status = 'rejected';
  }
  task.status = 'working';
  task.progress = 50;
  task.lastAction = 'Approval rejected; Naviq re-evaluating alternative routes';
  task.nextAction = 'Investigating secondary resolution path';

  res.json({ success: true, task });
});

// POST /api/tasks/:id/run
app.post('/api/tasks/:id/run', requireAuth, (req, res) => {
  const store = (req as any).userStore as UserDataStore;
  const task = store.tasks.find((t) => t.id === req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const { stepIndex } = req.body;
  if (typeof stepIndex === 'number' && task.steps[stepIndex]) {
    task.steps[stepIndex].status = 'completed';
    if (task.steps[stepIndex + 1]) {
      task.steps[stepIndex + 1].status = 'in_progress';
    }
  }

  res.json({ success: true, task });
});

// GET /api/activity
app.get('/api/activity', requireAuth, (req, res) => {
  const store = (req as any).userStore as UserDataStore;
  res.json({ activity: store.activityLog });
});

// GET /api/notifications
app.get('/api/notifications', requireAuth, (req, res) => {
  const store = (req as any).userStore as UserDataStore;
  res.json({ notifications: store.notifications });
});

// POST /api/notifications/:id/read
app.post('/api/notifications/:id/read', requireAuth, (req, res) => {
  const store = (req as any).userStore as UserDataStore;
  const notif = store.notifications.find((n) => n.id === req.params.id);
  if (notif) notif.read = true;
  res.json({ success: true });
});

// POST /api/notifications/read-all
app.post('/api/notifications/read-all', requireAuth, (req, res) => {
  const store = (req as any).userStore as UserDataStore;
  store.notifications.forEach((n) => (n.read = true));
  res.json({ success: true });
});

// GET /api/connections
app.get('/api/connections', requireAuth, (req, res) => {
  const store = (req as any).userStore as UserDataStore;
  res.json({ connections: store.connections });
});

// POST /api/connections/:id/toggle
app.post('/api/connections/:id/toggle', requireAuth, (req, res) => {
  const store = (req as any).userStore as UserDataStore;
  const conn = store.connections.find((c) => c.id === req.params.id);
  if (!conn) {
    res.status(404).json({ error: 'Connection not found' });
    return;
  }
  conn.status = conn.status === 'connected' ? 'not_connected' : 'connected';
  conn.lastSynced = conn.status === 'connected' ? 'Just now' : undefined;
  res.json({ success: true, connection: conn });
});

// GET /api/vault
app.get('/api/vault', requireAuth, (req, res) => {
  const store = (req as any).userStore as UserDataStore;
  res.json({ documents: store.vaultDocuments });
});

// POST /api/vault/upload
app.post('/api/vault/upload', requireAuth, (req, res) => {
  const store = (req as any).userStore as UserDataStore;
  const { name, category, source, size } = req.body;
  const newDoc: VaultDocument = {
    id: `v-${Date.now()}`,
    name: name || 'Uploaded Document.pdf',
    category: category || 'Receipts',
    date: 'Today',
    source: source || 'User Upload',
    size: size || '350 KB',
    verified: true,
  };
  store.vaultDocuments.unshift(newDoc);
  res.json({ success: true, document: newDoc });
});

// GET /api/memory
app.get('/api/memory', requireAuth, (req, res) => {
  const store = (req as any).userStore as UserDataStore;
  res.json({ memory: store.memoryItems });
});

// POST /api/memory/:id
app.post('/api/memory/:id', requireAuth, (req, res) => {
  const store = (req as any).userStore as UserDataStore;
  const item = store.memoryItems.find((m) => m.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Memory item not found' });
    return;
  }
  item.value = req.body.value || item.value;
  item.lastUpdated = 'Just now';
  res.json({ success: true, memoryItem: item });
});

// POST /api/memory/reset
app.post('/api/memory/reset', requireAuth, (req, res) => {
  const store = (req as any).userStore as UserDataStore;
  store.memoryItems = store.memoryItems.map((m) => ({ ...m, value: 'Not set', lastUpdated: 'Reset just now' }));
  res.json({ success: true, memory: store.memoryItems });
});

// GET /api/permissions
app.get('/api/permissions', requireAuth, (req, res) => {
  const store = (req as any).userStore as UserDataStore;
  res.json({ permissions: store.agentPermissions });
});

// POST /api/permissions/:id
app.post('/api/permissions/:id', requireAuth, (req, res) => {
  const store = (req as any).userStore as UserDataStore;
  const perm = store.agentPermissions.find((p) => p.id === req.params.id);
  if (!perm) {
    res.status(404).json({ error: 'Permission not found' });
    return;
  }
  perm.setting = req.body.setting || perm.setting;
  res.json({ success: true, permission: perm });
});

// GET /api/health (Public healthcheck)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    activeUsersCount: userStores.size,
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Naviq Server running on http://localhost:${PORT}`);
  });
}

startServer();
