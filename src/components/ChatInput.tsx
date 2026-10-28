import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Globe,
  Paperclip,
  Mic,
  MicOff,
  Image as ImageIcon,
  FileCode,
  FileText,
  X,
  Sparkles,
} from 'lucide-react';
import { MessageAttachment } from '../types';

interface ChatInputProps {
  onSendMessage: (text: string, attachments: MessageAttachment[]) => void;
  onStopGeneration: () => void;
  isStreaming: boolean;
  searchGrounding: boolean;
  onToggleSearchGrounding: () => void;
  enterToSend: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopGeneration,
  isStreaming,
  searchGrounding,
  onToggleSearchGrounding,
  enterToSend,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 220)}px`;
    }
  }, [input]);

  // Speech recognition setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript) {
          setInput((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${currentTranscript}` : currentTranscript;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const isCode =
        file.name.endsWith('.ts') ||
        file.name.endsWith('.js') ||
        file.name.endsWith('.py') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.html') ||
        file.name.endsWith('.css') ||
        file.name.endsWith('.md');

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const newAttachment: MessageAttachment = {
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          mimeType: file.type || (isCode ? 'text/plain' : 'application/octet-stream'),
          data: dataUrl,
          size: file.size,
          type: isImage ? 'image' : isCode ? 'code' : 'file',
        };

        setAttachments((prev) => [...prev, newAttachment]);
      };

      reader.readAsDataURL(file);
    });
  };

  // Handle clipboard paste for screenshots
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            setAttachments((prev) => [
              ...prev,
              {
                id: Math.random().toString(36).substring(2, 9),
                name: `screenshot-${new Date().toISOString().slice(11, 19)}.png`,
                mimeType: blob.type || 'image/png',
                data: dataUrl,
                size: blob.size,
                type: 'image',
              },
            ]);
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isStreaming) {
      onStopGeneration();
      return;
    }

    if (!input.trim() && attachments.length === 0) return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    onSendMessage(input.trim(), attachments);
    setInput('');
    setAttachments([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (enterToSend && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-2xl border transition-all duration-200 bg-zinc-900/90 shadow-lg ${
        isDragging
          ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-950/20'
          : 'border-zinc-800/90 focus-within:border-zinc-700/80 focus-within:ring-1 focus-within:ring-indigo-500/20'
      }`}
    >
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-20 border-2 border-dashed border-indigo-400">
          <div className="text-center text-indigo-200">
            <Paperclip className="w-8 h-8 mx-auto mb-2 animate-bounce" />
            <p className="font-semibold text-sm">Drop images or documents here</p>
          </div>
        </div>
      )}

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 pb-0">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="group relative flex items-center gap-2 pl-2 pr-1.5 py-1 bg-zinc-800/90 border border-zinc-700/70 rounded-xl text-xs text-zinc-200 shadow-sm"
            >
              {att.type === 'image' ? (
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-zinc-950 shrink-0 border border-zinc-700">
                  <img
                    src={att.data}
                    alt={att.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : att.type === 'code' ? (
                <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
              )}
              <span className="max-w-[130px] truncate font-medium">{att.name}</span>
              <button
                id={`btn-remove-attachment-${att.id}`}
                onClick={() => removeAttachment(att.id)}
                className="p-1 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Textarea Input */}
      <div className="px-3.5 pt-3 pb-1.5">
        <textarea
          id="chat-textarea"
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            isStreaming
              ? 'Gemini is generating a response...'
              : 'Ask anything, type code, or paste screenshots...'
          }
          rows={1}
          className="w-full bg-transparent resize-none text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none leading-relaxed max-h-56 scrollbar-thin scrollbar-thumb-zinc-800"
        />
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
        {/* Left tools: Attachment, Search grounding, Voice */}
        <div className="flex items-center gap-1.5">
          {/* File input */}
          <input
            id="hidden-file-input"
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.txt,.md,.json,.ts,.tsx,.js,.jsx,.py,.html,.css"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <button
            id="btn-attach-file"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach images, documents, or code"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors flex items-center gap-1 text-xs"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Web Search Grounding Toggle */}
          <button
            id="btn-toggle-search-grounding"
            type="button"
            onClick={onToggleSearchGrounding}
            title={
              searchGrounding
                ? 'Web Search Grounding is ON'
                : 'Turn ON Web Search Grounding'
            }
            className={`p-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              searchGrounding
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
            }`}
          >
            <Globe className={`w-4 h-4 ${searchGrounding ? 'text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Web Search</span>
          </button>

          {/* Speech-to-text recording */}
          <button
            id="btn-voice-input"
            type="button"
            onClick={toggleVoiceRecording}
            title={isRecording ? 'Stop recording voice' : 'Dictate with voice'}
            className={`p-2 rounded-xl text-xs transition-all flex items-center gap-1.5 ${
              isRecording
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isRecording && <span className="text-[11px] font-medium hidden sm:inline">Listening...</span>}
          </button>
        </div>

        {/* Right tools: Send / Stop button */}
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <button
              id="btn-stop-generation"
              type="button"
              onClick={onStopGeneration}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-rose-400 text-xs font-semibold border border-zinc-700/80 shadow-md transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              id="btn-send-message"
              type="button"
              onClick={() => handleSubmit()}
              disabled={!input.trim() && attachments.length === 0}
              className={`p-2 sm:px-3.5 sm:py-1.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all shadow-md ${
                input.trim() || attachments.length > 0
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-950/50'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-800'
              }`}
            >
              <span className="hidden sm:inline">Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
