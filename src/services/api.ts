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
  Conversation,
  UserProfile,
  AuthResponse,
  UploadedDataset,
} from '../types';

const API_BASE = '/api';
const TOKEN_STORAGE_KEY = 'naviq_auth_token';

// Local Token Management
export const authStorage = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem('fixly_auth_token');
    } catch {
      return null;
    }
  },
  setToken(token: string) {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch (err) {
      console.warn('Could not persist token:', err);
    }
  },
  clearToken() {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem('fixly_auth_token');
    } catch (err) {
      console.warn('Could not clear token:', err);
    }
  },
};

// Authenticated fetch wrapper
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, { ...options, headers });
  return res;
}

export const api = {
  // ==========================================
  // Authentication APIs
  // ==========================================

  async login(email: string, password?: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Login failed');
    }
    const data: AuthResponse = await res.json();
    authStorage.setToken(data.token);
    return data;
  },

  async register(email: string, password?: string, name?: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error || 'Registration failed');
    }
    const data: AuthResponse = await res.json();
    authStorage.setToken(data.token);
    return data;
  },

  async getMe(): Promise<{ user: UserProfile }> {
    const res = await authFetch(`${API_BASE}/auth/me`);
    if (!res.ok) {
      throw new Error('Not authenticated');
    }
    return res.json();
  },

  async logout(): Promise<void> {
    try {
      await authFetch(`${API_BASE}/auth/logout`, { method: 'POST' });
    } catch {
      // Ignore network failures on logout
    } finally {
      authStorage.clearToken();
    }
  },

  async completeOnboarding(): Promise<{ user: UserProfile }> {
    const res = await authFetch(`${API_BASE}/auth/onboarding/complete`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to complete onboarding');
    return res.json();
  },

  // ==========================================
  // Modern Conversation APIs (ChatGPT-style)
  // ==========================================

  async createConversation(initialMessage?: string, context?: any): Promise<{ conversation: Conversation; response?: ChatResponse }> {
    const res = await authFetch(`${API_BASE}/conversations`, {
      method: 'POST',
      body: JSON.stringify({ initialMessage, context }),
    });
    if (!res.ok) {
      let errMsg = 'Failed to create conversation';
      try { const errObj = await res.json(); errMsg = errObj.error || errMsg; } catch(e) {}
      throw new Error(errMsg);
    }
    return res.json();
  },

  async getConversations(): Promise<Conversation[]> {
    const res = await authFetch(`${API_BASE}/conversations`);
    if (!res.ok) throw new Error('Failed to fetch conversations');
    const data = await res.json();
    return data.conversations;
  },

  async getConversation(id: string): Promise<{ conversation: Conversation; task?: FixMission; messages: ChatMessage[]; navigationSession?: any }> {
    const res = await authFetch(`${API_BASE}/conversations/${id}`);
    if (!res.ok) throw new Error('Failed to fetch conversation');
    return res.json();
  },

  
  async sendConversationMessageStream(conversationId: string, message: string, context?: any, onLog?: (log: string) => void, onChunk?: (chunk: string) => void): Promise<ChatResponse> {
    const token = authStorage.getToken();
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, context }),
    });

    if (!res.ok) {
      let errMsg = 'Failed to start stream';
      try { const errObj = await res.json(); errMsg = errObj.error || errMsg; } catch(e) {}
      throw new Error(errMsg);
    }
    const reader = res.body?.getReader();
    if (!reader) throw new Error('No readable stream');

    const decoder = new TextDecoder();
    let done = false;
    let finalMessage: any = null;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      if (value) {
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            if (!dataStr) continue;
            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'log' && onLog) onLog(data.log);
              if (data.type === 'chunk' && onChunk) onChunk(data.text);
              if (data.type === 'error') throw new Error(data.error);
              if (data.type === 'done') {
                finalMessage = { response: data.message };
              }
            } catch (e) {
              // ignore parse error for partial chunks
            }
          }
        }
      }
      done = readerDone;
    }
    return finalMessage || { response: { message: 'Stream ended without done event' } };
  },

  async sendConversationMessage(conversationId: string, message: string, context?: any): Promise<ChatResponse> {
    const res = await authFetch(`${API_BASE}/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
    if (!res.ok) {
      let errMsg = 'Failed to send message';
      try { const errObj = await res.json(); errMsg = errObj.error || errMsg; } catch(e) {}
      throw new Error(errMsg);
    }
    return res.json();
  },

  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    const res = await authFetch(`${API_BASE}/conversations/${conversationId}/messages`);
    if (!res.ok) throw new Error('Failed to fetch conversation messages');
    const data = await res.json();
    return data.messages;
  },

  async getConversationTask(conversationId: string): Promise<FixMission | null> {
    const res = await authFetch(`${API_BASE}/conversations/${conversationId}/task`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.task || null;
  },

  async deleteConversation(conversationId: string): Promise<void> {
    await authFetch(`${API_BASE}/conversations/${conversationId}`, { method: 'DELETE' });
  },

  // ==========================================
  // Digital Navigation & Software Maps APIs
  // ==========================================

  async getNavigationSession(conversationId: string): Promise<any> {
    const res = await authFetch(`${API_BASE}/navigation/${conversationId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.session || null;
  },

  async setNavigationMode(conversationId: string, mode: 'show_me' | 'guide_me' | 'do_it_for_me'): Promise<any> {
    const res = await authFetch(`${API_BASE}/navigation/${conversationId}/mode`, {
      method: 'POST',
      body: JSON.stringify({ mode }),
    });
    if (!res.ok) throw new Error('Failed to update navigation mode');
    return res.json();
  },

  async advanceNavigationStep(conversationId: string, notes?: string): Promise<{ session: any; assistantMessage: string; isCompleted: boolean }> {
    const res = await authFetch(`${API_BASE}/navigation/${conversationId}/advance`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    if (!res.ok) throw new Error('Failed to advance step');
    return res.json();
  },

  async observeNavigation(conversationId: string): Promise<{ session: any; feedback: string; reCalculated: boolean }> {
    const res = await authFetch(`${API_BASE}/navigation/${conversationId}/observe`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to observe navigation environment');
    return res.json();
  },

  async executeNavigationStep(conversationId: string): Promise<{ session: any; logDetails: string; isCompleted: boolean }> {
    const res = await authFetch(`${API_BASE}/navigation/${conversationId}/execute`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to execute navigation step');
    return res.json();
  },

  async stopNavigation(conversationId: string): Promise<void> {
    await authFetch(`${API_BASE}/navigation/${conversationId}/stop`, {
      method: 'POST',
    });
  },

  // Company Data Ingestion
  async uploadDataset(
    file: File,
    onStageChange?: (stage: 'uploading' | 'extracting' | 'indexing' | 'ready', progress?: number) => void
  ): Promise<{ success: boolean; dataset: UploadedDataset }> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      const token = authStorage.getToken();

      if (onStageChange) onStageChange('uploading', 0);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onStageChange) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onStageChange('uploading', percent);
          if (percent >= 100) {
            onStageChange('extracting', 100);
            setTimeout(() => {
              onStageChange('indexing', 100);
            }, 600);
          }
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (onStageChange) onStageChange('ready', 100);
            resolve(data);
          } catch (e) {
            reject(new Error('Invalid response format from server'));
          }
        } else {
          let errorMsg = 'Failed to upload dataset';
          try {
            const err = JSON.parse(xhr.responseText);
            errorMsg = err.error || errorMsg;
          } catch (e) {}
          reject(new Error(errorMsg));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error occurred during file upload'));
      });

      xhr.open('POST', `${API_BASE}/datasets/upload`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  },

  async getDatasets(): Promise<UploadedDataset[]> {
    const res = await authFetch(`${API_BASE}/datasets`);
    if (!res.ok) throw new Error('Failed to fetch datasets');
    const data = await res.json();
    return data.datasets || [];
  },

  async sendMessage(message: string, context?: any): Promise<ChatResponse> {
    const res = await authFetch(`${API_BASE}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  async getChatHistory(): Promise<ChatMessage[]> {
    const res = await authFetch(`${API_BASE}/chat/history`);
    if (!res.ok) throw new Error('Failed to fetch chat history');
    const data = await res.json();
    return data.messages;
  },

  async clearChatHistory(): Promise<void> {
    await authFetch(`${API_BASE}/chat/clear`, { method: 'POST' });
  },

  async createDemoTask(): Promise<FixMission> {
    const res = await authFetch(`${API_BASE}/tasks/demo`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to create demo mission');
    const data = await res.json();
    return data.task;
  },

  // Tasks / Missions
  async getTasks(statusFilter?: string): Promise<FixMission[]> {
    const url = statusFilter ? `${API_BASE}/tasks?status=${encodeURIComponent(statusFilter)}` : `${API_BASE}/tasks`;
    const res = await authFetch(url);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    const data = await res.json();
    return data.tasks;
  },

  async getTask(id: string): Promise<FixMission> {
    const res = await authFetch(`${API_BASE}/tasks/${id}`);
    if (!res.ok) throw new Error('Failed to fetch task');
    const data = await res.json();
    return data.task;
  },

  async createTask(problem: string, context?: any): Promise<FixMission> {
    const res = await authFetch(`${API_BASE}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ problem, context }),
    });
    if (!res.ok) throw new Error('Failed to create task');
    const data = await res.json();
    return data.task;
  },

  async runTaskStep(taskId: string, currentStepIndex: number): Promise<FixMission> {
    const res = await authFetch(`${API_BASE}/tasks/${taskId}/run`, {
      method: 'POST',
      body: JSON.stringify({ stepIndex: currentStepIndex }),
    });
    if (!res.ok) throw new Error('Failed to advance task');
    const data = await res.json();
    return data.task;
  },

  async approveAction(taskId: string, approvalNote?: string): Promise<FixMission> {
    const res = await authFetch(`${API_BASE}/tasks/${taskId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approvalNote }),
    });
    if (!res.ok) throw new Error('Failed to approve action');
    const data = await res.json();
    return data.task;
  },

  async rejectAction(taskId: string, reason?: string): Promise<FixMission> {
    const res = await authFetch(`${API_BASE}/tasks/${taskId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to reject action');
    const data = await res.json();
    return data.task;
  },

  // Activities
  async getActivity(): Promise<ActivityItem[]> {
    const res = await authFetch(`${API_BASE}/activity`);
    if (!res.ok) throw new Error('Failed to fetch activity');
    const data = await res.json();
    return data.activity;
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await authFetch(`${API_BASE}/notifications`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    const data = await res.json();
    return data.notifications;
  },

  async markNotificationRead(id: string): Promise<void> {
    await authFetch(`${API_BASE}/notifications/${id}/read`, { method: 'POST' });
  },

  async markAllNotificationsRead(): Promise<void> {
    await authFetch(`${API_BASE}/notifications/read-all`, { method: 'POST' });
  },

  // Connections
  async getConnections(): Promise<Connection[]> {
    const res = await authFetch(`${API_BASE}/connections`);
    if (!res.ok) throw new Error('Failed to fetch connections');
    const data = await res.json();
    return data.connections;
  },

  async toggleConnection(id: string): Promise<Connection> {
    const res = await authFetch(`${API_BASE}/connections/${id}/toggle`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to toggle connection');
    const data = await res.json();
    return data.connection;
  },

  // Vault
  async getVaultDocuments(): Promise<VaultDocument[]> {
    const res = await authFetch(`${API_BASE}/vault`);
    if (!res.ok) throw new Error('Failed to fetch vault');
    const data = await res.json();
    return data.documents;
  },

  async uploadVaultDocument(doc: Partial<VaultDocument>): Promise<VaultDocument> {
    const res = await authFetch(`${API_BASE}/vault/upload`, {
      method: 'POST',
      body: JSON.stringify(doc),
    });
    if (!res.ok) throw new Error('Failed to upload document');
    const data = await res.json();
    return data.document;
  },

  // Memory & Preferences
  async getMemory(): Promise<MemoryItem[]> {
    const res = await authFetch(`${API_BASE}/memory`);
    if (!res.ok) throw new Error('Failed to fetch memory');
    const data = await res.json();
    return data.memory;
  },

  async updateMemory(id: string, value: string): Promise<MemoryItem> {
    const res = await authFetch(`${API_BASE}/memory/${id}`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    });
    if (!res.ok) throw new Error('Failed to update memory');
    const data = await res.json();
    return data.memoryItem;
  },

  async resetMemory(): Promise<void> {
    await authFetch(`${API_BASE}/memory/reset`, { method: 'POST' });
  },

  // Permissions
  async getPermissions(): Promise<AgentPermission[]> {
    const res = await authFetch(`${API_BASE}/permissions`);
    if (!res.ok) throw new Error('Failed to fetch permissions');
    const data = await res.json();
    return data.permissions;
  },

  async updatePermission(id: string, setting: 'on' | 'ask' | 'never'): Promise<AgentPermission> {
    const res = await authFetch(`${API_BASE}/permissions/${id}`, {
      method: 'POST',
      body: JSON.stringify({ setting }),
    });
    if (!res.ok) throw new Error('Failed to update permission');
    const data = await res.json();
    return data.permission;
  },

  // Data Methods
  async getAccounts(): Promise<any[]> {
    const res = await authFetch(`${API_BASE}/data/accounts`);
    const data = await res.json();
    return data.accounts;
  },
  async getIssues(): Promise<any[]> {
    const res = await authFetch(`${API_BASE}/data/issues`);
    const data = await res.json();
    return data.issues;
  },
  async getFeatures(): Promise<any[]> {
    const res = await authFetch(`${API_BASE}/data/features`);
    const data = await res.json();
    return data.features;
  },
  async getTasksData(): Promise<any[]> {
    const res = await authFetch(`${API_BASE}/data/tasks`);
    const data = await res.json();
    return data.tasks;
  },
  async getMeetings(): Promise<any[]> {
    const res = await authFetch(`${API_BASE}/data/meetings`);
    const data = await res.json();
    return data.meetings;
  },
  async getAccount360(name: string): Promise<any> {
    const res = await authFetch(`${API_BASE}/data/accounts/${encodeURIComponent(name)}`);
    return res.json();
  },
};

