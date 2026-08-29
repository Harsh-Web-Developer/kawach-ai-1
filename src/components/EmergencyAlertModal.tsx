import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Volume2,
  VolumeX,
  PhoneCall,
  X,
  AlertOctagon,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { ThreatLevel, AppToolMode, EmergencyAlertResponse, IndianLanguage } from '../types';
import {
  requestEmergencyAlertAPI,
  triggerFullEmergencyBroadcast,
  stopAllEmergencyAudio,
} from '../utils/emergencyVoice';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  threatLevel: ThreatLevel;
  threatType: AppToolMode | 'general';
  threatSummary: string;
  target?: string;
  brandName?: string;
  currentLanguage: IndianLanguage;
}

export const EmergencyAlertModal: React.FC<Props> = ({
  isOpen,
  onClose,
  threatLevel,
  threatType,
  threatSummary,
  target,
  brandName,
  currentLanguage,
}) => {
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);
  const [alertData, setAlertData] = useState<EmergencyAlertResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAndBroadcast();
    } else {
      stopAllEmergencyAudio();
      setIsPlaying(false);
      setIsSirenPlaying(false);
    }
    return () => {
      stopAllEmergencyAudio();
    };
  }, [isOpen, threatSummary, target, currentLanguage.code]);

  const fetchAndBroadcast = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestEmergencyAlertAPI({
        threatLevel,
        threatType,
        threatSummary,
        brandName,
        target,
        language: currentLanguage.name,
        languageCode: currentLanguage.code,
      });
      setAlertData(data);

      // Start audio broadcast
      startAudioBroadcast(data.emergencySpokenScript);
    } catch (err: any) {
      console.error('Failed to prepare emergency audio alert:', err);
      setError('Unable to contact voice alert API. Using direct local siren broadcast.');
      // Fallback direct broadcast
      const fallbackScript = `Emergency Cyber Security Alert! High risk cyber attack detected. Do not click links, do not enter passwords or OTPs, and dial Cyber Helpline 1930 immediately.`;
      startAudioBroadcast(fallbackScript);
    } finally {
      setLoading(false);
    }
  };

  const startAudioBroadcast = async (script: string) => {
    setIsPlaying(true);
    triggerFullEmergencyBroadcast({
      script,
      langCode: currentLanguage.code,
      withSiren: true,
      onSirenStart: () => setIsSirenPlaying(true),
      onSpeechStart: () => {
        setIsSirenPlaying(false);
        setIsPlaying(true);
      },
      onComplete: () => {
        setIsPlaying(false);
        setIsSirenPlaying(false);
      },
      onError: (err) => {
        console.error('Broadcast audio error:', err);
        setIsPlaying(false);
        setIsSirenPlaying(false);
      },
    });
  };

  const handleStopAudio = () => {
    stopAllEmergencyAudio();
    setIsPlaying(false);
    setIsSirenPlaying(false);
  };

  const handleReplay = () => {
    if (alertData) {
      startAudioBroadcast(alertData.emergencySpokenScript);
    } else {
      fetchAndBroadcast();
    }
  };

  if (!isOpen) return null;

  const isCritical = threatLevel === 'CRITICAL_PHISH' || threatLevel === 'HIGH_RISK';

  return (
    <div
      id="emergency-alert-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        id="emergency-alert-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-3xl bg-[#09090b] border-2 border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.4)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Pulsating Top Warning Bar */}
        <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-between font-black tracking-widest text-xs uppercase shadow-lg">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 animate-pulse text-white" />
            <span>VOICE BROADCAST ACTIVE • {currentLanguage.name.toUpperCase()}</span>
          </div>
          <button
            id="close-emergency-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
          {/* Main Visual Header */}
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-2xl bg-red-950/80 border border-red-600/60 text-red-500 shadow-[0_0_25px_rgba(220,38,38,0.3)] shrink-0 animate-bounce">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-700/50 text-red-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                <span>{threatLevel.replace('_', ' ')}</span>
                <span>•</span>
                <span>{threatType.toUpperCase()} DEFENSE</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                {alertData?.alertTitle || 'EMERGENCY CYBER ALERT'}
              </h2>
              {target && (
                <p className="text-xs text-zinc-400 font-mono truncate mt-1">
                  Target: <span className="text-red-400">{target}</span>
                </p>
              )}
            </div>
          </div>

          {/* Audio Visualizer Waveform Bar */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-red-900/50 flex flex-col items-center justify-center gap-3">
            <div className="flex items-center justify-center gap-1.5 h-12 w-full">
              {[40, 75, 95, 60, 100, 80, 50, 90, 100, 70, 85, 45, 95, 65, 80].map((height, i) => (
                <span
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-150 ${
                    isPlaying || isSirenPlaying
                      ? isSirenPlaying
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-red-500 animate-pulse'
                      : 'bg-zinc-800'
                  }`}
                  style={{
                    height: isPlaying || isSirenPlaying ? `${Math.max(15, height * ((i % 3 + 1) / 3))}%` : '20%',
                    animationDelay: `${i * 60}ms`,
                  }}
                />
              ))}
            </div>

            <div className="flex items-center justify-between w-full text-xs font-mono">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <Volume2 className={`w-4 h-4 ${isPlaying || isSirenPlaying ? 'text-red-500 animate-pulse' : 'text-zinc-600'}`} />
                <span>
                  {isSirenPlaying
                    ? 'Synthesizing Emergency Siren...'
                    : isPlaying
                    ? `Broadcasting Spoken Directive in ${currentLanguage.name}`
                    : 'Audio Broadcast Completed'}
                </span>
              </span>

              <div className="flex items-center gap-2">
                {isPlaying || isSirenPlaying ? (
                  <button
                    id="emergency-modal-stop-btn"
                    type="button"
                    onClick={handleStopAudio}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    <VolumeX className="w-3.5 h-3.5 text-red-400" />
                    <span>Stop Audio</span>
                  </button>
                ) : (
                  <button
                    id="emergency-modal-replay-btn"
                    type="button"
                    onClick={handleReplay}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-red-900/40"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Replay Audio</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Spoken Script Transcript */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-2">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold flex items-center justify-between">
              <span>Emergency Voice Transcript ({currentLanguage.name})</span>
              <span className="text-red-400">Speech API</span>
            </div>
            <p className="text-sm sm:text-base text-zinc-200 font-medium leading-relaxed italic">
              "{alertData?.emergencySpokenScript || (loading ? 'Generating spoken emergency audio script in ' + currentLanguage.name + '...' : threatSummary)}"
            </p>
          </div>

          {/* Key Directives Checklist */}
          {alertData?.keySafetyDirectives && alertData.keySafetyDirectives.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Immediate Protective Directives
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {alertData.keySafetyDirectives.map((dir, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/30 border border-red-900/40 text-xs text-zinc-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{dir}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instant Call 1930 Helpline Button */}
          <div className="pt-2">
            <a
              id="emergency-modal-call-1930-btn"
              href="tel:1930"
              className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(220,38,38,0.5)] active:scale-98"
            >
              <PhoneCall className="w-5 h-5 animate-pulse" />
              <span>Call 1930 National Cyber Helpline (Immediate Financial Freeze)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
