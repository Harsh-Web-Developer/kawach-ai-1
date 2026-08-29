export type ThreatLevel = 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' | 'CRITICAL_PHISH';

export type AppToolMode = 'email' | 'link' | 'image';

export interface EmailAnalysisResult {
  threatLevel: ThreatLevel;
  riskScore: number;
  verdictSummary: string;
  senderAuthenticity: {
    status: string;
    details: string;
  };
  urgencyAnalysis: {
    isUrgent: boolean;
    details: string;
  };
  linksAnalysis: {
    totalLinks: number;
    suspiciousLinksCount: number;
    details: string;
  };
  credentialHarvestingRisk: boolean;
  indicatorsOfCompromise: string[];
  recommendations: string[];
  mitreTechniques: string[];
  language?: string;
  source?: string;
  notice?: string;
  errorNotice?: string;
}

export interface LinkAnalysisResult {
  url: string;
  threatLevel: ThreatLevel;
  riskScore: number;
  isTrusted: boolean;
  verdictSummary: string;
  domainDetails: {
    protocol: string;
    hostname: string;
    rootDomain: string;
    tld: string;
    isIpAddress: boolean;
    isShortener: boolean;
    isHttps: boolean;
  };
  brandImpersonation: {
    detected: boolean;
    brandName?: string;
    spoofingMechanism?: string;
  };
  securityChecks: {
    name: string;
    passed: boolean;
    severity: 'SAFE' | 'WARNING' | 'CRITICAL';
    detail: string;
  }[];
  suspiciousSignals: string[];
  recommendations: string[];
  language?: string;
  source?: string;
  notice?: string;
}

export interface ImageAnalysisResult {
  threatLevel: ThreatLevel;
  riskScore: number;
  isTrusted: boolean;
  documentType: string;
  verdictSummary: string;
  authenticityStatus: string;
  detectedTextSummary: string;
  brandImpersonation: {
    detected: boolean;
    brandName?: string;
    details?: string;
  };
  qrCodeOrLinkAnalysis: {
    present: boolean;
    warning?: string;
  };
  visualRedFlags: string[];
  forgeryIndicators: string[];
  recommendations: string[];
  language?: string;
  source?: string;
  notice?: string;
}

export interface IndianLanguage {
  code: string;
  name: string;
  nativeName: string;
  script: string;
  region: string;
}

export interface SampleEmail {
  id: string;
  title: string;
  category: 'phishing' | 'safe' | 'scam' | 'spearphishing';
  sender: string;
  subject: string;
  content: string;
  description: string;
}

export interface SampleLink {
  id: string;
  title: string;
  category: 'phishing' | 'safe' | 'shortener' | 'scam';
  url: string;
  description: string;
}

export interface SampleImageScenario {
  id: string;
  title: string;
  category: 'fraud' | 'safe' | 'kyc' | 'receipt';
  description: string;
  mimeType: string;
  dataUrl: string;
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  type: AppToolMode;
  title: string;
  target: string;
  threatLevel: ThreatLevel;
  riskScore: number;
  verdictSummary: string;
  language?: string;
  data?: EmailAnalysisResult | LinkAnalysisResult | ImageAnalysisResult | any;
  fullResult?: EmailAnalysisResult | LinkAnalysisResult | ImageAnalysisResult | any;
}

export interface EmergencyAlertPayload {
  threatLevel: ThreatLevel;
  threatType: AppToolMode | 'general';
  threatSummary: string;
  brandName?: string;
  target?: string;
  language?: string;
  languageCode?: string;
}

export interface EmergencyAlertResponse {
  alertTitle: string;
  emergencySpokenScript: string;
  phoneticTone: string;
  keySafetyDirectives: string[];
  target?: string;
  language: string;
  languageCode: string;
  audioSirenProfile: string;
  source: string;
}

export interface TranslationStrings {
  appName: string;
  appTagline: string;
  headerBadge: string;
  checkAnalyzeButton: string;
  analyzingButton: string;
  emailPlaceholder: string;
  subjectPlaceholder: string;
  senderPlaceholder: string;
  sampleEmailsTitle: string;
  loadSample: string;
  clearButton: string;
  threatLevelTitle: string;
  riskScoreTitle: string;
  senderAuthTitle: string;
  urgencyTitle: string;
  linksTitle: string;
  credentialRiskTitle: string;
  iocsTitle: string;
  recommendationsTitle: string;
  mitreTitle: string;
  safeBadge: string;
  suspiciousBadge: string;
  highRiskBadge: string;
  criticalBadge: string;
  cyberHelplineTitle: string;
  cyberHelplineText: string;
  languagesModalTitle: string;
  searchLanguagePlaceholder: string;
  allIndianLanguagesTitle: string;
  resetAnalysis: string;
  copyReport: string;
  reportCopied: string;
  // Link Verifier specific
  linkVerifierTitle: string;
  linkVerifierSubtitle: string;
  linkInputPlaceholder: string;
  verifyLinkButton: string;
  verifyingLinkButton: string;
  // Image Analyzer specific
  imageAnalyzerTitle: string;
  imageAnalyzerSubtitle: string;
  dragDropImageText: string;
  analyzeImageButton: string;
  analyzingImageButton: string;
  // History tab specific
  historyTitle: string;
  historySubtitle: string;
  clearHistory: string;
  emptyHistoryTitle: string;
  emptyHistoryText: string;
  viewReport: string;
  deleteRecord: string;
  // Emergency alert specific
  emergencyAlertTitle: string;
  speakAlertButton: string;
  speakingAlertText: string;
  stopAlertButton: string;
}
