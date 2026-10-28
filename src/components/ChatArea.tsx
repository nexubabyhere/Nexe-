import React, { useRef, useEffect } from 'react';
import {
  Menu,
  Download,
  Trash2,
  Globe,
  Sparkles,
  Bot,
  Code2,
  Feather,
  BarChart3,
  Lightbulb,
  Share2,
  Check,
} from 'lucide-react';
import { ChatConversation, ChatMessage, MessageAttachment, Persona } from '../types';
import { MessageItem } from './MessageItem';
import { ChatInput } from './ChatInput';

interface ChatAreaProps {
  conversation: ChatConversation | null;
  onSendMessage: (text: string, attachments: MessageAttachment[]) => void;
  onStopGeneration: () => void;
  isStreaming: boolean;
  searchGrounding: boolean;
  onToggleSearchGrounding: () => void;
  enterToSend: boolean;
  onRegenerateLast: () => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onClearMessages: () => void;
  onOpenMobileSidebar: () => void;
  activePersona: Persona;
  onSelectPersona: (id: string) => void;
  personas: Persona[];
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  onSendMessage,
  onStopGeneration,
  isStreaming,
  searchGrounding,
  onToggleSearchGrounding,
  enterToSend,
  onRegenerateLast,
  onEditMessage,
  onClearMessages,
  onOpenMobileSidebar,
  activePersona,
  onSelectPersona,
  personas,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [showExportMenu, setShowExportMenu] = React.useState(false);

  const messages = conversation?.messages || [];

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleExportMarkdown = () => {
    if (!conversation) return;
    let md = `# ${conversation.title}\n\n`;
    conversation.messages.forEach((m) => {
      md += `### ${m.role === 'user' ? 'User' : 'Assistant (Gemini 3.7)'}\n`;
      md += `*${new Date(m.timestamp).toLocaleString()}*\n\n`;
      md += `${m.content}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${conversation.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportJSON = () => {
    if (!conversation) return;
    const blob = new Blob([JSON.stringify(conversation, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${conversation.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const getPersonaIcon = (iconName: string) => {
    switch (iconName) {
      case 'Code2':
        return <Code2 className="w-3.5 h-3.5" />;
      case 'Feather':
        return <Feather className="w-3.5 h-3.5" />;
      case 'BarChart3':
        return <BarChart3 className="w-3.5 h-3.5" />;
      case 'Lightbulb':
        return <Lightbulb className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-zinc-950 overflow-hidden relative">
      {/* Top Header Bar */}
      <header className="h-14 px-4 sm:px-6 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile menu toggle */}
          <button
            id="btn-mobile-sidebar-toggle"
            onClick={onOpenMobileSidebar}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Conversation title & Persona badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="font-semibold text-sm text-zinc-100 truncate max-w-[180px] sm:max-w-xs md:max-w-md">
              {conversation?.title || 'New Chat'}
            </h1>

            {/* Persona Selector Dropdown */}
            <div className="relative group">
              <button
                id="btn-header-persona"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-700 transition-all"
              >
                {getPersonaIcon(activePersona.icon)}
                <span>{activePersona.badge}</span>
              </button>

              <div className="hidden group-hover:block absolute left-0 top-full mt-1 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl p-1.5 z-50">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-2 py-1">
                  Switch Persona
                </p>
                {personas.map((p) => (
                  <button
                    key={p.id}
                    id={`btn-dropdown-persona-${p.id}`}
                    onClick={() => onSelectPersona(p.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-colors ${
                      activePersona.id === p.id
                        ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                        : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    {getPersonaIcon(p.icon)}
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Grounding status badge */}
            {searchGrounding && (
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-[11px] font-medium text-indigo-400">
                <Globe className="w-3 h-3" />
                Web Search
              </span>
            )}
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-1.5">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              id="btn-export-dropdown"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={messages.length === 0}
              title="Export Conversation"
              className={`p-2 rounded-xl text-xs flex items-center gap-1 transition-colors ${
                messages.length === 0
                  ? 'text-zinc-600 cursor-not-allowed'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Download className="w-4 h-4" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                <button
                  id="btn-export-markdown"
                  onClick={handleExportMarkdown}
                  className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg"
                >
                  Export as Markdown (.md)
                </button>
                <button
                  id="btn-export-json"
                  onClick={handleExportJSON}
                  className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg"
                >
                  Export as JSON (.json)
                </button>
              </div>
            )}
          </div>

          {/* Clear Messages */}
          {messages.length > 0 && (
            <button
              id="btn-clear-chat-messages"
              onClick={() => {
                if (confirm('Clear messages in this conversation?')) {
                  onClearMessages();
                }
              }}
              title="Clear messages"
              className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Messages & Conversation Scroll Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
        {messages.length === 0 ? (
          /* Empty State: Persona Welcome + Starter Prompts */
          <div className="h-full max-w-3xl mx-auto px-4 py-8 flex flex-col justify-center items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-xl shadow-indigo-950/60 mb-5">
              <Bot className="w-7 h-7" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              {activePersona.name}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-8 leading-relaxed">
              {activePersona.description}
            </p>

            {/* Prompt Starter Cards */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {activePersona.starterPrompts.map((promptText, idx) => (
                <button
                  key={idx}
                  id={`starter-card-${idx}`}
                  onClick={() => onSendMessage(promptText, [])}
                  className="group p-3.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-indigo-500/50 transition-all duration-200 text-xs text-zinc-300 hover:text-white flex flex-col justify-between shadow-sm hover:shadow-md"
                >
                  <span className="leading-relaxed font-normal">{promptText}</span>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 group-hover:text-indigo-400 font-medium mt-2 pt-1">
                    <span>Ask this prompt</span>
                    <Sparkles className="w-3 h-3 transition-transform group-hover:scale-110" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-zinc-900/50 pb-36">
            {messages.map((msg, index) => (
              <MessageItem
                key={msg.id}
                message={msg}
                onRegenerate={
                  index === messages.length - 1 && msg.role === 'model'
                    ? onRegenerateLast
                    : undefined
                }
                onEdit={
                  msg.role === 'user'
                    ? (newContent) => onEditMessage(msg.id, newContent)
                    : undefined
                }
                isLastAssistantMessage={
                  index === messages.length - 1 && msg.role === 'model'
                }
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Bottom Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent pt-6 pb-4 px-3 sm:px-6 z-20">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            onSendMessage={onSendMessage}
            onStopGeneration={onStopGeneration}
            isStreaming={isStreaming}
            searchGrounding={searchGrounding}
            onToggleSearchGrounding={onToggleSearchGrounding}
            enterToSend={enterToSend}
          />
          <div className="flex items-center justify-between text-[11px] text-zinc-500 px-2 pt-2">
            <span>Powered by Gemini 3.7 Flash & Google GenAI</span>
            <span>Shift + Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
};
