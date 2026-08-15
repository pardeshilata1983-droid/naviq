import React, { useState, useEffect, useCallback } from 'react';
import { Background } from './components/Background';
import { Sidebar } from './components/Sidebar';
import { NotificationPanel } from './components/NotificationPanel';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { AgentWorkspace } from './pages/AgentWorkspace';
import { Tasks } from './pages/Tasks';
import { Activity } from './pages/Activity';
import { Connections } from './pages/Connections';
import { Vault } from './pages/Vault';
import { Customers } from './pages/Customers';
import { Customer360 } from './pages/Customer360';
import { Issues } from './pages/Issues';
import { Features } from './pages/Features';
import { Meetings } from './pages/Meetings';
import { Settings } from './pages/Settings';
import { api, authStorage } from './services/api';
import {
  FixMission,
  ActivityItem,
  NotificationItem,
  Connection,
  VaultDocument,
  MemoryItem,
  AgentPermission,
  Conversation,
  UserProfile,
  NavigationSession,
  NavigationMode,
} from './types';

export default function App() {
  // Authentication & User State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [returnToPath, setReturnToPath] = useState<string | null>(null);

  // Active Navigation Tab
  // Options: 'landing', 'auth', 'onboarding', 'home', 'agent', 'tasks', 'activity', 'connections', 'vault', 'settings'
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [activeNavigationSession, setActiveNavigationSession] = useState<NavigationSession | null>(null);

  // Application Data States (partitioned per user)
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [tasks, setTasks] = useState<FixMission[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [vaultDocuments, setVaultDocuments] = useState<VaultDocument[]>([]);
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([]);
  const [permissions, setPermissions] = useState<AgentPermission[]>([]);

  // UI States
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isCreatingMission, setIsCreatingMission] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // URL routing helper: maps current window pathname to tab & conversation
  const parseRoute = useCallback((authed: boolean, userObj: UserProfile | null) => {
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const returnToParam = searchParams.get('returnTo');

    if (returnToParam) {
      setReturnToPath(returnToParam);
    }

    if (path === '/auth') {
      if (authed) {
        // Authenticated users shouldn't stay on /auth
        setCurrentTab('home');
        window.history.replaceState(null, '', '/');
      } else {
        setCurrentTab('auth');
      }
      return;
    }

    if (path === '/onboarding') {
      if (!authed) {
        setReturnToPath('/onboarding');
        setCurrentTab('auth');
        window.history.replaceState(null, '', '/auth?returnTo=/onboarding');
      } else {
        setCurrentTab('onboarding');
      }
      return;
    }

    if (path === '/landing') {
      setCurrentTab('landing');
      return;
    }

    // Check for private application routes
    const isPrivate =
      path.startsWith('/agent') ||
      path === '/tasks' ||
      path === '/activity' ||
      path === '/connections' ||
      path === '/vault' ||
      path === '/settings' ||
      path === '/home';

    if (isPrivate && !authed) {
      setReturnToPath(path);
      setCurrentTab('auth');
      window.history.replaceState(null, '', `/auth?returnTo=${encodeURIComponent(path)}`);
      return;
    }

    // If root route "/"
    if (path === '/' || path === '') {
      if (authed) {
        if (userObj && !userObj.onboardingCompleted) {
          setCurrentTab('onboarding');
          window.history.replaceState(null, '', '/onboarding');
        } else {
          setCurrentTab('home');
        }
      } else {
        setCurrentTab('landing');
      }
      return;
    }

    // Authenticated private routes
    if (path.startsWith('/agent')) {
      const parts = path.split('/');
      const convId = parts[2];
      setCurrentTab('agent');
      if (convId) {
        setActiveConversationId(convId);
      }
    } else if (path === '/tasks') {
      setCurrentTab('tasks');
    } else if (path === '/activity') {
      setCurrentTab('activity');
    } else if (path === '/connections') {
      setCurrentTab('connections');
    } else if (path === '/vault') {
      setCurrentTab('vault');
    } else if (path === '/settings') {
      setCurrentTab('settings');
    } else {
      setCurrentTab(authed ? 'home' : 'landing');
    }
  }, []);

  // Bootstrap Auth on Mount
  useEffect(() => {
    let isMounted = true;

    async function checkAuthSession() {
      const token = authStorage.getToken();
      if (!token) {
        if (isMounted) {
          setIsAuthenticated(false);
          setUser(null);
          setIsAuthChecking(false);
          parseRoute(false, null);
        }
        return;
      }

      try {
        const res = await api.getMe();
        if (isMounted) {
          setUser(res.user);
          setIsAuthenticated(true);
          setIsAuthChecking(false);
          parseRoute(true, res.user);
        }
      } catch (err) {
        console.warn('Session verification failed, resetting token:', err);
        authStorage.clearToken();
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
          setIsAuthChecking(false);
          parseRoute(false, null);
        }
      }
    }

    checkAuthSession();

    const handlePopState = () => {
      const token = authStorage.getToken();
      parseRoute(!!token && isAuthenticated, user);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      isMounted = false;
      window.removeEventListener('popstate', handlePopState);
    };
  }, [parseRoute, isAuthenticated, user]);

  // Fetch all user-scoped data when authenticated
  const fetchAllData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingData(true);
    try {
      const [
        convsData,
        tasksData,
        activityData,
        notifData,
        connData,
        vaultData,
        memoryData,
        permData,
      ] = await Promise.all([
        api.getConversations(),
        api.getTasks(),
        api.getActivity(),
        api.getNotifications(),
        api.getConnections(),
        api.getVaultDocuments(),
        api.getMemory(),
        api.getPermissions(),
      ]);

      setConversations(convsData);
      setTasks(tasksData);
      setActivityLog(activityData);
      setNotifications(notifData);
      setConnections(connData);
      setVaultDocuments(vaultData);
      setMemoryItems(memoryData);
      setPermissions(permData);

      if (convsData.length > 0 && !activeConversationId) {
        setActiveConversationId(convsData[0].id);
      }
      if (tasksData.length > 0 && !activeMissionId) {
        setActiveMissionId(tasksData[0].id);
      }
      
      // Sync active navigation session
      if (activeConversationId) {
        const activeConv = convsData.find((c: any) => c.id === activeConversationId);
        
      }
    } catch (err: any) {
      console.error('Error fetching Naviq data:', err);
      if (err?.message?.includes('401') || err?.message?.includes('Unauthorized')) {
        authStorage.clearToken();
        setIsAuthenticated(false);
        setUser(null);
        setCurrentTab('auth');
      }
    } finally {
      setIsLoadingData(false);
    }
  }, [isAuthenticated, activeConversationId, activeMissionId]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated, fetchAllData]);

  // Navigation handlers with clean URL history push
  const handleSelectTab = (tab: string) => {
    if (!isAuthenticated) {
      setReturnToPath(`/${tab === 'home' ? '' : tab}`);
      setCurrentTab('auth');
      window.history.pushState(null, '', `/auth?returnTo=/${tab === 'home' ? '' : tab}`);
      return;
    }

    setCurrentTab(tab);
    if (tab === 'home') {
      window.history.pushState(null, '', '/');
    } else if (tab === 'agent') {
      if (activeConversationId) {
        window.history.pushState(null, '', `/agent/${activeConversationId}`);
      } else {
        window.history.pushState(null, '', '/agent');
      }
    } else {
      window.history.pushState(null, '', `/${tab}`);
    }
  };

  const handleOpenConversation = (conversationId: string) => {
    if (!isAuthenticated) {
      setReturnToPath(`/agent/${conversationId}`);
      setCurrentTab('auth');
      window.history.pushState(null, '', `/auth?returnTo=/agent/${conversationId}`);
      return;
    }
    setActiveConversationId(conversationId);
    setCurrentTab('agent');
    window.history.pushState(null, '', `/agent/${conversationId}`);
  };

  const handleOpenMission = (missionId: string) => {
    if (!isAuthenticated) {
      setReturnToPath('/tasks');
      setCurrentTab('auth');
      window.history.pushState(null, '', '/auth?returnTo=/tasks');
      return;
    }
    setActiveMissionId(missionId);
    const attachedConv = conversations.find((c) => c.taskId === missionId);
    if (attachedConv) {
      setActiveConversationId(attachedConv.id);
      window.history.pushState(null, '', `/agent/${attachedConv.id}`);
    }
    setCurrentTab('agent');
  };

  const handleStartConversation = async (message: string, context?: any) => {
    if (!isAuthenticated) {
      setReturnToPath('/home');
      setCurrentTab('auth');
      window.history.pushState(null, '', '/auth?returnTo=/home');
      return;
    }

    setIsCreatingMission(true);
    try {
      const result = await api.createConversation(message);
      const newConv = result.conversation;

      setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
      setActiveConversationId(newConv.id);
      setCurrentTab('agent');
      window.history.pushState(null, '', `/agent/${newConv.id}`);

      if (result.response?.type === 'task_created') {
        const [updatedTasks, updatedActivity] = await Promise.all([
          api.getTasks(),
          api.getActivity(),
        ]);
        setTasks(updatedTasks);
        setActivityLog(updatedActivity);
        if (result.response.taskId) {
          setActiveMissionId(result.response.taskId);
        }
      }

      
    } catch (err: any) {
      console.error('Failed to start conversation:', err);
      setGlobalError(err.message);
    } finally {
      setIsCreatingMission(false);
    }
  };

  const handleSendMessageInActiveConversation = async (message: string, context?: any) => {
    if (!isAuthenticated) {
      setCurrentTab('auth');
      return;
    }

    if (!activeConversationId) {
      await handleStartConversation(message);
      return;
    }

    setIsSendingMessage(true);
    try {
      const response = await api.sendConversationMessage(activeConversationId, message, context);

      const detail = await api.getConversation(activeConversationId);
      if (detail && detail.conversation) {
        const updatedConv: Conversation = {
          ...detail.conversation,
          task: detail.task,
          messages: detail.messages,
        };
        setConversations((prev) =>
          prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
        );
      }

      if (
        response.type === 'task_created' ||
        response.type === 'approval_response' ||
        response.type === 'task_cancelled' ||
        response.type === 'task_update'
      ) {
        const [updatedTasks, updatedActivity] = await Promise.all([
          api.getTasks(),
          api.getActivity(),
        ]);
        setTasks(updatedTasks);
        setActivityLog(updatedActivity);
        if (response.taskId) {
          setActiveMissionId(response.taskId);
        }
      }

      
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setGlobalError(err.message);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setCurrentTab('home');
    window.history.pushState(null, '', '/');
  };

  // Auth Success Handler (called from Auth.tsx)
  const handleAuthSuccess = async (authUser: UserProfile) => {
    setUser(authUser);
    setIsAuthenticated(true);

    if (!authUser.onboardingCompleted) {
      setCurrentTab('onboarding');
      window.history.pushState(null, '', '/onboarding');
      return;
    }

    const destination = returnToPath || '/';
    setReturnToPath(null);

    if (destination.startsWith('/agent')) {
      const parts = destination.split('/');
      const convId = parts[2];
      setCurrentTab('agent');
      if (convId) setActiveConversationId(convId);
      window.history.pushState(null, '', destination);
    } else if (destination === '/tasks' || destination === '/activity' || destination === '/connections' || destination === '/vault' || destination === '/settings') {
      setCurrentTab(destination.replace('/', ''));
      window.history.pushState(null, '', destination);
    } else {
      setCurrentTab('home');
      window.history.pushState(null, '', '/');
    }
  };

  // Onboarding Complete Handler
  const handleOnboardingComplete = () => {
    if (user) {
      setUser({ ...user, onboardingCompleted: true });
    }
    const destination = returnToPath || '/';
    setReturnToPath(null);
    if (destination !== '/onboarding') {
      handleSelectTab(destination.replace('/', '') || 'home');
    } else {
      handleSelectTab('home');
    }
  };

  // Sign out Handler
  const handleSignOut = async () => {
    await api.logout();
    setIsAuthenticated(false);
    setUser(null);
    setConversations([]);
    setTasks([]);
    setActivityLog([]);
    setNotifications([]);
    setCurrentTab('landing');
    window.history.pushState(null, '', '/');
  };

  // Run Demo Handler (handles guest demo flow)
  const handleRunDemo = async () => {
    try {
      // Auto-authenticate as demo user if not logged in
      if (!isAuthenticated) {
        try {
          const authRes = await api.login('user@naviq.ai', 'password123');
          setUser(authRes.user);
          setIsAuthenticated(true);
        } catch {
          const regRes = await api.register('user@naviq.ai', 'password123', 'Naviq User');
          setUser(regRes.user);
          setIsAuthenticated(true);
        }
      }
      const demoTask = await api.createDemoTask();
      await fetchAllData();
      handleOpenMission(demoTask.id);
    } catch (err) {
      console.error('Failed to run demo:', err);
    }
  };

  const handleStopNavigation = async () => {
    if (!activeConversationId) return;
    try {
      await api.stopNavigation(activeConversationId);
      setActiveNavigationSession(null);
      await fetchAllData();
    } catch (err) {
      console.error('Failed to stop navigation:', err);
    }
  };

  const handleNextNavigationStep = async (notes?: string) => {
    if (!activeConversationId) return;
    try {
      const result = await api.advanceNavigationStep(activeConversationId, notes);
      setActiveNavigationSession(result.session);
      // Fetch data to update chat messages
      const detail = await api.getConversation(activeConversationId);
      if (detail && detail.conversation) {
        const updatedConv: Conversation = {
          ...detail.conversation,
          task: detail.task,
          messages: detail.messages,
        };
        setConversations((prev) =>
          prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
        );
      }
    } catch (err) {
      console.error('Failed to advance navigation:', err);
    }
  };

  const handleExecuteNavigationStep = async () => {
    if (!activeConversationId) return;
    setIsProcessingAction(true);
    try {
      const result = await api.executeNavigationStep(activeConversationId);
      setActiveNavigationSession(result.session);
      // Fetch data to update chat messages
      const detail = await api.getConversation(activeConversationId);
      if (detail && detail.conversation) {
        const updatedConv: Conversation = {
          ...detail.conversation,
          task: detail.task,
          messages: detail.messages,
        };
        setConversations((prev) =>
          prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
        );
      }
    } catch (err) {
      console.error('Failed to execute step:', err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleSetNavigationMode = async (mode: NavigationMode) => {
    if (!activeConversationId) return;
    try {
      const result = await api.setNavigationMode(activeConversationId, mode);
      setActiveNavigationSession(result.session);
    } catch (err) {
      console.error('Failed to set mode:', err);
    }
  };

  const handleApproveAction = async (missionId: string) => {
    setIsProcessingAction(true);
    try {
      await api.approveAction(missionId);
      if (activeConversationId) {
        await api.sendConversationMessage(activeConversationId, 'Approve and execute this action');
      }
      await fetchAllData();
    } catch (err) {
      console.error('Failed to approve action:', err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRejectAction = async (missionId: string) => {
    try {
      await api.rejectAction(missionId);
      if (activeConversationId) {
        await api.sendConversationMessage(activeConversationId, 'Reject and cancel this action');
      }
      await fetchAllData();
    } catch (err) {
      console.error('Failed to reject action:', err);
    }
  };

  const handleToggleConnection = async (id: string) => {
    try {
      await api.toggleConnection(id);
      await fetchAllData();
    } catch (err) {
      console.error('Failed to toggle connection:', err);
    }
  };

  const handleUploadVaultDoc = async (doc: Partial<VaultDocument>) => {
    try {
      await api.uploadVaultDocument(doc);
      await fetchAllData();
    } catch (err) {
      console.error('Failed to upload doc:', err);
    }
  };

  const handleUpdateMemory = async (id: string, value: string) => {
    try {
      await api.updateMemory(id, value);
      await fetchAllData();
    } catch (err) {
      console.error('Failed to update memory:', err);
    }
  };

  const handleResetMemory = async () => {
    try {
      await api.resetMemory();
      await fetchAllData();
    } catch (err) {
      console.error('Failed to reset memory:', err);
    }
  };

  const handleUpdatePermission = async (id: string, setting: 'on' | 'ask' | 'never') => {
    try {
      await api.updatePermission(id, setting);
      await fetchAllData();
    } catch (err) {
      console.error('Failed to update permission:', err);
    }
  };

  const handleSelectNotification = (item: NotificationItem) => {
    api.markNotificationRead(item.id);
    setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    if (item.missionId) {
      handleOpenMission(item.missionId);
    }
    setIsNotificationOpen(false);
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Active items resolution
  const currentConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0] || null;
  const currentMission =
    (currentConversation?.taskId && tasks.find((t) => t.id === currentConversation.taskId)) ||
    tasks.find((t) => t.id === activeMissionId) ||
    tasks[0] ||
    null;

  const activeMissionCount = tasks.filter((t) => t.status === 'working' || t.status === 'needs_approval').length;
  const unreadCount = notifications.filter((n) => !n.read).length;

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#03100B] text-white flex items-center justify-center">
        <Background />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <span className="text-xs text-gray-400 font-mono tracking-wider uppercase">Initializing Secure Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#03100B] text-[#f3f4f6] flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Dynamic Background Atmosphere */}
      <Background />

      {/* Public: Landing View */}
      {currentTab === 'landing' && (
        <Landing
          onGetStarted={() => {
            if (isAuthenticated) {
              handleSelectTab('home');
            } else {
              setCurrentTab('auth');
              window.history.pushState(null, '', '/auth');
            }
          }}
          onRunDemo={handleRunDemo}
          onSignIn={() => {
            setCurrentTab('auth');
            window.history.pushState(null, '', '/auth');
          }}
        />
      )}

      {/* Public: Auth Screen */}
      {currentTab === 'auth' && (
        <Auth
          onSuccess={handleAuthSuccess}
          onBackToLanding={() => {
            setCurrentTab('landing');
            window.history.pushState(null, '', '/');
          }}
        />
      )}

      {/* Semi-Private: Onboarding View */}
      {currentTab === 'onboarding' && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}

      {/* Authenticated Application Experience */}
      {isAuthenticated && currentTab !== 'landing' && currentTab !== 'auth' && currentTab !== 'onboarding' && (
        <div className="relative z-10 flex min-h-screen pb-16 md:pb-0">
          {/* Global Floating Glass Sidebar */}
          {currentTab !== 'home' && (<Sidebar
            currentTab={currentTab}
            onSelectTab={handleSelectTab}
            user={user}
            activeMissionCount={activeMissionCount}
            unreadNotificationCount={unreadCount}
            onToggleNotifications={() => setIsNotificationOpen(!isNotificationOpen)}
            isNotificationOpen={isNotificationOpen}
          />)}

          {/* Main Content Workspace View */}
          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
            {currentTab === 'home' && (
              <Home
                tasks={tasks}
                conversations={conversations}
                onStartConversation={handleStartConversation}
                onOpenConversation={handleOpenConversation}
                onOpenMission={handleOpenMission}
                onRunDemo={handleRunDemo}
                isStarting={isCreatingMission}
                onSelectTab={handleSelectTab}
                userDisplayName={user?.name || user?.email?.split('@')[0] || 'Naviq User'}
              />
            )}

            {currentTab === 'agent' && (
              <AgentWorkspace
                conversation={currentConversation}
                task={currentMission}
                navigationSession={activeNavigationSession}
                authToken={authStorage.getToken()}
                onSendMessage={handleSendMessageInActiveConversation}
                onApprove={handleApproveAction}
                onReject={handleRejectAction}
                onBackToHome={() => handleSelectTab('home')}
                onNewConversation={handleNewConversation}
                onStopNavigation={handleStopNavigation}
                onNextNavigationStep={handleNextNavigationStep}
                onExecuteNavigationStep={handleExecuteNavigationStep}
                onSetNavigationMode={handleSetNavigationMode}
                isSendingMessage={isSendingMessage}
                isProcessingAction={isProcessingAction}
              />
            )}

            {currentTab === 'tasks' && (
              <Tasks onAskAgent={(q) => handleStartConversation(q)} />
            )}

            {currentTab === 'activity' && (
              <Activity
                activityLog={activityLog}
                onOpenMission={handleOpenMission}
              />
            )}

            {currentTab === 'connections' && (
              <Connections
                connections={connections}
                onToggleConnection={handleToggleConnection}
              />
            )}

            {currentTab === 'vault' && (
              <Vault
                documents={vaultDocuments}
                onUploadDocument={handleUploadVaultDoc}
              />
            )}

            
            {currentTab === 'customers' && (
              <Customers 
                onSelectCustomer={(name) => {
                  setSelectedCustomer(name);
                  setCurrentTab('customer360');
                }} 
              />
            )}
            {currentTab === 'customer360' && selectedCustomer && (
              <Customer360 
                customerName={selectedCustomer} 
                onBack={() => setCurrentTab('customers')} 
                onAskAgent={(q) => handleStartConversation(q)} 
              />
            )}
            {currentTab === 'issues' && (
              <Issues />
            )}
            {currentTab === 'features' && (
              <Features 
                onAskAgent={(q) => handleStartConversation(q)} 
              />
            )}
            {currentTab === 'meetings' && (
              <Meetings 
                onAskAgent={(q) => handleStartConversation(q)} 
              />
            )}

{currentTab === 'settings' && (
              <Settings
                user={user}
                memoryItems={memoryItems}
                permissions={permissions}
                onUpdateMemory={handleUpdateMemory}
                onResetMemory={handleResetMemory}
                onUpdatePermission={handleUpdatePermission}
                onSignOut={handleSignOut}
              />
            )}
          </main>

          {/* Actionable Notification Panel Drawer */}
          <NotificationPanel
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
            notifications={notifications}
            onSelectNotification={handleSelectNotification}
            onMarkAllRead={handleMarkAllRead}
          />
        </div>
      )}
    </div>
  );
}

