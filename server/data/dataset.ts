import fs from 'fs';
import path from 'path';

export interface Account {
  id: string;
  name: string;
  industry: string;
  region: string;
  tier: string;
  health: string;
  arr: number;
  owner: string;
  devices: string[];
}

export interface Issue {
  id: string;
  account: string;
  category: string;
  status: string;
  title: string;
}

export interface FeatureRequest {
  title: string;
  productArea: string;
  status: string;
  accountsRequesting: string[];
  mentions: number;
  estimatedRevenueImpact: number;
}

export interface Task {
  id: string;
  account: string;
  title: string;
  assignee: string;
  priority: string;
  status: string;
  due: string;
}

export interface Meeting {
  id: string;
  account: string;
  topic: string;
  attendees: string[];
  date: string;
  actionItems: string;
}

export class DatasetManager {
  accounts: Account[] = [];
  issues: Issue[] = [];
  featureRequests: FeatureRequest[] = [];
  tasks: Task[] = [];
  meetings: Meeting[] = [];

  constructor() {
    this.loadData();
  }

  private parseMarkdownTable(content: string): string[][] {
    const lines = content.split('\n');
    const rows = [];
    let isTable = false;
    for (const line of lines) {
      if (line.trim().startsWith('|') && line.includes('---')) {
        isTable = true;
        continue;
      }
      if (line.trim().startsWith('|') && isTable) {
        const columns = line.split('|').map(s => s.trim()).filter((s, i, arr) => i !== 0 && i !== arr.length - 1);
        if (columns.length > 0) {
          rows.push(columns);
        }
      }
    }
    // Remove the header row
    if (rows.length > 0) {
      rows.shift();
    }
    return rows;
  }

  loadData() {
    const dataDir = path.join(process.cwd(), 'server', 'data', 'dataset');
    
    // Accounts
    try {
      const accContent = fs.readFileSync(path.join(dataDir, 'accounts.md'), 'utf-8');
      const accRows = this.parseMarkdownTable(accContent);
      this.accounts = accRows.map(row => ({
        id: row[0],
        name: row[1],
        industry: row[2],
        region: row[3],
        tier: row[4],
        health: row[5],
        arr: parseInt(row[6].replace(/[^0-9]/g, '') || '0'),
        owner: row[7],
        devices: row[8].split(',').map(s => s.trim())
      }));
    } catch (e) { console.error('Failed to load accounts', e); }

    // Issues
    try {
      const issContent = fs.readFileSync(path.join(dataDir, 'issues.md'), 'utf-8');
      const issRows = this.parseMarkdownTable(issContent);
      this.issues = issRows.map(row => ({
        id: row[0],
        account: row[1],
        category: row[2],
        status: row[3],
        title: row[4]
      }));
    } catch (e) { console.error('Failed to load issues', e); }

    // Feature Requests
    try {
      const frContent = fs.readFileSync(path.join(dataDir, 'feature_requests.md'), 'utf-8');
      const frRows = this.parseMarkdownTable(frContent);
      this.featureRequests = frRows.map(row => ({
        title: row[0],
        productArea: row[1],
        status: row[2],
        accountsRequesting: row[3].split(',').map(s => s.trim()),
        mentions: parseInt(row[4] || '0'),
        estimatedRevenueImpact: parseInt(row[5].replace(/[^0-9]/g, '') || '0')
      }));
    } catch (e) { console.error('Failed to load feature requests', e); }

    // Tasks
    try {
      const taskContent = fs.readFileSync(path.join(dataDir, 'tasks.md'), 'utf-8');
      const taskRows = this.parseMarkdownTable(taskContent);
      this.tasks = taskRows.map(row => ({
        id: row[0],
        account: row[1],
        title: row[2],
        assignee: row[3],
        priority: row[4],
        status: row[5],
        due: row[6]
      }));
    } catch (e) { console.error('Failed to load tasks', e); }

    // Meetings
    try {
      const mtgContent = fs.readFileSync(path.join(dataDir, 'meeting_notes.md'), 'utf-8');
      const mtgRows = this.parseMarkdownTable(mtgContent);
      this.meetings = mtgRows.map(row => ({
        id: row[0],
        account: row[1],
        topic: row[2],
        attendees: row[3].split(',').map(s => s.trim()),
        date: row[4],
        actionItems: row[5]
      }));
    } catch (e) { console.error('Failed to load meetings', e); }
  }

  // Cross-dataset search
  search(query: string) {
    const q = query.toLowerCase();
    return {
      accounts: this.accounts.filter(a => a.name.toLowerCase().includes(q) || a.industry.toLowerCase().includes(q)),
      issues: this.issues.filter(i => i.title.toLowerCase().includes(q) || i.account.toLowerCase().includes(q)),
      tasks: this.tasks.filter(t => t.title.toLowerCase().includes(q) || t.account.toLowerCase().includes(q)),
      featureRequests: this.featureRequests.filter(f => f.title.toLowerCase().includes(q) || f.accountsRequesting.some(a => a.toLowerCase().includes(q))),
      meetings: this.meetings.filter(m => m.topic.toLowerCase().includes(q) || m.account.toLowerCase().includes(q) || m.actionItems.toLowerCase().includes(q))
    };
  }

  getAccount360(accountName: string) {
    const account = this.accounts.find(a => a.name.toLowerCase() === accountName.toLowerCase());
    if (!account) return null;

    return {
      account,
      issues: this.issues.filter(i => i.account.toLowerCase() === accountName.toLowerCase()),
      tasks: this.tasks.filter(t => t.account.toLowerCase() === accountName.toLowerCase()),
      featureRequests: this.featureRequests.filter(f => f.accountsRequesting.some(a => a.toLowerCase() === accountName.toLowerCase())),
      meetings: this.meetings.filter(m => m.account.toLowerCase() === accountName.toLowerCase())
    };
  }
}

export const datasetManager = new DatasetManager();
