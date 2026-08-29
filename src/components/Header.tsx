import React, { useState, useRef, useEffect } from 'react';
import { Shield, Globe, ChevronDown, PhoneCall, Mail, Link as LinkIcon, Image as ImageIcon, ExternalLink, BookOpen, AlertCircle, History, Radio } from 'lucide-react';
import { IndianLanguage, TranslationStrings, AppToolMode } from '../types';
import { getHistoryRecords, HISTORY_UPDATED_EVENT } from '../utils/historyStorage';

interface HeaderProps {
  currentLanguage: IndianLanguage;
  onOpenLanguageModal: () => void;
  onOpenHistoryModal: () => void;
  onTriggerQuickAlert?: () => void;
  translations: TranslationStrings;
  activeMode: AppToolMode;
  onSelectMode: (mode: AppToolMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLanguage,
  onOpenLanguageModal,
  onOpenHistoryModal,
  onTriggerQuickAlert,
  translations,
  activeMode,
  onSelectMode,
}) => {
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateHistoryCount = () => {
    setHistoryCount(getHistoryRecords().length);
  };

  useEffect(() => {
    updateHistoryCount();
    window.addEventListener(HISTORY_UPDATED_EVENT, updateHistoryCount);
    return () => window.removeEventListener(HISTORY_UPDATED_EVENT, updateHistoryCount);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setToolsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav
      id="main-app-header"
      className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-red-900/30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex justify-between items-center">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div
            id="brand-shield-logo"
            onClick={() => onSelectMode('email')}
            className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-[0_0_18px_rgba(220,38,38,0.5)] cursor-pointer shrink-0 transition-transform active:scale-95"
            title="KAWACH AI Home"
          >
            <Shield className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black tracking-tighter text-white">
                KAWACH <span className="text-red-600">AI</span>
              </span>
              <span className="hidden md:inline-block px-2 py-0.5 border border-red-600/40 bg-red-950/40 rounded text-red-400 text-[10px] font-mono font-bold uppercase tracking-widest">
                CYBER DEFENSE
              </span>
            </div>
          </div>
        </div>

        {/* Right Side Navigation & Action Tabs */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Tool Selector Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="tools-dropdown-btn"
              type="button"
              onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
              className="flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-red-900/40 text-xs sm:text-sm font-bold text-white transition-all cursor-pointer shadow-sm"
            >
              {activeMode === 'email' && <Mail className="w-4 h-4 text-red-500" />}
              {activeMode === 'link' && <LinkIcon className="w-4 h-4 text-red-500" />}
              {activeMode === 'image' && <ImageIcon className="w-4 h-4 text-red-500" />}
              
              <span className="hidden md:inline">
                {activeMode === 'email' ? 'Email Analyzer' : activeMode === 'link' ? 'Link Verifier' : 'Image Scanner'}
              </span>
              <span className="md:hidden hidden sm:inline">
                {activeMode === 'email' ? 'Email' : activeMode === 'link' ? 'Link' : 'Image'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${toolsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {toolsDropdownOpen && (
              <div
                id="tools-dropdown-menu"
                className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-64 rounded-2xl bg-[#0d0d10] border border-red-900/40 shadow-2xl p-2 z-50 animate-fade-in backdrop-blur-xl"
              >
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold border-b border-zinc-800/80 mb-1">
                  Active Defense Tools
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectMode('email');
                    setToolsDropdownOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    activeMode === 'email' ? 'bg-red-950/60 border border-red-900/50 text-white' : 'hover:bg-zinc-900 text-gray-300'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-black border border-red-900/30 text-red-500 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Email Threat Analyzer</div>
                    <div className="text-[11px] text-gray-400">Inspect email headers, content & spoofing</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectMode('link');
                    setToolsDropdownOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    activeMode === 'link' ? 'bg-red-950/60 border border-red-900/50 text-white' : 'hover:bg-zinc-900 text-gray-300'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-black border border-red-900/30 text-red-500 mt-0.5">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Link & Domain Verifier</div>
                    <div className="text-[11px] text-gray-400">Verify authentic vs fake lookalike URLs</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectMode('image');
                    setToolsDropdownOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    activeMode === 'image' ? 'bg-red-950/60 border border-red-900/50 text-white' : 'hover:bg-zinc-900 text-gray-300'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-black border border-red-900/30 text-red-500 mt-0.5">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Screenshot & Image Scanner</div>
                    <div className="text-[11px] text-gray-400">Detect forged receipts, fake bills & QR traps</div>
                  </div>
                </button>

                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold border-b border-zinc-800/80 mt-2 mb-1">
                  Official Resources
                </div>

                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-900 text-gray-400 hover:text-white text-xs transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 text-red-500" />
                    <span>Cyber Crime Portal (Gov.in)</span>
                  </span>
                </a>
              </div>
            )}
          </div>

          {/* History Tab at Header Right Side */}
          <button
            id="header-history-btn"
            type="button"
            onClick={onOpenHistoryModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-red-900/50 text-xs sm:text-sm font-bold text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm relative group"
            title="View Scan History"
          >
            <History className="w-4 h-4 text-red-500 shrink-0 group-hover:rotate-[-20deg] transition-transform" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-mono font-black shadow-[0_0_8px_rgba(220,38,38,0.6)]">
                {historyCount}
              </span>
            )}
          </button>

          {/* Language Selector Modal Trigger */}
          <button
            id="language-switcher-header-btn"
            type="button"
            onClick={onOpenLanguageModal}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl bg-black/60 hover:bg-zinc-900 border border-zinc-800 hover:border-red-900/50 text-xs sm:text-sm font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
            title="Change Indian Language"
          >
            <Globe className="w-4 h-4 text-red-500 shrink-0" />
            <span className="font-bold">{currentLanguage.name}</span>
            <span className="text-[11px] text-gray-500 hidden lg:inline">({currentLanguage.nativeName})</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          </button>

          {/* National Cyber Helpline 1930 */}
          <a
            id="cyber-helpline-header-link"
            href="tel:1930"
            className="px-3 sm:px-4 py-2 border border-red-600/50 bg-red-950/30 hover:bg-red-600 rounded-xl text-xs font-bold uppercase tracking-wider text-red-400 hover:text-white transition-all flex items-center gap-2 shadow-[0_0_12px_rgba(220,38,38,0.2)]"
            title="Call 1930 National Cyber Crime Reporting Portal"
          >
            <PhoneCall className="w-3.5 h-3.5 shrink-0" />
            <span className="font-mono">1930</span>
          </a>
        </div>
      </div>
    </nav>
  );
};

