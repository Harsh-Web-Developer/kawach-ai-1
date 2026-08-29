import React from 'react';
import { Mail, Sparkles, Trash2, ArrowRight, ShieldCheck, Lock, Terminal, FileText, Send } from 'lucide-react';
import { SampleEmail, TranslationStrings } from '../types';
import { SAMPLE_EMAILS } from '../data/sampleEmails';

interface EmailInputFormProps {
  emailContent: string;
  setEmailContent: (val: string) => void;
  sender: string;
  setSender: (val: string) => void;
  subject: string;
  setSubject: (val: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  onClear: () => void;
  translations: TranslationStrings;
  currentLanguageName: string;
}

export const EmailInputForm: React.FC<EmailInputFormProps> = ({
  emailContent,
  setEmailContent,
  sender,
  setSender,
  subject,
  setSubject,
  onAnalyze,
  isLoading,
  onClear,
  translations,
  currentLanguageName,
}) => {
  const handleSelectSample = (sample: SampleEmail) => {
    setSender(sample.sender);
    setSubject(sample.subject);
    setEmailContent(sample.content);
  };

  const isFormEmpty = !emailContent.trim() && !sender.trim() && !subject.trim();

  return (
    <div
      id="email-input-form-container"
      className="w-full bg-[#0a0a0a] border border-red-900/40 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-red-900/10 relative overflow-hidden"
    >
      {/* Header and Quick Sample Scenarios */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-950/40 border border-red-900/60 text-red-500 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Inspect Suspicious Email
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-red-900/50 bg-red-950/20 text-red-400">
                  {currentLanguageName}
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Paste email body, links, or headers for instant AI threat scanning
              </p>
            </div>
          </div>

          {!isFormEmpty && (
            <button
              id="clear-form-btn"
              onClick={onClear}
              className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-red-950/40 border border-zinc-800 hover:border-red-900/60 text-xs font-medium text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{translations.clearButton}</span>
            </button>
          )}
        </div>

        {/* Quick Sample Emails Pill Bar */}
        <div className="bg-black/80 border border-red-900/20 rounded-xl p-3.5">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            <span>{translations.sampleEmailsTitle} (1-Click Test Scenarios):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_EMAILS.map((sample) => (
              <button
                key={sample.id}
                id={`sample-btn-${sample.id}`}
                onClick={() => handleSelectSample(sample)}
                className="text-xs px-3 py-1.5 rounded-lg bg-[#0e0e11] hover:bg-red-950/40 border border-zinc-800/80 hover:border-red-600/60 text-gray-300 hover:text-white transition-all text-left font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <span>{sample.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Fields */}
      <div className="space-y-4">
        {/* Sender & Subject Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center justify-between uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-red-500" />
                Sender Email (From)
              </span>
              <span className="text-[10px] text-gray-500 lowercase">optional</span>
            </label>
            <input
              id="sender-input"
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder={translations.senderPlaceholder}
              className="w-full bg-black/60 border border-red-900/30 focus:border-red-600 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 outline-none transition-colors font-mono focus:ring-1 focus:ring-red-600/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center justify-between uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-red-500" />
                Email Subject
              </span>
              <span className="text-[10px] text-gray-500 lowercase">optional</span>
            </label>
            <input
              id="subject-input"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={translations.subjectPlaceholder}
              className="w-full bg-black/60 border border-red-900/30 focus:border-red-600 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 outline-none transition-colors focus:ring-1 focus:ring-red-600/40"
            />
          </div>
        </div>

        {/* Email Content TextArea */}
        <div>
          <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center justify-between uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-red-500" />
              Email Body Content & Links (Required)
            </span>
            <span className="text-[11px] text-gray-500 font-mono">
              {emailContent.length} characters
            </span>
          </label>
          <div className="relative">
            <textarea
              id="email-content-textarea"
              rows={8}
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              placeholder={translations.emailPlaceholder}
              className="w-full bg-black/70 border border-red-900/30 focus:border-red-600 rounded-xl p-4 text-sm text-gray-200 placeholder:text-gray-600 outline-none transition-colors font-mono leading-relaxed resize-y focus:ring-1 focus:ring-red-600/40"
            />
            {isLoading && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-xs rounded-xl flex items-center justify-center pointer-events-none">
                <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-red-950 border border-red-600 text-red-200 text-sm font-semibold shadow-2xl">
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  <span>Scanning threat telemetry...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Action Button: CHECK ANALYZE with Sleek styling */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Lock className="w-3.5 h-3.5 text-red-500" />
            <span>Secure telemetry inspection • No sensitive credentials logged</span>
          </div>

          <button
            id="check-analyze-btn"
            onClick={onAnalyze}
            disabled={isLoading || !emailContent.trim()}
            className={`w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-black px-10 py-4 rounded-xl transition-all shadow-[0_4px_20px_rgba(220,38,38,0.3)] flex items-center justify-center gap-2 text-sm tracking-wider uppercase cursor-pointer ${
              isLoading || !emailContent.trim()
                ? 'opacity-50 cursor-not-allowed shadow-none'
                : 'hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{translations.analyzingButton}</span>
              </>
            ) : (
              <>
                <span>{translations.checkAnalyzeButton}</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

