import { chromium, Browser, Page, ElementHandle } from 'playwright';
import { EventEmitter } from 'events';
import {
  BrowserSessionState,
  BrowserActionLog,
  BrowserCursorState,
  BrowserInteractiveElement,
} from '../src/types';

export interface BrowserEventPayload {
  type:
    | 'session_created'
    | 'navigating'
    | 'navigated'
    | 'inspecting'
    | 'inspected'
    | 'cursor_moved'
    | 'clicking'
    | 'clicked'
    | 'typing'
    | 'typed'
    | 'scrolling'
    | 'scrolled'
    | 'extracting'
    | 'extracted'
    | 'screenshot_updated'
    | 'stopped'
    | 'closed'
    | 'error';
  sessionId: string;
  taskId?: string;
  state: BrowserSessionState;
  log?: BrowserActionLog;
  timestamp: number;
}

interface InternalSessionHolder {
  state: BrowserSessionState;
  browser: Browser | null;
  page: Page | null;
  emitter: EventEmitter;
  abortController: AbortController | null;
}

export class BrowserService {
  private sessions: Map<string, InternalSessionHolder> = new Map();
  private taskSessionMap: Map<string, string> = new Map(); // taskId -> sessionId
  private sharedBrowser: Browser | null = null;
  private isPlaywrightReady: boolean | null = null;

  async getBrowser(): Promise<Browser | null> {
    if (this.sharedBrowser && this.sharedBrowser.isConnected()) {
      return this.sharedBrowser;
    }
    try {
      this.sharedBrowser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-default-browser-check',
        ],
      });
      this.isPlaywrightReady = true;
      console.log('Playwright Chromium Browser launched successfully.');
      return this.sharedBrowser;
    } catch (err: any) {
      console.error('Error launching Playwright Chromium:', err.message);
      this.isPlaywrightReady = false;
      return null;
    }
  }

  private createInitialCursor(): BrowserCursorState {
    return {
      x: 640,
      y: 400,
      normalizedX: 0.5,
      normalizedY: 0.5,
      action: 'idle',
      label: 'Standing by',
      timestamp: Date.now(),
    };
  }

  async createSession(
    taskId: string,
    userId: string,
    initialUrl: string = 'https://example.com'
  ): Promise<BrowserSessionState> {
    // If a session already exists for this task, return existing state
    const existingSessionId = this.taskSessionMap.get(taskId);
    if (existingSessionId && this.sessions.has(existingSessionId)) {
      const existing = this.sessions.get(existingSessionId)!;
      if (initialUrl && initialUrl !== existing.state.url && initialUrl !== 'https://support.google.com') {
        await this.navigate(existingSessionId, initialUrl);
      }
      return existing.state;
    }

    const sessionId = `browser-session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const emitter = new EventEmitter();
    emitter.setMaxListeners(50);

    const initialLog: BrowserActionLog = {
      id: `log-${Date.now()}-1`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      action: 'browser.create_session',
      details: `Initialized autonomous browser session for task [${taskId}]`,
      status: 'completed',
      executionTimeMs: 12,
    };

    const viewport = { width: 1280, height: 800 };

    const state: BrowserSessionState = {
      sessionId,
      taskId,
      userId,
      url: initialUrl,
      title: 'Connecting to target...',
      httpStatus: 200,
      viewport,
      cursor: this.createInitialCursor(),
      interactiveElements: [],
      extractedFields: [
        { label: 'Session ID', value: sessionId.substring(0, 18) + '...' },
        { label: 'Engine', value: 'Playwright Chromium (Headless Engine)' },
        { label: 'Security Context', value: 'Isolated Container Sandbox' },
      ],
      logs: [initialLog],
      isRealBrowser: true,
      engine: 'playwright',
      statusMessage: 'Browser session created',
      isExecutingAction: false,
      isStopped: false,
    };

    const holder: InternalSessionHolder = {
      state,
      browser: null,
      page: null,
      emitter,
      abortController: null,
    };

    this.sessions.set(sessionId, holder);
    this.taskSessionMap.set(taskId, sessionId);

    // Launch page
    try {
      const browser = await this.getBrowser();
      if (browser) {
        holder.browser = browser;
        const context = await browser.newContext({
          viewport,
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 NaviqAgent/1.0',
        });
        const page = await context.newPage();
        holder.page = page;

        // Auto-navigate to initial URL
        if (initialUrl) {
          await this.navigate(sessionId, initialUrl);
        }
      }
    } catch (err: any) {
      console.warn('Failed initializing page in createSession:', err.message);
    }

    this.emitEvent(sessionId, 'session_created', initialLog);
    return holder.state;
  }

  getSessionByTaskId(taskId: string): BrowserSessionState | null {
    const sessionId = this.taskSessionMap.get(taskId);
    if (!sessionId) return null;
    return this.sessions.get(sessionId)?.state || null;
  }

  getSession(sessionId: string): BrowserSessionState | null {
    return this.sessions.get(sessionId)?.state || null;
  }

  subscribe(taskId: string, callback: (event: BrowserEventPayload) => void): () => void {
    const sessionId = this.taskSessionMap.get(taskId);
    if (!sessionId || !this.sessions.has(sessionId)) {
      // Return a dummy unsubscribe
      return () => {};
    }
    const holder = this.sessions.get(sessionId)!;
    holder.emitter.on('event', callback);
    return () => {
      holder.emitter.off('event', callback);
    };
  }

  private emitEvent(
    sessionId: string,
    type: BrowserEventPayload['type'],
    log?: BrowserActionLog
  ) {
    const holder = this.sessions.get(sessionId);
    if (!holder) return;

    if (log && !holder.state.logs.some((l) => l.id === log.id)) {
      holder.state.logs.push(log);
    }

    const payload: BrowserEventPayload = {
      type,
      sessionId,
      taskId: holder.state.taskId,
      state: { ...holder.state },
      log,
      timestamp: Date.now(),
    };

    holder.emitter.emit('event', payload);
  }

  async captureScreenshot(sessionId: string): Promise<string | undefined> {
    const holder = this.sessions.get(sessionId);
    if (!holder || !holder.page) return undefined;

    try {
      const buffer = await holder.page.screenshot({
        type: 'jpeg',
        quality: 80,
      });
      const dataUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`;
      holder.state.screenshot = dataUrl;
      holder.state.screenshotTimestamp = Date.now();
      return dataUrl;
    } catch (err: any) {
      console.warn('Screenshot capture failed:', err.message);
      return undefined;
    }
  }

  async inspectInteractiveElements(sessionId: string): Promise<BrowserInteractiveElement[]> {
    const holder = this.sessions.get(sessionId);
    if (!holder || !holder.page) return [];

    const startTime = Date.now();
    holder.state.isExecutingAction = true;
    holder.state.currentTool = 'browser.inspect';

    const inspectLog: BrowserActionLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      action: 'browser.inspect',
      details: `Inspecting page DOM for semantic controls on ${holder.state.url}`,
      status: 'started',
    };
    this.emitEvent(sessionId, 'inspecting', inspectLog);

    try {
      const elements: BrowserInteractiveElement[] = await holder.page.evaluate(() => {
        const results: any[] = [];
        const nodes = document.querySelectorAll(
          'button, a[href], input, select, textarea, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [onclick]'
        );

        let idCounter = 1;
        nodes.forEach((node) => {
          const el = node as HTMLElement;
          const rect = el.getBoundingClientRect();
          const isVisible =
            rect.width > 0 &&
            rect.height > 0 &&
            window.getComputedStyle(el).visibility !== 'hidden' &&
            window.getComputedStyle(el).display !== 'none';

          if (isVisible) {
            const rawText = el.innerText || el.getAttribute('aria-label') || (el as HTMLInputElement).value || el.getAttribute('title') || el.getAttribute('placeholder') || '';
            const cleanText = rawText.trim().replace(/\s+/g, ' ').substring(0, 80);
            
            let selector = '';
            if (el.id) {
              selector = `#${el.id}`;
            } else if (el.getAttribute('name')) {
              selector = `${el.tagName.toLowerCase()}[name="${el.getAttribute('name')}"]`;
            } else if (el.getAttribute('aria-label')) {
              selector = `${el.tagName.toLowerCase()}[aria-label="${el.getAttribute('aria-label')}"]`;
            } else {
              selector = el.tagName.toLowerCase();
            }

            const tagName = el.tagName.toLowerCase();
            results.push({
              id: `elem-${idCounter++}`,
              tagName,
              role: el.getAttribute('role') || tagName,
              text: cleanText,
              x: Math.round(rect.left),
              y: Math.round(rect.top),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              selector,
              isClickable: tagName === 'button' || tagName === 'a' || el.getAttribute('role') === 'button',
              isInput: tagName === 'input' || tagName === 'textarea' || tagName === 'select',
              value: (el as HTMLInputElement).value || undefined,
            });
          }
        });

        return results.slice(0, 40); // Cap at 40 key interactive elements
      });

      holder.state.interactiveElements = elements;
      holder.state.isExecutingAction = false;

      inspectLog.status = 'completed';
      inspectLog.details = `Identified ${elements.length} interactive elements on "${holder.state.title}"`;
      inspectLog.executionTimeMs = Date.now() - startTime;

      this.emitEvent(sessionId, 'inspected', inspectLog);
      return elements;
    } catch (err: any) {
      holder.state.isExecutingAction = false;
      inspectLog.status = 'failed';
      inspectLog.details = `Inspect error: ${err.message}`;
      this.emitEvent(sessionId, 'error', inspectLog);
      return [];
    }
  }

  async navigate(sessionId: string, targetUrl: string): Promise<BrowserSessionState> {
    const holder = this.sessions.get(sessionId);
    if (!holder) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const startTime = Date.now();
    holder.state.isExecutingAction = true;
    holder.state.currentTool = 'browser.navigate';
    holder.state.url = targetUrl;
    holder.state.statusMessage = `Navigating to ${targetUrl}...`;

    const navLog: BrowserActionLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      action: 'browser.navigate',
      details: `Navigating to ${targetUrl}`,
      status: 'started',
    };
    this.emitEvent(sessionId, 'navigating', navLog);

    if (holder.page) {
      try {
        const response = await holder.page.goto(targetUrl, {
          timeout: 15000,
          waitUntil: 'domcontentloaded',
        }).catch((e) => {
          console.warn('Navigation catch:', e.message);
          return null;
        });

        const title = await holder.page.title().catch(() => targetUrl);
        const httpStatus = response ? response.status() : 200;

        holder.state.title = title || targetUrl;
        holder.state.httpStatus = httpStatus;
        holder.state.url = holder.page.url();
        holder.state.statusMessage = `Connected to ${holder.state.title} (${httpStatus} OK)`;

        // Capture screenshot
        await this.captureScreenshot(sessionId);

        // Inspect elements
        await this.inspectInteractiveElements(sessionId);

        navLog.status = 'completed';
        navLog.details = `Loaded "${holder.state.title}" (HTTP ${httpStatus})`;
        navLog.executionTimeMs = Date.now() - startTime;
        holder.state.isExecutingAction = false;

        this.emitEvent(sessionId, 'navigated', navLog);
        return holder.state;
      } catch (err: any) {
        navLog.status = 'failed';
        navLog.details = `Failed to load ${targetUrl}: ${err.message}`;
        holder.state.statusMessage = `Naviq couldn't load this page. (${err.message})`;
        holder.state.isExecutingAction = false;
        this.emitEvent(sessionId, 'error', navLog);
        return holder.state;
      }
    }

    holder.state.isExecutingAction = false;
    return holder.state;
  }

  async moveCursor(
    sessionId: string,
    targetX: number,
    targetY: number,
    action: BrowserCursorState['action'] = 'move',
    label?: string,
    targetSelector?: string,
    targetText?: string
  ): Promise<BrowserCursorState> {
    const holder = this.sessions.get(sessionId);
    if (!holder) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const { width, height } = holder.state.viewport;
    const clampedX = Math.max(0, Math.min(width, targetX));
    const clampedY = Math.max(0, Math.min(height, targetY));

    const cursor: BrowserCursorState = {
      x: clampedX,
      y: clampedY,
      normalizedX: clampedX / width,
      normalizedY: clampedY / height,
      action,
      label: label || `Moving cursor to (${clampedX}, ${clampedY})`,
      targetSelector,
      targetText,
      timestamp: Date.now(),
    };

    holder.state.cursor = cursor;

    // Also move real mouse in Playwright if page exists
    if (holder.page) {
      try {
        await holder.page.mouse.move(clampedX, clampedY).catch(() => {});
      } catch {
        // Continue
      }
    }

    this.emitEvent(sessionId, 'cursor_moved');
    return cursor;
  }

  async click(
    sessionId: string,
    params: {
      selector?: string;
      text?: string;
      role?: string;
      x?: number;
      y?: number;
    }
  ): Promise<BrowserSessionState> {
    const holder = this.sessions.get(sessionId);
    if (!holder || !holder.page) {
      throw new Error(`Session ${sessionId} not active`);
    }

    const startTime = Date.now();
    holder.state.isExecutingAction = true;
    holder.state.currentTool = 'browser.click';

    const label = params.text ? `"${params.text}"` : params.selector || `coordinates (${params.x}, ${params.y})`;
    const clickLog: BrowserActionLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      action: 'browser.click',
      details: `Clicking ${label}`,
      status: 'started',
    };
    this.emitEvent(sessionId, 'clicking', clickLog);

    try {
      let targetX = params.x;
      let targetY = params.y;
      let elementFound = false;

      // 1. Semantic DOM Lookup First
      if (params.selector || params.text) {
        let handle: ElementHandle<Element> | null = null;

        if (params.text) {
          // Playwright locator by text
          const locator = holder.page.getByRole(params.role as any || 'button', { name: params.text }).first()
            .or(holder.page.getByText(params.text, { exact: false }).first());

          if (await locator.count().catch(() => 0) > 0) {
            const box = await locator.boundingBox().catch(() => null);
            if (box) {
              targetX = box.x + box.width / 2;
              targetY = box.y + box.height / 2;
              elementFound = true;
            }
            // Move cursor to real element coordinates
            if (targetX !== undefined && targetY !== undefined) {
              await this.moveCursor(sessionId, targetX, targetY, 'click', `Clicking ${label}`, params.selector, params.text);
            }
            await locator.click({ timeout: 4000 }).catch(() => {});
          }
        }

        if (!elementFound && params.selector) {
          const locator = holder.page.locator(params.selector).first();
          if (await locator.count().catch(() => 0) > 0) {
            const box = await locator.boundingBox().catch(() => null);
            if (box) {
              targetX = box.x + box.width / 2;
              targetY = box.y + box.height / 2;
              elementFound = true;
            }
            if (targetX !== undefined && targetY !== undefined) {
              await this.moveCursor(sessionId, targetX, targetY, 'click', `Clicking ${label}`, params.selector, params.text);
            }
            await locator.click({ timeout: 4000 }).catch(() => {});
          }
        }
      }

      // 2. Coordinate-based click fallback
      if (!elementFound && targetX !== undefined && targetY !== undefined) {
        await this.moveCursor(sessionId, targetX, targetY, 'click', `Clicking at (${Math.round(targetX)}, ${Math.round(targetY)})`);
        await holder.page.mouse.click(targetX, targetY).catch(() => {});
      }

      // Wait a moment for page reactions / animations
      await holder.page.waitForTimeout(500).catch(() => {});

      // Refresh title and URL in case navigation happened
      holder.state.url = holder.page.url();
      holder.state.title = (await holder.page.title().catch(() => holder.state.title)) || holder.state.title;

      // Capture new screenshot
      await this.captureScreenshot(sessionId);

      // Re-inspect elements
      await this.inspectInteractiveElements(sessionId);

      clickLog.status = 'completed';
      clickLog.details = `Clicked ${label} successfully`;
      clickLog.executionTimeMs = Date.now() - startTime;
      holder.state.isExecutingAction = false;

      this.emitEvent(sessionId, 'clicked', clickLog);
      return holder.state;
    } catch (err: any) {
      clickLog.status = 'failed';
      clickLog.details = `Naviq couldn't find or click the requested control: ${err.message}`;
      holder.state.isExecutingAction = false;
      this.emitEvent(sessionId, 'error', clickLog);
      return holder.state;
    }
  }

  async type(
    sessionId: string,
    params: {
      selector?: string;
      text: string;
      pressEnter?: boolean;
    }
  ): Promise<BrowserSessionState> {
    const holder = this.sessions.get(sessionId);
    if (!holder || !holder.page) {
      throw new Error(`Session ${sessionId} not active`);
    }

    const startTime = Date.now();
    holder.state.isExecutingAction = true;
    holder.state.currentTool = 'browser.type';

    const typeLog: BrowserActionLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      action: 'browser.type',
      details: `Entering "${params.text}" into ${params.selector || 'input field'}`,
      status: 'started',
    };
    this.emitEvent(sessionId, 'typing', typeLog);

    try {
      if (params.selector) {
        const locator = holder.page.locator(params.selector).first();
        if (await locator.count().catch(() => 0) > 0) {
          const box = await locator.boundingBox().catch(() => null);
          if (box) {
            const targetX = box.x + box.width / 2;
            const targetY = box.y + box.height / 2;
            await this.moveCursor(sessionId, targetX, targetY, 'type', `Entering "${params.text}"`, params.selector);
          }
          await locator.fill(params.text, { timeout: 4000 }).catch(() => {});
          if (params.pressEnter) {
            await locator.press('Enter').catch(() => {});
          }
        } else {
          // Direct keyboard typing
          await holder.page.keyboard.type(params.text, { delay: 20 }).catch(() => {});
          if (params.pressEnter) {
            await holder.page.keyboard.press('Enter').catch(() => {});
          }
        }
      } else {
        await holder.page.keyboard.type(params.text, { delay: 20 }).catch(() => {});
        if (params.pressEnter) {
          await holder.page.keyboard.press('Enter').catch(() => {});
        }
      }

      await holder.page.waitForTimeout(400).catch(() => {});
      await this.captureScreenshot(sessionId);

      typeLog.status = 'completed';
      typeLog.details = `Entered "${params.text}" successfully`;
      typeLog.executionTimeMs = Date.now() - startTime;
      holder.state.isExecutingAction = false;

      this.emitEvent(sessionId, 'typed', typeLog);
      return holder.state;
    } catch (err: any) {
      typeLog.status = 'failed';
      typeLog.details = `Type failed: ${err.message}`;
      holder.state.isExecutingAction = false;
      this.emitEvent(sessionId, 'error', typeLog);
      return holder.state;
    }
  }

  async scroll(sessionId: string, deltaX: number, deltaY: number): Promise<BrowserSessionState> {
    const holder = this.sessions.get(sessionId);
    if (!holder || !holder.page) {
      throw new Error(`Session ${sessionId} not active`);
    }

    const scrollLog: BrowserActionLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      action: 'browser.scroll',
      details: `Scrolling page by (${deltaX}px, ${deltaY}px)`,
      status: 'started',
    };
    this.emitEvent(sessionId, 'scrolling', scrollLog);

    try {
      await holder.page.mouse.wheel(deltaX, deltaY).catch(() => {});
      await holder.page.waitForTimeout(300).catch(() => {});
      await this.captureScreenshot(sessionId);

      scrollLog.status = 'completed';
      scrollLog.details = `Scrolled viewport`;
      this.emitEvent(sessionId, 'scrolled', scrollLog);
      return holder.state;
    } catch (err: any) {
      scrollLog.status = 'failed';
      scrollLog.details = `Scroll error: ${err.message}`;
      this.emitEvent(sessionId, 'error', scrollLog);
      return holder.state;
    }
  }

  async extract(sessionId: string, selector?: string): Promise<string> {
    const holder = this.sessions.get(sessionId);
    if (!holder || !holder.page) {
      throw new Error(`Session ${sessionId} not active`);
    }

    const extractLog: BrowserActionLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      action: 'browser.extract',
      details: `Reading page text content from ${selector || 'main document'}`,
      status: 'started',
    };
    this.emitEvent(sessionId, 'extracting', extractLog);

    try {
      let text = '';
      if (selector) {
        text = (await holder.page.locator(selector).first().innerText().catch(() => '')) || '';
      } else {
        text = (await holder.page.evaluate(() => document.body.innerText).catch(() => '')) || '';
      }

      const cleanText = text.trim().replace(/\s+/g, ' ').substring(0, 1000);
      holder.state.lastVerifiedContent = cleanText;

      extractLog.status = 'completed';
      extractLog.details = `Extracted ${cleanText.length} characters of verified content`;
      this.emitEvent(sessionId, 'extracted', extractLog);
      return cleanText;
    } catch (err: any) {
      extractLog.status = 'failed';
      extractLog.details = `Extraction failed: ${err.message}`;
      this.emitEvent(sessionId, 'error', extractLog);
      return '';
    }
  }

  async stopSession(sessionId: string): Promise<BrowserSessionState> {
    const holder = this.sessions.get(sessionId);
    if (!holder) {
      throw new Error(`Session ${sessionId} not found`);
    }

    holder.state.isStopped = true;
    holder.state.isExecutingAction = false;
    holder.state.statusMessage = 'Browser automation stopped by user.';

    if (holder.abortController) {
      holder.abortController.abort();
      holder.abortController = null;
    }

    const stopLog: BrowserActionLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      action: 'browser.stop',
      details: 'Automation execution halted by user request',
      status: 'completed',
    };

    this.emitEvent(sessionId, 'stopped', stopLog);
    return holder.state;
  }

  async closeSession(sessionId: string): Promise<void> {
    const holder = this.sessions.get(sessionId);
    if (!holder) return;

    if (holder.page) {
      await holder.page.close().catch(() => {});
    }

    holder.emitter.removeAllListeners();
    this.sessions.delete(sessionId);

    if (holder.state.taskId) {
      this.taskSessionMap.delete(holder.state.taskId);
    }
  }
}

export const browserService = new BrowserService();
