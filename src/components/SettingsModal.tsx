import React, { useState } from 'react';
import {
  X,
  Sliders,
  Sparkles,
  Bot,
  Download,
  Upload,
  Trash2,
  Check,
  Globe,
  Volume2,
} from 'lucide-react';
import { AppSettings, Persona } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  personas: Persona[];
  onExportAll: () => void;
  onImportData: (file: File) => void;
  onClearAllChats: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  personas,
  onExportAll,
  onImportData,
  onClearAllChats,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateSettings(localSettings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportData(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Chat Preferences & AI Settings</h2>
              <p className="text-xs text-zinc-400">Configure model behavior, personas, and memory</p>
            </div>
          </div>
          <button
            id="btn-close-settings-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-zinc-300 scrollbar-thin scrollbar-thumb-zinc-800">
          {/* AI Model */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              <span>Model Engine</span>
            </label>
            <select
              id="select-model"
              value={localSettings.model}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, model: e.target.value })
              }
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="gemini-3.7-flash">Gemini 3.7 Flash (Fast, Multimodal & Highly Capable)</option>
              <option value="gemini-flash-latest">Gemini Flash Latest</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Ultra low latency)</option>
            </select>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-semibold text-zinc-200">
              <label>Creativity (Temperature: {localSettings.temperature})</label>
              <span className="text-[11px] font-normal text-zinc-400">
                {localSettings.temperature <= 0.3
                  ? 'Precise & Direct'
                  : localSettings.temperature <= 0.7
                  ? 'Balanced'
                  : 'Highly Creative'}
              </span>
            </div>
            <input
              id="slider-temperature"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={localSettings.temperature}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  temperature: parseFloat(e.target.value),
                })
              }
              className="w-full accent-indigo-500 bg-zinc-800 rounded-lg h-1.5 cursor-pointer"
            />
          </div>

          {/* Default Persona */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Default AI Persona</span>
            </label>
            <select
              id="select-default-persona"
              value={localSettings.defaultPersonaId}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  defaultPersonaId: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
            >
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.badge})
                </option>
              ))}
            </select>
          </div>

          {/* Custom System Instruction */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-200">
              Custom Instructions (Optional)
            </label>
            <textarea
              id="textarea-custom-system-prompt"
              rows={3}
              placeholder="e.g. Always respond in concise bullet points, format code in TypeScript, address me by name..."
              value={localSettings.customSystemPrompt}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  customSystemPrompt: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 text-xs focus:outline-none focus:border-indigo-500 resize-none placeholder-zinc-600"
            />
          </div>

          {/* Google Search Grounding Default */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-indigo-400" />
              <div>
                <p className="font-semibold text-zinc-200">Web Search Grounding</p>
                <p className="text-[11px] text-zinc-400">
                  Allow Gemini to search Google in real-time
                </p>
              </div>
            </div>
            <input
              id="checkbox-search-grounding"
              type="checkbox"
              checked={localSettings.searchGrounding}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  searchGrounding: e.target.checked,
                })
              }
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {/* Send on Enter toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div>
              <p className="font-semibold text-zinc-200">Press Enter to Send</p>
              <p className="text-[11px] text-zinc-400">Use Shift+Enter for new line</p>
            </div>
            <input
              id="checkbox-enter-to-send"
              type="checkbox"
              checked={localSettings.enterToSend}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  enterToSend: e.target.checked,
                })
              }
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {/* Data Management Section */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-2.5">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-400">
              Data Management & Backup
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-export-chats"
                type="button"
                onClick={onExportAll}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition-colors font-medium text-xs"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export History (JSON)</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                id="btn-import-chats"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition-colors font-medium text-xs"
              >
                <Upload className="w-3.5 h-3.5 text-purple-400" />
                <span>Import Backup</span>
              </button>
            </div>

            <button
              id="btn-clear-all-conversations"
              type="button"
              onClick={() => {
                if (confirm('Are you sure you want to delete all chat history? This cannot be undone.')) {
                  onClearAllChats();
                  onClose();
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-900/40 transition-colors font-medium text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear All Chat History</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-zinc-800 bg-zinc-900/50">
          <button
            id="btn-cancel-settings"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            id="btn-save-settings"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-950/40 transition-colors"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Preferences</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
