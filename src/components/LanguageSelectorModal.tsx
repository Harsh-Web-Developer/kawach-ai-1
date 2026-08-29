import React, { useState } from 'react';
import { IndianLanguage } from '../types';
import { INDIAN_LANGUAGES } from '../data/languages';
import { Search, X, Check, Globe, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedLanguage: IndianLanguage;
  onSelectLanguage: (lang: IndianLanguage) => void;
}

export const LanguageSelectorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  selectedLanguage,
  onSelectLanguage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredLanguages = INDIAN_LANGUAGES.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.script.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      id="language-selector-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        id="language-selector-dialog"
        className="w-full max-w-2xl bg-[#0a0a0a] border border-red-900/40 rounded-2xl shadow-2xl shadow-red-950/60 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-red-900/30 bg-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-950/40 border border-red-900/60 flex items-center justify-center text-red-500">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2 tracking-tight">
                Select Indian Language / भाषा चुनें
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950/40 text-red-400 border border-red-900/40 uppercase tracking-wider">
                  22 Languages
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                KAWACH AI converts threat analysis & interface to your chosen language
              </p>
            </div>
          </div>
          <button
            id="close-language-modal-btn"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-4 border-b border-red-900/20 bg-black/80">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-language-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by language (e.g., Hindi, Tamil, বাংলা, Telugu, Odia)..."
              className="w-full bg-[#111115] border border-red-900/30 focus:border-red-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-600 outline-none transition-colors focus:ring-1 focus:ring-red-600/40"
              autoFocus
            />
          </div>
        </div>

        {/* Language Grid */}
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-[#0a0a0a]">
          {filteredLanguages.map((lang) => {
            const isSelected = selectedLanguage.code === lang.code;
            return (
              <button
                key={lang.code}
                id={`lang-select-${lang.code}`}
                onClick={() => {
                  onSelectLanguage(lang);
                  onClose();
                }}
                className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-red-950/40 border-red-600 text-white shadow-lg shadow-red-950/40'
                    : 'bg-black/60 border-zinc-900 hover:border-red-900/50 hover:bg-zinc-950 text-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                      isSelected
                        ? 'bg-red-600 text-white'
                        : 'bg-[#141418] text-gray-400 border border-zinc-800'
                    }`}
                  >
                    {lang.code.toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-1.5">
                      <span>{lang.name}</span>
                      <span className="text-red-400 font-normal text-xs">({lang.nativeName})</span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {lang.region} • <span>{lang.script}</span>
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-black border-t border-red-900/30 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1.5 text-red-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official 8th Schedule Indian Languages</span>
          </div>
          <button
            id="close-language-modal-done-btn"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider text-xs transition-all shadow-[0_0_10px_rgba(220,38,38,0.3)] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

