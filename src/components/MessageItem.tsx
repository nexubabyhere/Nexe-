import React, { useState } from 'react';
import {
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  ExternalLink,
  Edit3,
  FileCode,
  FileText,
  Sparkles,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MessageItemProps {
  message: ChatMessage;
  onRegenerate?: () => void;
  onEdit?: (newContent: string) => void;
  isLastAssistantMessage?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onRegenerate,
  onEdit,
  isLastAssistantMessage,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleSpeak = async () => {
    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    // Try browser SpeechSynthesis as fast fallback or call backend /api/tts
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        message.content.replace(/```[\s\S]*?```/g, 'Code block.').slice(0, 1500)
      );
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(editContent.trim());
      setIsEditing(false);
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      id={`message-${message.id}`}
      className={`group w-full py-4 px-3 sm:px-6 transition-colors ${
        isUser ? 'bg-transparent' : 'bg-zinc-900/40 border-y border-zinc-800/40'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-3.5 sm:gap-4 items-start">
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-white shadow-sm mt-0.5 ${
            isUser
              ? 'bg-zinc-800 border border-zinc-700 text-zinc-300'
              : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-indigo-950/50'
          }`}
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        {/* Message Body */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header info */}
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-200">
                {isUser ? 'You' : 'Gemini 3.7'}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                <Clock className="w-3 h-3" />
                {formatTime(message.timestamp)}
              </span>
            </div>

            {/* Quick action buttons */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <button
                id={`btn-copy-msg-${message.id}`}
                onClick={handleCopy}
                title="Copy text"
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              {!isUser && (
                <button
                  id={`btn-speak-msg-${message.id}`}
                  onClick={handleSpeak}
                  title={isPlayingAudio ? 'Stop speaking' : 'Read aloud'}
                  className={`p-1 rounded-lg hover:bg-zinc-800 transition-colors ${
                    isPlayingAudio
                      ? 'text-indigo-400 animate-pulse'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {isPlayingAudio ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}

              {isUser && onEdit && !isEditing && (
                <button
                  id={`btn-edit-msg-${message.id}`}
                  onClick={() => setIsEditing(true)}
                  title="Edit prompt"
                  className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}

              {!isUser && isLastAssistantMessage && onRegenerate && (
                <button
                  id={`btn-regenerate-msg-${message.id}`}
                  onClick={onRegenerate}
                  title="Regenerate response"
                  className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Attachments (if any) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2.5 pt-1 pb-1.5">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-950/70 shadow-sm"
                >
                  {att.type === 'image' ? (
                    <img
                      src={att.data}
                      alt={att.name}
                      className="max-h-56 max-w-sm object-cover rounded-lg"
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-zinc-300">
                      {att.type === 'code' ? (
                        <FileCode className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <FileText className="w-4 h-4 text-indigo-400" />
                      )}
                      <span>{att.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Content display or editing mode */}
          {isEditing ? (
            <div className="space-y-2 pt-1">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-zinc-950 border border-indigo-500 rounded-xl p-3 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                rows={3}
              />
              <div className="flex items-center gap-2">
                <button
                  id={`btn-save-edit-${message.id}`}
                  onClick={handleSaveEdit}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  Save & Submit
                </button>
                <button
                  id={`btn-cancel-edit-${message.id}`}
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : message.isError ? (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-rose-200">Generation error</p>
                <p className="text-xs text-rose-300/90 mt-0.5">{message.content}</p>
              </div>
            </div>
          ) : (
            <div className="text-zinc-200">
              {isUser ? (
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-100 font-normal">
                  {message.content}
                </p>
              ) : (
                <MarkdownRenderer content={message.content} />
              )}
            </div>
          )}

          {/* Streaming Indicator */}
          {message.isStreaming && (
            <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium pt-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
              <span className="text-zinc-400">Generating response...</span>
            </div>
          )}

          {/* Grounding Sources (Search Citations) */}
          {message.groundingSources && message.groundingSources.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-zinc-800/80">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Sources & Citations</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {message.groundingSources.map((source, index) => (
                  <a
                    key={index}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-900 text-xs text-indigo-300 transition-colors shadow-sm"
                  >
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                    <span className="max-w-[180px] truncate">{source.title || source.uri}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
