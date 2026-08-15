export type NavigationMode = 'show_me' | 'guide_me' | 'do_it_for_me';

export interface NavigationStep {
  id: number | string;
  navigationSessionId?: string;
  instruction: string;
  target: string;
  targetSelector?: string;
  actionType?: 'click' | 'type' | 'select' | 'toggle' | 'hover' | 'navigate';
  status: 'pending' | 'active' | 'completed' | 'skipped' | 'failed';
  stepNumber: number;
  totalSteps: number;
  evidence?: string;
  explanation?: string;
  targetBoundingBox?: { x: number; y: number; width: number; height: number };
  completedAt?: string;
}

export interface CurrentLocationState {
  application: string;
  screen: string;
  state: string;
  url?: string;
  detectedControls: string[];
  confidence: number;
}

export interface NavigationSession {
  id: string;
  conversationId: string;
  userId?: string;
  application: string;
  goal: string;
  mode: NavigationMode;
  location: CurrentLocationState;
  currentStepIndex: number;
  steps: NavigationStep[];
  status: 'planning' | 'navigating' | 'waiting_user_action' | 'executing_agent' | 'completed' | 'recalculating';
  lastActionResult?: string;
  browserSessionId?: string;
  createdAt: string;
  updatedAt: string;
}

export type MissionCategory =
  | 'Money'
  | 'Travel'
  | 'Subscriptions'
  | 'Warranty'
  | 'Complaints'
  | 'Appointments'
  | 'Other';

export type MissionStatus =
  | 'working'
  | 'waiting'
  | 'needs_approval'
  | 'resolved'
  | 'failed';

export type MessageIntent =
  | 'conversation'
  | 'navigation_request'
  | 'guided_task'
  | 'autonomous_task'
  | 'task_request'
  | 'task_update'
  | 'approval_response'
  | 'question_about_task'
  | 'cancel_task'
  | 'cancel';

export interface ChatMessage {
  id: string;
  actionResult?: any;
  conversationId?: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  intent?: MessageIntent;
  taskId?: string;
  task?: FixMission;
  activityLog?: string[];
  
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  actionResult?: any;
  title: string;
  createdAt: string;
  updatedAt: string;
  taskId?: string;
  task?: FixMission;
  activityLog?: string[];
  
  messages: ChatMessage[];
}

export interface ChatResponse {
  actionResult?: any;
  type: 'conversation' | 'navigation' | 'task_created' | 'task_update' | 'approval_response' | 'question_answer' | 'task_cancelled';
  intent: MessageIntent;
  message: string;
  conversationId?: string;
  conversation?: Conversation;
  activityLog?: string[];
  
  taskId?: string;
  task?: FixMission;
  
}

export interface MissionStep {
  id: string;
  title: string;
  status: 'completed' | 'in_progress' | 'pending' | 'waiting';
  description: string;
  timestamp: string;
  details?: string;
}

export interface BrowserCursorState {
  x: number;
  y: number;
  normalizedX: number; // 0 to 1 ratio relative to viewport width
  normalizedY: number; // 0 to 1 ratio relative to viewport height
  action: 'idle' | 'move' | 'hover' | 'click' | 'type' | 'scroll' | 'inspect' | 'extract';
  label?: string;
  targetSelector?: string;
  targetText?: string;
  timestamp: number;
}

export interface BrowserInteractiveElement {
  id: string;
  tagName: string;
  role?: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  selector: string;
  isClickable: boolean;
  isInput: boolean;
  value?: string;
}

export interface BrowserActionLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  status: 'started' | 'completed' | 'failed';
  executionTimeMs?: number;
}

export interface BrowserSessionState {
  sessionId: string;
  taskId?: string;
  userId?: string;
  url: string;
  title: string;
  httpStatus: number;
  screenshot?: string; // base64 data URL from Playwright
  screenshotTimestamp?: number;
  viewport: { width: number; height: number };
  cursor: BrowserCursorState;
  interactiveElements: BrowserInteractiveElement[];
  extractedFields: { label: string; value: string }[];
  logs: BrowserActionLog[];
  isRealBrowser: boolean;
  engine: 'playwright' | 'dom_worker';
  statusMessage: string;
  isExecutingAction: boolean;
  currentTool?: string;
  isStopped: boolean;
  lastVerifiedContent?: string;
}

export interface BrowserSimField {
  label: string;
  value: string;
}

export interface BrowserSimulation {
  targetUrl: string;
  siteName: string;
  orderRef: string;
  simulatedActions: string[];
  fields: BrowserSimField[];
  currentStepIndex?: number;
  isExecuting?: boolean;
  browserState?: BrowserSessionState;
}

export interface ApprovalRequest {
  required: boolean;
  actionTitle: string;
  recipient: string;
  messagePreview: string;
  attachedEvidence: string[];
  status?: 'pending' | 'approved' | 'rejected';
}

export interface ResolutionData {
  outcomeTitle: string;
  outcomeDetail: string;
  actionsTakenCount: number;
  recoveryValue?: string;
  timeSavedMinutes?: number;
  resolvedAt?: string;
}

export interface EvidenceItem {
  id: string;
  title: string;
  type: 'pdf' | 'image' | 'receipt' | 'email' | 'log';
  source: string;
  date: string;
  size?: string;
  verified: boolean;
}

export interface FixMission {
  id: string;
  title: string;
  category: MissionCategory;
  status: MissionStatus;
  progress: number;
  summary: string;
  lastAction: string;
  nextAction: string;
  createdDate: string;
  estimatedTimeSaved: string;
  monetaryValue?: string;
  companyOrTarget: string;
  autonomyLevel: 'Full Auto' | 'Standard (Approve Sensitive)' | 'Strict Supervised';
  reasoningRationale: string;
  steps: MissionStep[];
  browserSimulation: BrowserSimulation;
  approval?: ApprovalRequest;
  resolution?: ResolutionData;
  evidence: EvidenceItem[];
  reportTimeline?: { date: string; event: string; status?: string }[];
}

export interface DatasetFile {
  name: string;
  type: string;
  records: number;
  size?: number;
  preview?: string;
  columns?: string[];
  content?: string;
}

export interface UploadedDataset {
  id: string;
  name: string;
  ownerId?: string;
  files: DatasetFile[];
  totalRecords: number;
  lastAnalyzed: string;
  summary?: string;
  schemas?: { [fileName: string]: string[] };
}

export interface Connection {
  id: string;
  name: string;
  iconName: string;
  category: 'Communication' | 'Shopping & Travel' | 'Payments' | 'System';
  status: 'connected' | 'needs_attention' | 'not_connected';
  description: string;
  lastSynced?: string;
  isBrowserAgent?: boolean;
}

export interface VaultDocument {
  id: string;
  name: string;
  category: 'Receipts' | 'Invoices' | 'Warranty' | 'Travel' | 'Identity' | 'Memberships' | 'Other';
  date: string;
  source: string;
  size: string;
  usedByMission?: string;
  verified: boolean;
}

export interface MemoryItem {
  id: string;
  key: string;
  label: string;
  value: string;
  category: 'Location & Currency' | 'Communication' | 'Travel' | 'Preferences';
  lastUpdated: string;
}

export interface AgentPermission {
  id: string;
  title: string;
  description: string;
  setting: 'on' | 'ask' | 'never';
}

export interface ActivityItem {
  id: string;
  time: string;
  dayGroup: 'Today' | 'Yesterday' | 'Earlier this week';
  title: string;
  description: string;
  missionId?: string;
  missionTitle?: string;
  type: 'investigation' | 'evidence' | 'action' | 'approval' | 'resolution' | 'waiting';
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'approval' | 'resolved' | 'waiting' | 'issue' | 'info';
  missionId?: string;
  read: boolean;
  actionLabel?: string;
}
