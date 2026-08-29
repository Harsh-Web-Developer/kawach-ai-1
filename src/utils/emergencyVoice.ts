import { ThreatLevel, AppToolMode, EmergencyAlertResponse } from '../types';

let audioCtx: AudioContext | null = null;
let sirenOsc1: OscillatorNode | null = null;
let sirenOsc2: OscillatorNode | null = null;
let sirenGain: GainNode | null = null;
let isSirenActive = false;

// Initialize Web Audio Context safely on user interaction
function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a high-urgency cyber security warning siren tone using Web Audio API
 */
export function playEmergencySirenTone(durationMs = 1800): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioContext();
      stopEmergencySirenTone();

      isSirenActive = true;
      const now = ctx.currentTime;

      // Master Gain for siren
      sirenGain = ctx.createGain();
      sirenGain.gain.setValueAtTime(0.01, now);
      sirenGain.gain.linearRampToValueAtTime(0.18, now + 0.1);
      sirenGain.gain.setValueAtTime(0.18, now + (durationMs / 1000) - 0.2);
      sirenGain.gain.linearRampToValueAtTime(0.001, now + (durationMs / 1000));
      sirenGain.connect(ctx.destination);

      // Oscillator 1: Modulating high alarm tone (880Hz to 660Hz warble)
      sirenOsc1 = ctx.createOscillator();
      sirenOsc1.type = 'sawtooth';
      sirenOsc1.frequency.setValueAtTime(880, now);
      sirenOsc1.frequency.exponentialRampToValueAtTime(587.33, now + 0.45);
      sirenOsc1.frequency.exponentialRampToValueAtTime(880, now + 0.9);
      sirenOsc1.frequency.exponentialRampToValueAtTime(587.33, now + 1.35);
      sirenOsc1.frequency.exponentialRampToValueAtTime(880, now + 1.8);

      // Oscillator 2: Dual harmonic pulse for tactical warning klaxon
      sirenOsc2 = ctx.createOscillator();
      sirenOsc2.type = 'sine';
      sirenOsc2.frequency.setValueAtTime(440, now);
      sirenOsc2.frequency.exponentialRampToValueAtTime(293.66, now + 0.45);
      sirenOsc2.frequency.exponentialRampToValueAtTime(440, now + 0.9);
      sirenOsc2.frequency.exponentialRampToValueAtTime(293.66, now + 1.35);

      sirenOsc1.connect(sirenGain);
      sirenOsc2.connect(sirenGain);

      sirenOsc1.start(now);
      sirenOsc2.start(now);

      const stopTime = now + (durationMs / 1000);
      sirenOsc1.stop(stopTime);
      sirenOsc2.stop(stopTime);

      setTimeout(() => {
        isSirenActive = false;
        resolve();
      }, durationMs);
    } catch (err) {
      console.warn('Web Audio emergency siren not available:', err);
      resolve();
    }
  });
}

export function stopEmergencySirenTone(): void {
  try {
    if (sirenOsc1) {
      sirenOsc1.stop();
      sirenOsc1.disconnect();
      sirenOsc1 = null;
    }
    if (sirenOsc2) {
      sirenOsc2.stop();
      sirenOsc2.disconnect();
      sirenOsc2 = null;
    }
    if (sirenGain) {
      sirenGain.disconnect();
      sirenGain = null;
    }
    isSirenActive = false;
  } catch (e) {
    // ignore
  }
}

/**
 * Fetch generated emergency spoken alert script from KAWACH Backend API
 */
export async function requestEmergencyAlertAPI(params: {
  threatLevel: ThreatLevel;
  threatType: AppToolMode | 'general';
  threatSummary: string;
  brandName?: string;
  target?: string;
  language?: string;
  languageCode?: string;
}): Promise<EmergencyAlertResponse> {
  const response = await fetch('/api/speak-alert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate emergency alert: ${response.status}`);
  }

  return response.json();
}

/**
 * Find the best available voice in browser for language code
 */
function findBestVoice(langCode: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const normalized = (langCode || 'en').toLowerCase();

  // Try exact match (e.g. hi-IN, ta-IN, bn-IN, en-IN)
  let match = voices.find((v) => v.lang.toLowerCase().startsWith(normalized));
  if (match) return match;

  // Try Indian English if English or other Indian language voice not installed
  if (normalized === 'en' || normalized.startsWith('en')) {
    match = voices.find((v) => v.lang.toLowerCase().includes('en-in') || v.lang.toLowerCase().includes('en-gb') || v.lang.toLowerCase().includes('en-us'));
    if (match) return match;
  }

  // Fallback to Hindi or default
  match = voices.find((v) => v.lang.toLowerCase().includes('hi')) || voices[0];
  return match || null;
}

/**
 * Speaks an emergency alert script aloud using SpeechSynthesis
 */
export function speakEmergencyScript(
  text: string,
  langCode = 'en',
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onError?.(new Error('Browser does not support Speech Synthesis API.'));
    return null;
  }

  // Cancel any existing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = findBestVoice(langCode);
  if (voice) {
    utterance.voice = voice;
  }

  // Set appropriate language tag
  const localeMap: Record<string, string> = {
    hi: 'hi-IN',
    bn: 'bn-IN',
    te: 'te-IN',
    ta: 'ta-IN',
    mr: 'mr-IN',
    gu: 'gu-IN',
    kn: 'kn-IN',
    ml: 'ml-IN',
    pa: 'pa-IN',
    or: 'or-IN',
    as: 'as-IN',
    ur: 'ur-IN',
    en: 'en-IN',
  };

  utterance.lang = localeMap[langCode] || `${langCode}-IN`;
  utterance.rate = 0.95; // Slightly measured, authoritative
  utterance.pitch = 1.05; // Clear urgent pitch
  utterance.volume = 1.0;

  utterance.onstart = () => {
    onStart?.();
  };

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = (e) => {
    console.error('Speech synthesis error:', e);
    onError?.(e);
  };

  window.speechSynthesis.speak(utterance);
  return utterance;
}

/**
 * Full Emergency Broadcast: Siren tone followed by clear voice announcement
 */
export async function triggerFullEmergencyBroadcast(params: {
  script: string;
  langCode?: string;
  withSiren?: boolean;
  onSirenStart?: () => void;
  onSpeechStart?: () => void;
  onComplete?: () => void;
  onError?: (err: any) => void;
}): Promise<void> {
  const {
    script,
    langCode = 'en',
    withSiren = true,
    onSirenStart,
    onSpeechStart,
    onComplete,
    onError,
  } = params;

  try {
    if (withSiren) {
      onSirenStart?.();
      await playEmergencySirenTone(1600);
    }

    speakEmergencyScript(
      script,
      langCode,
      onSpeechStart,
      onComplete,
      onError
    );
  } catch (err) {
    console.error('Emergency broadcast failure:', err);
    onError?.(err);
  }
}

export function stopAllEmergencyAudio(): void {
  stopEmergencySirenTone();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
