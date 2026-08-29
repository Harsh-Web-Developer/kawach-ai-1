import React, { useState } from 'react';
import { Header } from './components/Header';
import { EmailInputForm } from './components/EmailInputForm';
import { AnalysisResults } from './components/AnalysisResults';
import { LinkVerifier } from './components/LinkVerifier';
import { ImageAnalyzer } from './components/ImageAnalyzer';
import { LanguageSelectorModal } from './components/LanguageSelectorModal';
import { HistoryModal } from './components/HistoryModal';
import { EmergencyAlertModal } from './components/EmergencyAlertModal';
import { CyberHelplineBanner } from './components/CyberHelplineBanner';
import { IndianLanguage, EmailAnalysisResult, AppToolMode, ThreatLevel, HistoryRecord } from './types';
import { INDIAN_LANGUAGES, getTranslations } from './data/languages';
import { saveHistoryRecord } from './utils/historyStorage';
import { Shield, Sparkles, AlertCircle, Mail, Link as LinkIcon, Image as ImageIcon, CheckCircle2, ShieldAlert, Radio } from 'lucide-react';

export default function App() {
  // Language State - default to English
  const [selectedLanguage, setSelectedLanguage] = useState<IndianLanguage>(INDIAN_LANGUAGES[0]);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Emergency Alert Modal & Audio State
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyContext, setEmergencyContext] = useState<{
    threatLevel: ThreatLevel;
    threatType: AppToolMode | 'general';
    threatSummary: string;
    target?: string;
    brandName?: string;
  }>({
    threatLevel: 'CRITICAL_PHISH',
    threatType: 'general',
    threatSummary: 'Immediate cyber security alert: Critical threat and deception detected.',
  });

  // Active Tool Mode: 'email' | 'link' | 'image'
  const [activeMode, setActiveMode] = useState<AppToolMode>('email');

  // Email form state
  const [emailContent, setEmailContent] = useState('');
  const [sender, setSender] = useState('');
  const [subject, setSubject] = useState('');

  // Analysis State for Email
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<EmailAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const translations = getTranslations(selectedLanguage.code);

  const handleAnalyzeEmail = async () => {
    if (!emailContent.trim()) {
      setError('Please paste or type an email message to analyze.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailContent,
          sender,
          subject,
          language: selectedLanguage.name,
          languageCode: selectedLanguage.code,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to complete cyber threat analysis.');
      }

      const data: EmailAnalysisResult = await response.json();
      setAnalysisResult(data);

      // Save to Scan History
      saveHistoryRecord({
        type: 'email',
        title: subject ? `Email: ${subject}` : `Email Scan (${sender || 'Unknown Sender'})`,
        target: sender || subject || 'Email Content',
        threatLevel: data.threatLevel,
        riskScore: data.riskScore,
        verdictSummary: data.verdictSummary,
        language: selectedLanguage.name,
        data: data,
      });

      // Smooth scroll down to analysis report
      setTimeout(() => {
        const resultElem = document.getElementById('analysis-results-container');
        if (resultElem) {
          resultElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err.message || 'Unable to analyze email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearEmailForm = () => {
    setEmailContent('');
    setSender('');
    setSubject('');
    setAnalysisResult(null);
    setError(null);
  };

  const handleRestoreRecord = (record: HistoryRecord) => {
    setActiveMode(record.type);
    if (record.type === 'email' && record.data) {
      setAnalysisResult(record.data as EmailAnalysisResult);
      if (record.target) setSender(record.target);
    }
    // Scroll to active tool
    setTimeout(() => {
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }, 150);
  };

  const handleTriggerEmergencyAlert = (params: {
    threatLevel: ThreatLevel;
    threatType: AppToolMode | 'general';
    threatSummary: string;
    target?: string;
    brandName?: string;
  }) => {
    setEmergencyContext(params);
    setIsEmergencyModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-red-600 selection:text-white relative overflow-x-hidden">
      {/* Sleek ambient glow background lights */}
      <div className="fixed top-20 right-20 w-80 h-80 bg-red-900/10 rounded-full blur-[120px] pointer-events-none -z-0" />
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-red-600/5 rounded-full blur-[140px] pointer-events-none -z-0" />

      {/* Top Header with Tools Dropdown & History Tab at right */}
      <Header
        currentLanguage={selectedLanguage}
        onOpenLanguageModal={() => setIsLangModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        translations={translations}
        activeMode={activeMode}
        onSelectMode={setActiveMode}
      />

      {/* Main Sleek Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 space-y-8 relative z-10">
        {/* Sleek Hero Header */}
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 border border-red-600/40 bg-red-950/20 rounded-full text-red-500 text-xs font-bold uppercase tracking-[0.15em] shadow-[0_0_15px_rgba(220,38,38,0.15)]">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Cyber Defense Suite • {selectedLanguage.name} ({selectedLanguage.nativeName})</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black mb-4 leading-none tracking-tight">
            SHIELD AGAINST <span className="text-red-600">CYBER FRAUD</span> & DECEPTION.
          </h1>

          <p className="text-gray-400 text-sm sm:text-base mb-6 max-w-2xl mx-auto leading-relaxed">
            Multi-vector threat intelligence for emails, links, and fake screenshot forensics. Inspect any message before trusting.
          </p>

          {/* Tool Navigation Mode Switcher Tabs */}
          <div
            id="tool-modes-tab-container"
            className="w-full max-w-xl p-1.5 rounded-2xl bg-zinc-950/90 border border-red-900/40 grid grid-cols-3 gap-1 shadow-xl mb-4"
          >
            <button
              id="tab-email-analyzer"
              type="button"
              onClick={() => setActiveMode('email')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeMode === 'email'
                  ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                  : 'text-gray-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Mail className="w-4 h-4 shrink-0" />
              <span className="truncate">Email Analyzer</span>
            </button>

            <button
              id="tab-link-verifier"
              type="button"
              onClick={() => setActiveMode('link')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeMode === 'link'
                  ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                  : 'text-gray-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <LinkIcon className="w-4 h-4 shrink-0" />
              <span className="truncate">Link Verifier</span>
            </button>

            <button
              id="tab-image-analyzer"
              type="button"
              onClick={() => setActiveMode('image')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeMode === 'image'
                  ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                  : 'text-gray-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <ImageIcon className="w-4 h-4 shrink-0" />
              <span className="truncate">Image Scanner</span>
            </button>
          </div>
        </div>

        {/* Dynamic Tool Content */}
        {activeMode === 'email' && (
          <div id="email-mode-container" className="space-y-8 animate-fade-in">
            {error && (
              <div
                id="analysis-error-banner"
                className="flex items-center gap-3 p-4 rounded-xl bg-red-950/80 border border-red-600 text-red-200 text-sm max-w-4xl mx-auto shadow-lg shadow-red-950/50"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Input Form */}
            <EmailInputForm
              emailContent={emailContent}
              setEmailContent={setEmailContent}
              sender={sender}
              setSender={setSender}
              subject={subject}
              setSubject={setSubject}
              onAnalyze={handleAnalyzeEmail}
              isLoading={isLoading}
              onClear={handleClearEmailForm}
              translations={translations}
              currentLanguageName={selectedLanguage.name}
            />

            {/* Email Analysis Results */}
            {analysisResult && (
              <AnalysisResults
                result={analysisResult}
                onReset={handleClearEmailForm}
                onTriggerEmergencyAlert={() =>
                  handleTriggerEmergencyAlert({
                    threatLevel: analysisResult.threatLevel,
                    threatType: 'email',
                    threatSummary: analysisResult.verdictSummary,
                    target: sender || subject || 'Suspicious Email',
                    brandName: analysisResult.brandImpersonated?.brandName,
                  })
                }
                translations={translations}
              />
            )}
          </div>
        )}

        {activeMode === 'link' && (
          <div id="link-mode-container" className="animate-fade-in">
            <LinkVerifier
              selectedLanguage={selectedLanguage}
              translations={translations}
              onTriggerEmergencyAlert={(params) => handleTriggerEmergencyAlert(params)}
            />
          </div>
        )}

        {activeMode === 'image' && (
          <div id="image-mode-container" className="animate-fade-in">
            <ImageAnalyzer
              selectedLanguage={selectedLanguage}
              translations={translations}
              onTriggerEmergencyAlert={(params) => handleTriggerEmergencyAlert(params)}
            />
          </div>
        )}

        {/* Indian Cyber Crime Helpline Banner */}
        <CyberHelplineBanner translations={translations} />
      </main>

      {/* Sleek Footer */}
      <footer className="p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 font-bold uppercase tracking-widest bg-zinc-950 border-t border-red-900/30 gap-4 mt-auto">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-zinc-400">
          <button
            onClick={() => setIsLangModalOpen(true)}
            className="hover:text-red-500 transition-colors cursor-pointer"
          >
            Hindi (हिन्दी)
          </button>
          <button
            onClick={() => setIsLangModalOpen(true)}
            className="hover:text-red-500 transition-colors cursor-pointer"
          >
            Marathi (मराठी)
          </button>
          <button
            onClick={() => setIsLangModalOpen(true)}
            className="hover:text-red-500 transition-colors cursor-pointer"
          >
            Bengali (বাংলা)
          </button>
          <button
            onClick={() => setIsLangModalOpen(true)}
            className="hover:text-red-500 transition-colors cursor-pointer"
          >
            Tamil (தமிழ்)
          </button>
          <button
            onClick={() => setIsLangModalOpen(true)}
            className="hover:text-red-500 transition-colors cursor-pointer"
          >
            Telugu (తెలుగు)
          </button>
          <button
            onClick={() => setIsLangModalOpen(true)}
            className="hover:text-red-500 transition-colors cursor-pointer"
          >
            All 22 Languages
          </button>
        </div>
        <div className="text-gray-400 flex items-center gap-2">
          <span>&copy; {new Date().getFullYear()} KAWACH AI DEFENSE SUITE</span>
        </div>
      </footer>

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={(lang) => {
          setSelectedLanguage(lang);
        }}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onRestoreRecord={handleRestoreRecord}
        onTriggerEmergencyAlert={(record) => {
          handleTriggerEmergencyAlert({
            threatLevel: record.threatLevel,
            threatType: record.type,
            threatSummary: record.verdictSummary,
            target: record.target,
          });
        }}
        translations={translations}
        currentLanguage={selectedLanguage}
      />

      {/* Emergency Voice Alert Audio Dispatcher Modal */}
      <EmergencyAlertModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        threatLevel={emergencyContext.threatLevel}
        threatType={emergencyContext.threatType}
        threatSummary={emergencyContext.threatSummary}
        target={emergencyContext.target}
        brandName={emergencyContext.brandName}
        currentLanguage={selectedLanguage}
      />
    </div>
  );
}

