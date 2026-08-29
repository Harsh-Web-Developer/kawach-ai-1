import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, ExternalLink, Globe, Lock, Unlock, Copy, Check, Sparkles, RefreshCw, ArrowRight, CornerDownRight, Volume2 } from 'lucide-react';
import { LinkAnalysisResult, IndianLanguage, TranslationStrings, SampleLink, ThreatLevel } from '../types';
import { SAMPLE_LINKS } from '../data/sampleData';
import { saveHistoryRecord } from '../utils/historyStorage';

interface Props {
  selectedLanguage: IndianLanguage;
  translations: TranslationStrings;
  onTriggerEmergencyAlert?: (params: {
    threatLevel: ThreatLevel;
    threatType: 'link';
    threatSummary: string;
    target: string;
    brandName?: string;
  }) => void;
}

export const LinkVerifier: React.FC<Props> = ({
  selectedLanguage,
  translations,
  onTriggerEmergencyAlert,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LinkAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleVerify = async (targetUrl?: string) => {
    const linkToVerify = (targetUrl || urlInput).trim();
    if (!linkToVerify) {
      setError('Please enter a URL or website address to verify.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/verify-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: linkToVerify,
          language: selectedLanguage.name,
          languageCode: selectedLanguage.code,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error: ${response.status}`);
      }

      const data: LinkAnalysisResult = await response.json();
      setResult(data);

      // Persist to scan history
      saveHistoryRecord({
        type: 'link',
        title: data.isTrusted
          ? `Verified Domain: ${data.domainDetails?.hostname || linkToVerify}`
          : `Suspicious Link: ${data.domainDetails?.hostname || linkToVerify}`,
        target: data.url,
        threatLevel: data.threatLevel,
        riskScore: data.riskScore,
        verdictSummary: data.verdictSummary,
        language: selectedLanguage.name,
        data: data,
      });
    } catch (err: any) {
      console.error('Link verification error:', err);
      setError(err?.message || 'Failed to verify link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = (sample: SampleLink) => {
    setUrlInput(sample.url);
    setError(null);
    handleVerify(sample.url);
  };

  const handleCopyReport = () => {
    if (!result) return;
    const report = `KAWACH AI LINK VERIFICATION REPORT
=====================================
URL: ${result.url}
Trust Status: ${result.isTrusted ? 'TRUSTED / SAFE' : 'UNTRUSTED / FRAUD RISK'}
Threat Level: ${result.threatLevel}
Risk Score: ${result.riskScore}/100
Protocol: ${result.domainDetails?.protocol?.toUpperCase() || 'HTTPS'} (HTTPS: ${result.domainDetails?.isHttps})
Hostname: ${result.domainDetails?.hostname}
Root Domain: ${result.domainDetails?.rootDomain}

VERDICT:
${result.verdictSummary}

BRAND IMPERSONATION:
${result.brandImpersonation?.detected ? `ALERT: Spoofing ${result.brandImpersonation.brandName}` : 'None detected'}

SUSPICIOUS SIGNALS:
${result.suspiciousSignals?.map((s) => `• ${s}`).join('\n')}

RECOMMENDATIONS:
${result.recommendations?.map((r) => `• ${r}`).join('\n')}

National Cyber Crime Helpline (India): 1930 / cybercrime.gov.in
=====================================`;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getThreatBadge = (level: string, isTrusted: boolean) => {
    if (isTrusted || level === 'SAFE') {
      return {
        bg: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400',
        icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
        text: 'TRUSTED & AUTHENTIC',
        glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
      };
    }
    if (level === 'CRITICAL_PHISH') {
      return {
        bg: 'bg-red-950/90 border-red-600 text-red-400',
        icon: <ShieldAlert className="w-5 h-5 text-red-500" />,
        text: 'MALICIOUS / FAKE SPOOF',
        glow: 'shadow-[0_0_25px_rgba(220,38,38,0.35)]',
      };
    }
    return {
      bg: 'bg-amber-950/80 border-amber-600 text-amber-400',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      text: 'SUSPICIOUS / HIGH HAZARD',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    };
  };

  return (
    <div id="link-verifier-workstation" className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-red-900/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/40 border border-red-900/40 text-red-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <Globe className="w-3.5 h-3.5" />
              <span>Link & Domain Security Radar</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Verify Links & Web Addresses
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
              Inspect suspicious URLs before clicking. Identifies lookalike domains, fake banking logins, deceptive TLDs, and masked redirect traps.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-gray-400 bg-black/60 px-3.5 py-2 rounded-xl border border-zinc-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Real-time Reputation Engine</span>
          </div>
        </div>
      </div>

      {/* Input Box */}
      <div className="p-6 sm:p-7 rounded-2xl bg-[#0a0a0a] border border-red-900/30 space-y-5 shadow-xl">
        <div>
          <label htmlFor="url-input" className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
            Target Link / URL to Verify
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
              <Globe className="w-4 h-4 text-red-500" />
            </div>
            <input
              id="url-input"
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              placeholder="Paste any link (e.g. https://login.sbi-bank-verify.xyz/kyc or bit.ly/offer)..."
              className="w-full bg-[#111115] border border-red-900/40 focus:border-red-600 rounded-xl pl-11 pr-24 py-3.5 text-sm text-white placeholder:text-gray-600 outline-none transition-all focus:ring-1 focus:ring-red-600/40 font-mono"
            />
            {urlInput && (
              <button
                id="clear-url-btn"
                type="button"
                onClick={() => {
                  setUrlInput('');
                  setResult(null);
                  setError(null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs text-gray-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/60 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-red-500" />
            <span>Verifying in {selectedLanguage.name} ({selectedLanguage.nativeName})</span>
          </div>

          <button
            id="verify-link-btn"
            type="button"
            onClick={() => handleVerify()}
            disabled={loading || !urlInput.trim()}
            className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Inspecting URL...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Link Safety</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Sample Links */}
        <div className="pt-4 border-t border-zinc-900">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            <span>Try Quick Test URLs</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {SAMPLE_LINKS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleLoadSample(sample)}
                className="p-3 rounded-xl bg-black/60 hover:bg-zinc-950 border border-zinc-800/80 hover:border-red-900/50 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-200 group-hover:text-white truncate">
                    {sample.title}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                      sample.category === 'safe'
                        ? 'bg-emerald-950 text-emerald-400'
                        : sample.category === 'phishing'
                        ? 'bg-red-950 text-red-400'
                        : 'bg-amber-950 text-amber-400'
                    }`}
                  >
                    {sample.category}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-gray-500 truncate mt-1">
                  {sample.url}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div id="link-verification-result" className="space-y-5 animate-fade-in">
          {/* Main Verdict Card */}
          {(() => {
            const badge = getThreatBadge(result.threatLevel, result.isTrusted);
            return (
              <div
                className={`p-6 sm:p-7 rounded-2xl border ${badge.bg} ${badge.glow} relative overflow-hidden backdrop-blur-xl`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-black border border-red-900/40 shrink-0">
                      {badge.icon}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest font-mono bg-black text-white border border-red-900/40">
                          {badge.text}
                        </span>
                        <span className="text-xs text-gray-400 font-mono bg-black/60 px-2.5 py-0.5 rounded border border-zinc-800">
                          Language: {result.language || selectedLanguage.name}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-white mt-2 font-mono break-all">
                        {result.url}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-300 mt-2 leading-relaxed max-w-2xl">
                        {result.verdictSummary}
                      </p>

                      {/* Speak Emergency Alert Button */}
                      {onTriggerEmergencyAlert && (
                        <div className="mt-3.5">
                          <button
                            id="link-speak-alert-btn"
                            type="button"
                            onClick={() =>
                              onTriggerEmergencyAlert({
                                threatLevel: result.threatLevel,
                                threatType: 'link',
                                threatSummary: result.verdictSummary,
                                target: result.url,
                                brandName: result.brandImpersonation?.brandName,
                              })
                            }
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                            <span>{translations.speakAlertButton || '🚨 Speak Emergency Alert'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Risk Score Dial */}
                  <div className="flex items-center gap-4 bg-black/80 border border-red-900/40 rounded-2xl p-4 sm:p-5 shrink-0 self-start lg:self-auto shadow-xl">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-zinc-900"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className={result.isTrusted ? 'text-emerald-500' : result.riskScore >= 60 ? 'text-red-500' : 'text-amber-500'}
                          strokeDasharray={`${result.riskScore}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-base font-black text-white font-mono leading-none">
                          {result.riskScore}
                        </span>
                        <span className="text-[9px] text-gray-400 font-mono">/100</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Hazard Score
                      </div>
                      <div className="text-xs font-mono font-bold text-white mt-0.5">
                        {result.isTrusted ? 'MINIMAL RISK' : result.riskScore >= 70 ? 'CRITICAL RISK' : 'ELEVATED RISK'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Domain Breakdown & Security Checks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Domain Details */}
            <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-red-900/30 space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-red-500" />
                <span>Domain Technical Breakdown</span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/60 border border-zinc-900">
                  <span className="text-gray-400">Hostname:</span>
                  <span className="text-white font-bold">{result.domainDetails?.hostname || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/60 border border-zinc-900">
                  <span className="text-gray-400">Root Domain:</span>
                  <span className="text-white font-bold">{result.domainDetails?.rootDomain || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/60 border border-zinc-900">
                  <span className="text-gray-400">Protocol:</span>
                  <span className="text-white flex items-center gap-1.5">
                    {result.domainDetails?.isHttps ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">HTTPS (Encrypted)</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-red-400">HTTP (Unencrypted)</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/60 border border-zinc-900">
                  <span className="text-gray-400">TLD Extension:</span>
                  <span className="text-white font-bold">{result.domainDetails?.tld || 'N/A'}</span>
                </div>
                {result.brandImpersonation?.detected && (
                  <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300">
                    <span className="font-bold">⚠️ Impersonation Alert:</span> Mimicking{' '}
                    <span className="font-black text-white">{result.brandImpersonation.brandName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Security Checks Matrix */}
            <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-red-900/30 space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-red-500" />
                <span>Security Inspection Checks</span>
              </div>
              <div className="space-y-2">
                {result.securityChecks?.map((check, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-black/60 border border-zinc-900 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-gray-200 flex items-center gap-1.5">
                        {check.passed ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        )}
                        <span>{check.name}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{check.detail}</div>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded shrink-0 uppercase ${
                        check.severity === 'SAFE'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                          : check.severity === 'WARNING'
                          ? 'bg-amber-950 text-amber-400 border border-amber-900'
                          : 'bg-red-950 text-red-400 border border-red-900'
                      }`}
                    >
                      {check.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Suspicious Signals & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Suspicious Signals */}
            <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-red-900/30 space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>Identified Threat Signals</span>
              </div>
              <div className="space-y-2">
                {result.suspiciousSignals?.map((sig, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-black/60 border border-red-900/20 text-xs text-gray-300 font-mono"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <span>{sig}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-red-900/30 space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Actionable Guidance</span>
              </div>
              <div className="space-y-2">
                {result.recommendations?.map((rec, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-black/60 border border-zinc-800 text-xs text-gray-200"
                  >
                    <Shield className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              id="reset-link-analysis-btn"
              type="button"
              onClick={() => {
                setResult(null);
                setUrlInput('');
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-black hover:bg-zinc-900 border border-zinc-800 hover:border-red-900/60 text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Verify Another URL</span>
            </button>

            <button
              id="copy-link-report-btn"
              type="button"
              onClick={handleCopyReport}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Report Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Verification Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
