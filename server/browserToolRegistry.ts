import { browserService } from './browserService';
import { BrowserSessionState, FixMission } from '../src/types';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: any, context: { taskId: string; userId: string; sessionId?: string }) => Promise<any>;
}

class BrowserToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor() {
    this.registerTools();
  }

  private registerTools() {
    // 1. browser.create_session
    this.tools.set('browser.create_session', {
      name: 'browser.create_session',
      description: 'Creates a real Playwright Chromium browser session attached to the user task.',
      parameters: {
        url: { type: 'string', description: 'Initial URL to navigate to', required: false },
      },
      execute: async (args, context) => {
        const state = await browserService.createSession(
          context.taskId,
          context.userId,
          args.url || 'https://support.google.com'
        );
        return { success: true, sessionId: state.sessionId, url: state.url, title: state.title };
      },
    });

    // 2. browser.navigate
    this.tools.set('browser.navigate', {
      name: 'browser.navigate',
      description: 'Navigates the real browser to a specified URL.',
      parameters: {
        url: { type: 'string', description: 'Target URL', required: true },
      },
      execute: async (args, context) => {
        const session = browserService.getSessionByTaskId(context.taskId);
        if (!session) {
          await browserService.createSession(context.taskId, context.userId, args.url);
          return { success: true, url: args.url };
        }
        const state = await browserService.navigate(session.sessionId, args.url);
        return { success: true, url: state.url, title: state.title, httpStatus: state.httpStatus };
      },
    });

    // 3. browser.inspect
    this.tools.set('browser.inspect', {
      name: 'browser.inspect',
      description: 'Performs semantic DOM inspection and locates interactive buttons, links, and input elements with coordinates.',
      parameters: {},
      execute: async (args, context) => {
        const session = browserService.getSessionByTaskId(context.taskId);
        if (!session) throw new Error('No active browser session for this task');
        const elements = await browserService.inspectInteractiveElements(session.sessionId);
        return { success: true, elementCount: elements.length, elements: elements.slice(0, 15) };
      },
    });

    // 4. browser.click
    this.tools.set('browser.click', {
      name: 'browser.click',
      description: 'Moves cursor to target element/coordinates and performs a real click in Playwright.',
      parameters: {
        selector: { type: 'string', description: 'CSS selector or accessible locator', required: false },
        text: { type: 'string', description: 'Visible text or button label', required: false },
        role: { type: 'string', description: 'ARIA role e.g. button, link, tab', required: false },
        x: { type: 'number', description: 'X coordinate (fallback)', required: false },
        y: { type: 'number', description: 'Y coordinate (fallback)', required: false },
      },
      execute: async (args, context) => {
        const session = browserService.getSessionByTaskId(context.taskId);
        if (!session) throw new Error('No active browser session for this task');
        const state = await browserService.click(session.sessionId, args);
        return { success: true, currentUrl: state.url, title: state.title };
      },
    });

    // 5. browser.type
    this.tools.set('browser.type', {
      name: 'browser.type',
      description: 'Focuses on an input field and types real keyboard keystrokes.',
      parameters: {
        selector: { type: 'string', description: 'CSS selector of the input field', required: false },
        text: { type: 'string', description: 'The text value to enter', required: true },
        pressEnter: { type: 'boolean', description: 'Whether to press Enter after typing', required: false },
      },
      execute: async (args, context) => {
        const session = browserService.getSessionByTaskId(context.taskId);
        if (!session) throw new Error('No active browser session for this task');
        const state = await browserService.type(session.sessionId, args);
        return { success: true, typedLength: args.text.length };
      },
    });

    // 6. browser.scroll
    this.tools.set('browser.scroll', {
      name: 'browser.scroll',
      description: 'Scrolls the page viewport.',
      parameters: {
        deltaX: { type: 'number', description: 'Horizontal scroll offset', required: false },
        deltaY: { type: 'number', description: 'Vertical scroll offset', required: true },
      },
      execute: async (args, context) => {
        const session = browserService.getSessionByTaskId(context.taskId);
        if (!session) throw new Error('No active browser session for this task');
        await browserService.scroll(session.sessionId, args.deltaX || 0, args.deltaY);
        return { success: true };
      },
    });

    // 7. browser.extract
    this.tools.set('browser.extract', {
      name: 'browser.extract',
      description: 'Extracts real text content from the loaded page for verification.',
      parameters: {
        selector: { type: 'string', description: 'CSS selector (optional)', required: false },
      },
      execute: async (args, context) => {
        const session = browserService.getSessionByTaskId(context.taskId);
        if (!session) throw new Error('No active browser session for this task');
        const text = await browserService.extract(session.sessionId, args.selector);
        return { success: true, text: text.substring(0, 500) };
      },
    });

    // 8. browser.screenshot
    this.tools.set('browser.screenshot', {
      name: 'browser.screenshot',
      description: 'Captures a fresh screenshot of the browser viewport.',
      parameters: {},
      execute: async (args, context) => {
        const session = browserService.getSessionByTaskId(context.taskId);
        if (!session) throw new Error('No active browser session for this task');
        const screenshot = await browserService.captureScreenshot(session.sessionId);
        return { success: true, hasScreenshot: !!screenshot };
      },
    });

    // 9. browser.stop
    this.tools.set('browser.stop', {
      name: 'browser.stop',
      description: 'Stops active browser automation and halts task progression.',
      parameters: {},
      execute: async (args, context) => {
        const session = browserService.getSessionByTaskId(context.taskId);
        if (!session) return { success: true };
        const state = await browserService.stopSession(session.sessionId);
        return { success: true, isStopped: state.isStopped };
      },
    });

    // 10. browser.close
    this.tools.set('browser.close', {
      name: 'browser.close',
      description: 'Closes the browser session and frees resources.',
      parameters: {},
      execute: async (args, context) => {
        const session = browserService.getSessionByTaskId(context.taskId);
        if (!session) return { success: true };
        await browserService.closeSession(session.sessionId);
        return { success: true };
      },
    });
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  async executeTool(
    toolName: string,
    args: any,
    context: { taskId: string; userId: string }
  ): Promise<any> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool "${toolName}" is not registered in Fixly browser tool registry.`);
    }
    return tool.execute(args, context);
  }

  /**
   * Autonomous Agent Execution Pipeline
   * Runs the real browser automation sequence for a mission.
   */
  async runMissionBrowserAutomation(
    task: FixMission,
    userId: string,
    onProgress?: (stepIndex: number, logMessage: string) => void
  ): Promise<void> {
    const targetUrl = task.browserSimulation?.targetUrl || 'https://www.google.com';

    // 1. Create real browser session
    const sessionState = await browserService.createSession(task.id, userId, targetUrl);

    // Give real Playwright page a moment to complete DOM rendering
    await new Promise((r) => setTimeout(r, 600));

    // 2. Perform DOM inspection
    await browserService.inspectInteractiveElements(sessionState.sessionId);

    // 3. Move cursor to relevant semantic controls based on company
    const elements = sessionState.interactiveElements;
    if (elements.length > 0) {
      // Find a button or link matching search / help / orders / account
      const match =
        elements.find((e) => /order|help|support|search|sign|account|dispute/i.test(e.text)) ||
        elements[0];

      if (match) {
        // Move visible cursor to exact element bounding box center
        const centerX = match.x + match.width / 2;
        const centerY = match.y + match.height / 2;
        await browserService.moveCursor(
          sessionState.sessionId,
          centerX,
          centerY,
          'hover',
          `Inspecting control: "${match.text}"`,
          match.selector,
          match.text
        );
      }
    }

    // 4. Capture screenshot
    await browserService.captureScreenshot(sessionState.sessionId);
  }
}

export const browserToolRegistry = new BrowserToolRegistry();
