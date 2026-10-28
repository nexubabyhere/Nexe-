import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsModal } from './components/SettingsModal';
import { PERSONAS, DEFAULT_SETTINGS } from './data/personas';
import { ChatConversation, ChatMessage, MessageAttachment, AppSettings } from './types';

const STORAGE_KEY_CHATS = 'ai_chat_conversations_v1';
const STORAGE_KEY_SETTINGS = 'ai_chat_settings_v1';

export default function App() {
  const [conversations, setConversations] = useState<ChatConversation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHATS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load chats from localStorage:', e);
    }
    return [];
  });

  const [activeId, setActiveId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHATS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0].id;
      }
    } catch (e) {}
    return null;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activePersonaId, setActivePersonaId] = useState(settings.defaultPersonaId || 'general');

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(conversations));
    } catch (e) {
      console.error('Failed to save chats:', e);
    }
  }, [conversations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }, [settings]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePersonaId]);

  // Active conversation helper
  const activeConversation = conversations.find((c) => c.id === activeId) || null;
  const activePersona = PERSONAS.find((p) => p.id === activePersonaId) || PERSONAS[0];

  const handleNewChat = () => {
    const newConv: ChatConversation = {
      id: Math.random().toString(36).substring(2, 11),
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      personaId: activePersonaId,
      systemPrompt: settings.customSystemPrompt,
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
    setIsMobileSidebarOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
    const selected = conversations.find((c) => c.id === id);
    if (selected?.personaId) {
      setActivePersonaId(selected.personaId);
    }
    setIsMobileSidebarOpen(false);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setActiveId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleTogglePin = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  const handleClearMessages = () => {
    if (!activeId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, messages: [] } : c))
    );
  };

  const handleSelectPersona = (personaId: string) => {
    setActivePersonaId(personaId);
    if (activeId) {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, personaId } : c))
      );
    }
  };

  const handleToggleSearchGrounding = () => {
    setSettings((prev) => ({
      ...prev,
      searchGrounding: !prev.searchGrounding,
    }));
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    // Stop isStreaming flag on active message
    if (activeId) {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeId) return c;
          const updatedMessages = c.messages.map((m) =>
            m.isStreaming ? { ...m, isStreaming: false } : m
          );
          return { ...c, messages: updatedMessages };
        })
      );
    }
  };

  // Helper function to stream message from backend
  const executeChatStream = async (
    targetConvId: string,
    historyMessages: ChatMessage[],
    assistantMessageId: string
  ) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsStreaming(true);

    try {
      const persona = PERSONAS.find((p) => p.id === activePersonaId) || PERSONAS[0];
      const systemInstruction = settings.customSystemPrompt
        ? `${persona.systemPrompt}\n\nUser custom instruction: ${settings.customSystemPrompt}`
        : persona.systemPrompt;

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: historyMessages.map((m) => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments,
          })),
          systemInstruction,
          searchGrounding: settings.searchGrounding,
          temperature: settings.temperature,
          model: settings.model || 'gemini-3.7-flash',
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response stream returned.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let accumulatedSources: any[] = [];
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const dataStr = trimmed.replace(/^data: /, '').trim();
          if (dataStr === '[DONE]') break;

          try {
            const data = JSON.parse(dataStr);
            if (data.error) {
              throw new Error(data.error);
            }

            if (data.text) {
              accumulatedText += data.text;
            }

            if (data.groundingChunks && Array.isArray(data.groundingChunks)) {
              accumulatedSources = [...accumulatedSources, ...data.groundingChunks];
            }

            // Update message in state
            setConversations((prev) =>
              prev.map((c) => {
                if (c.id !== targetConvId) return c;
                const updatedMessages = c.messages.map((m) => {
                  if (m.id === assistantMessageId) {
                    return {
                      ...m,
                      content: accumulatedText,
                      groundingSources:
                        accumulatedSources.length > 0 ? accumulatedSources : undefined,
                      isStreaming: true,
                    };
                  }
                  return m;
                });
                return { ...c, messages: updatedMessages, updatedAt: Date.now() };
              })
            );
          } catch (jsonErr) {
            // Ignore partial chunks
          }
        }
      }

      // Mark generation as finished
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== targetConvId) return c;
          const updatedMessages = c.messages.map((m) => {
            if (m.id === assistantMessageId) {
              return {
                ...m,
                content: accumulatedText || 'No response generated.',
                groundingSources:
                  accumulatedSources.length > 0 ? accumulatedSources : undefined,
                isStreaming: false,
              };
            }
            return m;
          });
          return { ...c, messages: updatedMessages, updatedAt: Date.now() };
        })
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted by user');
      } else {
        console.error('Chat error:', err);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== targetConvId) return c;
            const updatedMessages = c.messages.map((m) => {
              if (m.id === assistantMessageId) {
                return {
                  ...m,
                  content: err.message || 'Failed to connect to AI server.',
                  isError: true,
                  isStreaming: false,
                };
              }
              return m;
            });
            return { ...c, messages: updatedMessages, updatedAt: Date.now() };
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleSendMessage = async (text: string, attachments: MessageAttachment[]) => {
    let currentConvId = activeId;
    let targetConv = conversations.find((c) => c.id === currentConvId);

    // If no active conversation or empty, create one
    if (!targetConv) {
      const newConv: ChatConversation = {
        id: Math.random().toString(36).substring(2, 11),
        title: text ? (text.slice(0, 30) + (text.length > 30 ? '...' : '')) : 'New Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        personaId: activePersonaId,
      };
      targetConv = newConv;
      currentConvId = newConv.id;
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(newConv.id);
    }

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const assistantMessageId = Math.random().toString(36).substring(2, 9);
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    const isFirstMessage = targetConv.messages.length === 0;
    const updatedMessages = [...targetConv.messages, userMessage, assistantMessage];

    setConversations((prev) =>
      prev.map((c) =>
        c.id === currentConvId
          ? {
              ...c,
              messages: updatedMessages,
              updatedAt: Date.now(),
            }
          : c
      )
    );

    // Auto generate title on first message in background
    if (isFirstMessage && text) {
      fetch('/api/chat/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.title) {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === currentConvId ? { ...c, title: data.title } : c
              )
            );
          }
        })
        .catch((err) => console.error('Error generating title:', err));
    }

    const historyToSend = [...targetConv.messages, userMessage];
    executeChatStream(currentConvId, historyToSend, assistantMessageId);
  };

  const handleRegenerateLast = () => {
    if (!activeConversation || activeConversation.messages.length === 0) return;
    const messages = [...activeConversation.messages];
    const lastMsg = messages[messages.length - 1];

    if (lastMsg.role !== 'model') return;

    // Remove the last model message
    messages.pop();
    const assistantMessageId = Math.random().toString(36).substring(2, 9);
    const newAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              messages: [...messages, newAssistantMessage],
              updatedAt: Date.now(),
            }
          : c
      )
    );

    executeChatStream(activeConversation.id, messages, assistantMessageId);
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    if (!activeConversation) return;
    const index = activeConversation.messages.findIndex((m) => m.id === messageId);
    if (index === -1) return;

    // Truncate messages up to the edited message and update content
    const truncated = activeConversation.messages.slice(0, index);
    const editedUserMsg: ChatMessage = {
      ...activeConversation.messages[index],
      content: newContent,
      timestamp: Date.now(),
    };

    const assistantMessageId = Math.random().toString(36).substring(2, 9);
    const newAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              messages: [...truncated, editedUserMsg, newAssistantMessage],
              updatedAt: Date.now(),
            }
          : c
      )
    );

    executeChatStream(
      activeConversation.id,
      [...truncated, editedUserMsg],
      assistantMessageId
    );
  };

  const handleExportAll = () => {
    const data = {
      conversations,
      settings,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-chat-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.conversations && Array.isArray(data.conversations)) {
          setConversations(data.conversations);
          if (data.conversations.length > 0) {
            setActiveId(data.conversations[0].id);
          }
        }
        if (data.settings) {
          setSettings(data.settings);
        }
        alert('Chat data imported successfully!');
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllChats = () => {
    setConversations([]);
    setActiveId(null);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 font-sans text-zinc-100 select-text">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
          onTogglePin={handleTogglePin}
          onRenameConversation={handleRenameConversation}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          personas={PERSONAS}
          activePersonaId={activePersonaId}
          onSelectPersona={handleSelectPersona}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative z-50 w-72 h-full bg-zinc-950">
            <Sidebar
              conversations={conversations}
              activeId={activeId}
              onSelectConversation={handleSelectConversation}
              onNewChat={handleNewChat}
              onDeleteConversation={handleDeleteConversation}
              onTogglePin={handleTogglePin}
              onRenameConversation={handleRenameConversation}
              onOpenSettings={() => {
                setIsMobileSidebarOpen(false);
                setIsSettingsOpen(true);
              }}
              isCollapsed={false}
              onToggleCollapse={() => setIsMobileSidebarOpen(false)}
              personas={PERSONAS}
              activePersonaId={activePersonaId}
              onSelectPersona={handleSelectPersona}
            />
          </div>
        </div>
      )}

      {/* Chat Interface Area */}
      <ChatArea
        conversation={activeConversation}
        onSendMessage={handleSendMessage}
        onStopGeneration={handleStopGeneration}
        isStreaming={isStreaming}
        searchGrounding={settings.searchGrounding}
        onToggleSearchGrounding={handleToggleSearchGrounding}
        enterToSend={settings.enterToSend}
        onRegenerateLast={handleRegenerateLast}
        onEditMessage={handleEditMessage}
        onClearMessages={handleClearMessages}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        activePersona={activePersona}
        onSelectPersona={handleSelectPersona}
        personas={PERSONAS}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        personas={PERSONAS}
        onExportAll={handleExportAll}
        onImportData={handleImportData}
        onClearAllChats={handleClearAllChats}
      />
    </div>
  );
}
