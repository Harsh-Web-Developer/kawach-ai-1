import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, UploadCloud, AlertTriangle, ShieldCheck, ShieldAlert, Check, Copy, RefreshCw, Sparkles, X, FileSearch, QrCode, Scan, Shield, Volume2 } from 'lucide-react';
import { ImageAnalysisResult, IndianLanguage, TranslationStrings, SampleImageScenario, ThreatLevel } from '../types';
import { SAMPLE_IMAGES } from '../data/sampleData';
import { saveHistoryRecord } from '../utils/historyStorage';

interface Props {
  selectedLanguage: IndianLanguage;
  translations: TranslationStrings;
  onTriggerEmergencyAlert?: (params: {
    threatLevel: ThreatLevel;
    threatType: 'image';
    threatSummary: string;
    target: string;
    brandName?: string;
  }) => void;
}

export const ImageAnalyzer: React.FC<Props> = ({
  selectedLanguage,
  translations,
  onTriggerEmergencyAlert,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [contextDescription, setContextDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ImageAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global paste handler so user can press Ctrl+V directly to paste a screenshot
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, WebP, or SVG).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image file exceeds maximum limit of 10MB.');
      return;
    }

    setError(null);
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');
    setMimeType(file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleLoadSample = (sample: SampleImageScenario) => {
    setImagePreview(sample.dataUrl);
    setMimeType(sample.mimeType);
    setFileName(sample.title);
    setFileSize('Sample Preset');
    setContextDescription(sample.description);
    setError(null);
    setResult(null);
    handleAnalyzeImage(sample.dataUrl, sample.mimeType, sample.description);
  };

  const handleAnalyzeImage = async (overrideData?: string, overrideMime?: string, overrideDesc?: string) => {
    const dataToSend = overrideData || imagePreview;
    const mimeToSend = overrideMime || mimeType;
    const descToSend = overrideDesc || contextDescription;

    if (!dataToSend) {
      setError('Please upload or select an image to inspect.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataToSend,
          mimeType: mimeToSend,
          description: descToSend,
          language: selectedLanguage.name,
          languageCode: selectedLanguage.code,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data: ImageAnalysisResult = await response.json();
      setResult(data);

      // Persist to scan history
      saveHistoryRecord({
        type: 'image',
        title: `${data.documentType.replace(/_/g, ' ')} (${data.authenticityStatus.replace(/_/g, ' ')})`,
        target: fileName || 'Uploaded Image',
        threatLevel: data.threatLevel,
        riskScore: data.riskScore,
        verdictSummary: data.verdictSummary,
        language: selectedLanguage.name,
        data: data,
      });
    } catch (err: any) {
      console.error('Image analysis error:', err);
      setError(err?.message || 'Failed to inspect image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!result) return;
    const report = `KAWACH AI IMAGE & SCREENSHOT FORENSIC REPORT
===================================================
Document Type: ${result.documentType}
Authenticity Status: ${result.authenticityStatus}
Trust Verdict: ${result.isTrusted ? 'GENUINE / TRUSTED' : 'FORGERY / FRAUDULENT SCAM'}
Threat Level: ${result.threatLevel}
Risk Score: ${result.riskScore}/100

VERDICT:
${result.verdictSummary}

EXTRACTED TEXT SUMMARY:
${result.detectedTextSummary}

BRAND IMPERSONATION:
${result.brandImpersonation?.detected ? `ALERT: Spoofing ${result.brandImpersonation.brandName}` : 'None detected'}

QR CODE / LINK THREAT:
${result.qrCodeOrLinkAnalysis?.present ? `WARNING: ${result.qrCodeOrLinkAnalysis.warning || 'QR code present'}` : 'None'}

VISUAL RED FLAGS & FORGERY INDICATORS:
${result.visualRedFlags?.map((f) => `• ${f}`).join('\n')}

PROTECTIVE GUIDANCE:
${result.recommendations?.map((r) => `• ${r}`).join('\n')}

National Cyber Crime Helpline (India): 1930 / cybercrime.gov.in
===================================================`;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getThreatBadge = (level: string, isTrusted: boolean) => {
    if (isTrusted || level === 'SAFE') {
      return {
        bg: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400',
        icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
        text: 'GENUINE / AUTHENTIC',
        glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
      };
    }
    if (level === 'CRITICAL_PHISH') {
      return {
        bg: 'bg-red-950/90 border-red-600 text-red-400',
        icon: <ShieldAlert className="w-5 h-5 text-red-500" />,
        text: 'CRITICAL FRAUD / FORGERY',
        glow: 'shadow-[0_0_25px_rgba(220,38,38,0.35)]',
      };
    }
    return {
      bg: 'bg-amber-950/80 border-amber-600 text-amber-400',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      text: 'SUSPICIOUS / MANIPULATED',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    };
  };

  return (
    <div id="image-analyzer-workstation" className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-red-900/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/40 border border-red-900/40 text-red-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <Scan className="w-3.5 h-3.5" />
              <span>Multimodal Visual Forensics</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Screenshot & Document Fraud Scanner
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
              Inspect suspicious payment receipts, fake electricity bills, QR codes, WhatsApp forwards, and fake bank KYC screenshots.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-gray-400 bg-black/60 px-3.5 py-2 rounded-xl border border-zinc-800">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>AI Computer Vision Engine</span>
          </div>
        </div>
      </div>

      {/* Main Upload Box */}
      <div className="p-6 sm:p-7 rounded-2xl bg-[#0a0a0a] border border-red-900/30 space-y-5 shadow-xl">
        <input
          id="image-file-input"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {!imagePreview ? (
          /* Dropzone */
          <div
            id="image-dropzone"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
              isDragging
                ? 'border-red-500 bg-red-950/30 scale-[0.99]'
                : 'border-red-900/40 hover:border-red-600/70 bg-[#111115] hover:bg-black'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-black border border-red-900/50 flex items-center justify-center text-red-500 mb-4 shadow-lg">
              <UploadCloud className="w-8 h-8 text-red-500" />
            </div>
            <div className="text-base font-bold text-white tracking-tight">
              Drag & Drop Screenshot / Image Here
            </div>
            <div className="text-xs text-gray-400 mt-1.5 max-w-md leading-relaxed">
              Supports PNG, JPG, WebP, SVG. You can also paste directly using <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-gray-200 font-mono text-[11px]">Ctrl+V</kbd> or click to browse.
            </div>
          </div>
        ) : (
          /* Preview Area */
          <div className="space-y-4">
            <div className="relative rounded-2xl border border-red-900/40 bg-black p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 overflow-hidden">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-zinc-900 overflow-hidden shrink-0 border border-zinc-800 flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Uploaded screenshot"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white truncate max-w-xs">{fileName || 'Uploaded Image'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-900/50">
                    {fileSize}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Ready for forensic fraud & tampering inspection.
                </p>

                {/* Additional context input */}
                <input
                  id="image-context-input"
                  type="text"
                  value={contextDescription}
                  onChange={(e) => setContextDescription(e.target.value)}
                  placeholder="Optional notes (e.g. Received on WhatsApp claiming electricity bill discount)..."
                  className="mt-3 w-full bg-[#111115] border border-red-900/30 focus:border-red-600 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-gray-600 outline-none font-mono"
                />
              </div>

              {/* Remove button */}
              <button
                id="remove-image-btn"
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setResult(null);
                  setError(null);
                  setContextDescription('');
                }}
                className="self-start sm:self-center p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/60 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Button */}
        {imagePreview && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-red-500" />
              <span>Analyzing in {selectedLanguage.name} ({selectedLanguage.nativeName})</span>
            </div>

            <button
              id="analyze-image-btn"
              type="button"
              onClick={() => handleAnalyzeImage()}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Running Forensic Scanner...</span>
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4" />
                  <span>Inspect Image For Fraud</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Quick Sample Presets */}
        <div className="pt-4 border-t border-zinc-900">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            <span>Try Sample Scam Screenshots</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SAMPLE_IMAGES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleLoadSample(sample)}
                className="p-3.5 rounded-xl bg-black/60 hover:bg-zinc-950 border border-zinc-800/80 hover:border-red-900/50 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-200 group-hover:text-white truncate">
                    {sample.title}
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                  {sample.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div id="image-analysis-result" className="space-y-5 animate-fade-in">
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
                          Doc Type: {result.documentType}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-white mt-2 tracking-tight">
                        {result.authenticityStatus.replace(/_/g, ' ')}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-300 mt-2 leading-relaxed max-w-2xl">
                        {result.verdictSummary}
                      </p>

                      {/* Speak Emergency Alert Button */}
                      {onTriggerEmergencyAlert && (
                        <div className="mt-3.5">
                          <button
                            id="image-speak-alert-btn"
                            type="button"
                            onClick={() =>
                              onTriggerEmergencyAlert({
                                threatLevel: result.threatLevel,
                                threatType: 'image',
                                threatSummary: result.verdictSummary,
                                target: fileName || 'Uploaded Image',
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
                        Deception Index
                      </div>
                      <div className="text-xs font-mono font-bold text-white mt-0.5">
                        {result.isTrusted ? 'GENUINE' : result.riskScore >= 70 ? 'CRITICAL FORGERY' : 'SUSPICIOUS'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Forensic Details & OCR Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Extracted Text & Content Claims */}
            <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-red-900/30 space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-red-500" />
                <span>Extracted Text & Content Claims</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed bg-black/60 p-3.5 rounded-xl border border-zinc-900">
                {result.detectedTextSummary}
              </p>

              {result.brandImpersonation?.detected && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300">
                  <span className="font-bold">🚨 Brand Spoofing Target:</span>{' '}
                  <span className="font-bold text-white">{result.brandImpersonation.brandName}</span>
                  {result.brandImpersonation.details && (
                    <div className="text-[11px] text-red-400 mt-1">{result.brandImpersonation.details}</div>
                  )}
                </div>
              )}

              {result.qrCodeOrLinkAnalysis?.present && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800 text-xs text-amber-300 flex items-start gap-2.5">
                  <QrCode className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">QR / Link Vector Warning:</span>{' '}
                    <span>{result.qrCodeOrLinkAnalysis.warning || 'Image embeds a QR code or external download link. Exercise extreme caution.'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Visual Red Flags & Forgery Indicators */}
            <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-red-900/30 space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>Visual Red Flags & Forgery Markers</span>
              </div>
              <div className="space-y-2">
                {result.visualRedFlags?.map((flag, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-black/60 border border-red-900/20 text-xs text-gray-300"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations Guidance */}
          <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-red-900/30 space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Protective Action Guidance</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {result.recommendations?.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-black/60 border border-zinc-800 text-xs text-gray-200"
                >
                  <Shield className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              id="reset-image-analysis-btn"
              type="button"
              onClick={() => {
                setImagePreview(null);
                setResult(null);
                setContextDescription('');
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-black hover:bg-zinc-900 border border-zinc-800 hover:border-red-900/60 text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Scan Another Image</span>
            </button>

            <button
              id="copy-image-report-btn"
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
                  <span>Copy Forensic Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
