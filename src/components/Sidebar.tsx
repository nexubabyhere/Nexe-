import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit2,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Bot,
  ExternalLink,
  Code2,
  Feather,
  BarChart3,
  Lightbulb,
} from 'lucide-react';
import { ChatConversation, Persona } from '../types';

interface SidebarProps {
  conversations: ChatConversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onTogglePin: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onOpenSettings: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  personas: Persona[];
  activePersonaId?: string;
  onSelectPersona: (personaId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onTogglePin,
  onRenameConversation,
  onOpenSettings,
  isCollapsed,
  onToggleCollapse,
  personas,
  activePersonaId,
  onSelectPersona,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

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

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter((c) => c.isPinned);
  const recentConversations = filteredConversations.filter((c) => !c.isPinned);

  const startEditing = (conv: ChatConversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveEditing = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      saveEditing(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  return (
    <aside
      className={`h-full bg-zinc-950/95 border-r border-zinc-800/80 flex flex-col transition-all duration-300 relative z-30 select-none ${
        isCollapsed ? 'w-16' : 'w-72 sm:w-80'
      }`}
    >
      {/* Top Header & App Branding */}
      <div className="p-3.5 border-b border-zinc-800/60 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-950/50">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm text-zinc-100 flex items-center gap-1.5">
                AI Chat
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Pro
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Gemini 3.7 Flash</p>
            </div>
          </div>
        )}

        <button
          id="btn-toggle-sidebar"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors mx-auto"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Action / New Chat Button */}
      <div className="p-3">
        <button
          id="btn-new-chat-sidebar"
          onClick={onNewChat}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-sm ${
            isCollapsed
              ? 'justify-center bg-indigo-600 hover:bg-indigo-500 text-white'
              : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-950/40'
          }`}
          title="Start a new chat (Ctrl+N)"
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!isCollapsed && (
            <div className="flex items-center justify-between w-full">
              <span>New Chat</span>
              <kbd className="text-[10px] bg-indigo-800/60 text-indigo-200 px-1.5 py-0.5 rounded font-mono">
                ⌘N
              </kbd>
            </div>
          )}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Persona Quick Switcher */}
          <div className="px-3 py-1">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-1 mb-1.5 flex items-center gap-1.5">
              <span>Personas</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
              {personas.map((p) => {
                const isActive = activePersonaId === p.id;
                return (
                  <button
                    key={p.id}
                    id={`btn-persona-${p.id}`}
                    onClick={() => onSelectPersona(p.id)}
                    title={p.description}
                    className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                        : 'bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800/60'
                    }`}
                  >
                    {getPersonaIcon(p.icon)}
                    <span>{p.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search input */}
          <div className="px-3 pt-1 pb-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                id="input-search-conversations"
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-900/90 border border-zinc-800/80 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all"
              />
            </div>
          </div>
        </>
      )}

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
        {/* Pinned Chats */}
        {pinnedConversations.length > 0 && !isCollapsed && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 py-1">
              <Pin className="w-3 h-3 text-amber-400" />
              <span>Pinned</span>
            </div>
            {pinnedConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                activeId={activeId}
                editingId={editingId}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                onSelectConversation={onSelectConversation}
                startEditing={startEditing}
                saveEditing={saveEditing}
                handleKeyDown={handleKeyDown}
                onTogglePin={onTogglePin}
                onDeleteConversation={onDeleteConversation}
              />
            ))}
          </div>
        )}

        {/* Recent Chats */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 py-1">
              Recent Chats ({recentConversations.length})
            </div>
          )}

          {conversations.length === 0 ? (
            !isCollapsed && (
              <div className="text-center py-8 px-4 text-xs text-zinc-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-zinc-600 opacity-60" />
                No conversations yet. Start a new chat to begin!
              </div>
            )
          ) : (
            recentConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                activeId={activeId}
                editingId={editingId}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                onSelectConversation={onSelectConversation}
                startEditing={startEditing}
                saveEditing={saveEditing}
                handleKeyDown={handleKeyDown}
                onTogglePin={onTogglePin}
                onDeleteConversation={onDeleteConversation}
                isCollapsed={isCollapsed}
              />
            ))
          )}
        </div>
      </div>

      {/* Bottom Footer Section */}
      <div className="p-2.5 border-t border-zinc-800/80 space-y-1">
        <button
          id="btn-open-settings"
          onClick={onOpenSettings}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title="App Settings & Customization"
        >
          <Settings className="w-4 h-4 shrink-0 text-zinc-400" />
          {!isCollapsed && <span>Settings & Models</span>}
        </button>
      </div>
    </aside>
  );
};

interface ConversationItemProps {
  conv: ChatConversation;
  activeId: string | null;
  editingId: string | null;
  editTitle: string;
  setEditTitle: (val: string) => void;
  onSelectConversation: (id: string) => void;
  startEditing: (conv: ChatConversation, e: React.MouseEvent) => void;
  saveEditing: (id: string) => void;
  handleKeyDown: (e: React.KeyboardEvent, id: string) => void;
  onTogglePin: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  isCollapsed?: boolean;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conv,
  activeId,
  editingId,
  editTitle,
  setEditTitle,
  onSelectConversation,
  startEditing,
  saveEditing,
  handleKeyDown,
  onTogglePin,
  onDeleteConversation,
  isCollapsed,
}) => {
  const isActive = activeId === conv.id;
  const isEditing = editingId === conv.id;

  if (isCollapsed) {
    return (
      <button
        id={`btn-conv-${conv.id}`}
        onClick={() => onSelectConversation(conv.id)}
        title={conv.title}
        className={`w-full p-2.5 rounded-xl flex items-center justify-center transition-all ${
          isActive
            ? 'bg-zinc-800 text-indigo-400 shadow-inner'
            : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
        }`}
      >
        <MessageSquare className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div
      id={`conv-item-${conv.id}`}
      onClick={() => !isEditing && onSelectConversation(conv.id)}
      className={`group relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all duration-150 ${
        isActive
          ? 'bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60'
          : 'text-zinc-300 hover:bg-zinc-900/80 hover:text-white border border-transparent'
      }`}
    >
      <MessageSquare
        className={`w-4 h-4 shrink-0 transition-colors ${
          isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'
        }`}
      />

      {isEditing ? (
        <input
          id={`input-rename-conv-${conv.id}`}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={() => saveEditing(conv.id)}
          onKeyDown={(e) => handleKeyDown(e, conv.id)}
          autoFocus
          className="flex-1 bg-zinc-950 border border-indigo-500 px-1.5 py-0.5 rounded text-xs text-white focus:outline-none"
        />
      ) : (
        <span className="flex-1 truncate text-left">{conv.title}</span>
      )}

      {/* Action Icons on hover */}
      {!isEditing && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
          <button
            id={`btn-pin-conv-${conv.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(conv.id);
            }}
            title={conv.isPinned ? 'Unpin' : 'Pin to top'}
            className={`p-1 rounded hover:bg-zinc-700/70 transition-colors ${
              conv.isPinned ? 'text-amber-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Pin className="w-3 h-3" />
          </button>
          <button
            id={`btn-edit-conv-${conv.id}`}
            onClick={(e) => startEditing(conv, e)}
            title="Rename"
            className="p-1 rounded hover:bg-zinc-700/70 text-zinc-400 hover:text-white transition-colors"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            id={`btn-delete-conv-${conv.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteConversation(conv.id);
            }}
            title="Delete conversation"
            className="p-1 rounded hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
