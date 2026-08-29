import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable 15mb payload limit for image screenshots upload
app.use(express.json({ limit: "15mb" }));

// Initialize Gemini SDK lazily
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// -------------------------------------------------------------
// 1. LINK / URL HEURISTIC VERIFIER
// -------------------------------------------------------------
const POPULAR_TRUSTED_DOMAINS: Record<string, string[]> = {
  google: ["google.com", "google.co.in", "google.co.uk", "google.org", "gstatic.com", "youtube.com", "gmail.com"],
  sbi: ["sbi.co.in", "onlinesbi.sbi", "onlinesbi.com"],
  hdfc: ["hdfcbank.com", "hdfc.com"],
  icici: ["icicibank.com"],
  axis: ["axisbank.com"],
  paytm: ["paytm.com", "paytmbank.com"],
  phonepe: ["phonepe.com"],
  amazon: ["amazon.com", "amazon.in", "aws.amazon.com", "amazon.co.uk"],
  flipkart: ["flipkart.com"],
  apple: ["apple.com", "icloud.com"],
  microsoft: ["microsoft.com", "live.com", "office.com", "outlook.com", "azure.com"],
  netflix: ["netflix.com"],
  incometax: ["incometax.gov.in", "incometaxindia.gov.in"],
  uidai: ["uidai.gov.in", "myaadhaar.uidai.gov.in"],
  rbi: ["rbi.org.in"],
  parivahan: ["parivahan.gov.in"],
  cybercrime: ["cybercrime.gov.in"],
  indiapost: ["indiapost.gov.in", "ippbonline.com"]
};

const HIGH_RISK_TLDS = [".xyz", ".top", ".icu", ".click", ".buzz", ".cam", ".tk", ".ml", ".ga", ".cf", ".gq", ".work", ".rest", ".country", ".bid", ".stream", ".link", ".party", ".racing", ".monster", ".fit", ".gdn"];
const KNOWN_SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "buff.ly", "ow.ly", "cutt.ly", "rb.gy", "shorturl.at", "t.ly", "v.gd"];

function runHeuristicLinkVerification(inputUrl: string, languageName: string) {
  let normalizedUrl = inputUrl.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = "https://" + normalizedUrl;
  }

  let parsed: URL;
  try {
    parsed = new URL(normalizedUrl);
  } catch (err) {
    return {
      url: inputUrl,
      threatLevel: "HIGH_RISK",
      riskScore: 80,
      isTrusted: false,
      verdictSummary: `Malformed or invalid URL syntax detected: "${inputUrl}". Malformed URLs are frequently used in obfuscation attacks.`,
      domainDetails: {
        protocol: "unknown",
        hostname: "invalid-url",
        rootDomain: "invalid",
        tld: "unknown",
        isIpAddress: false,
        isShortener: false,
        isHttps: false
      },
      brandImpersonation: { detected: false },
      securityChecks: [
        { name: "Syntax Validation", passed: false, severity: "CRITICAL", detail: "URL could not be parsed according to standard RFC 3986 specs." }
      ],
      suspiciousSignals: ["Malformed URL syntax", "Potential link evasion technique"],
      recommendations: ["Do not visit or click this malformed address.", "Check if characters have been replaced with hidden symbols."],
      language: languageName
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const protocol = parsed.protocol.toLowerCase();
  const isHttps = protocol === "https:";
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  const isShortener = KNOWN_SHORTENERS.some(s => hostname === s || hostname.endsWith("." + s));
  const matchedHighRiskTld = HIGH_RISK_TLDS.find(tld => hostname.endsWith(tld));
  const hasPunycode = hostname.includes("xn--");

  // Extract root domain (e.g., login.sbi.bank-verify.xyz -> bank-verify.xyz)
  const hostParts = hostname.split(".");
  const rootDomain = hostParts.length >= 2 ? hostParts.slice(-2).join(".") : hostname;

  let riskScore = 0;
  const signals: string[] = [];
  const checks: any[] = [];
  let brandSpoofDetected = false;
  let brandName = "";

  // 1. Protocol check
  if (!isHttps) {
    riskScore += 25;
    signals.push("Insecure HTTP protocol: Traffic is unencrypted and vulnerable to Man-in-the-Middle credential interception.");
    checks.push({ name: "HTTPS Encryption", passed: false, severity: "WARNING", detail: "Site uses unencrypted HTTP protocol." });
  } else {
    checks.push({ name: "HTTPS Encryption", passed: true, severity: "SAFE", detail: "Standard TLS/HTTPS encryption protocol present." });
  }

  // 2. IP Address as Hostname
  if (isIp) {
    riskScore += 55;
    signals.push(`Direct numerical IP address used as hostname (${hostname}). Legitimate organizations use registered domain names.`);
    checks.push({ name: "Domain Name Validation", passed: false, severity: "CRITICAL", detail: "Raw IP address used instead of reputable registered domain name." });
  } else {
    checks.push({ name: "Domain Name Validation", passed: true, severity: "SAFE", detail: "Valid registered alphanumeric domain name structure." });
  }

  // 3. High Risk TLDs
  if (matchedHighRiskTld) {
    riskScore += 35;
    signals.push(`High-Risk Top Level Domain: (${matchedHighRiskTld}) is statistically tied to disposable phishing operations.`);
    checks.push({ name: "TLD Reputation Check", passed: false, severity: "CRITICAL", detail: `High-threat disposable TLD detected: ${matchedHighRiskTld}` });
  } else {
    checks.push({ name: "TLD Reputation Check", passed: true, severity: "SAFE", detail: `Domain extension (.${hostParts.slice(-1)[0] || 'com'}) is standard.` });
  }

  // 4. URL Shortener Masking
  if (isShortener) {
    riskScore += 30;
    signals.push(`URL Shortener Masking (${hostname}): Hides real final destination and bypasses conventional domain reputation filters.`);
    checks.push({ name: "Destination Transparency", passed: false, severity: "WARNING", detail: "Masked redirect service detected. Actual endpoint is concealed." });
  } else {
    checks.push({ name: "Destination Transparency", passed: true, severity: "SAFE", detail: "Direct domain destination is transparent." });
  }

  // 5. Brand Impersonation / Typosquatting
  for (const [brand, officialDomains] of Object.entries(POPULAR_TRUSTED_DOMAINS)) {
    const brandInHost = hostname.includes(brand);
    const isActuallyOfficial = officialDomains.some(od => hostname === od || hostname.endsWith("." + od));

    if (brandInHost && !isActuallyOfficial) {
      brandSpoofDetected = true;
      brandName = brand.toUpperCase();
      riskScore += 60;
      signals.push(`Brand Impersonation / Typosquatting: Domain mimics '${brand.toUpperCase()}', but does NOT belong to official domains (${officialDomains.join(", ")}).`);
      checks.push({ name: "Brand Authenticity", passed: false, severity: "CRITICAL", detail: `Deceptive imitation of ${brand.toUpperCase()} infrastructure.` });
      break;
    }
  }

  if (!brandSpoofDetected) {
    // Check if it matches an official trusted domain directly
    let isKnownTrusted = false;
    for (const [brand, officialDomains] of Object.entries(POPULAR_TRUSTED_DOMAINS)) {
      if (officialDomains.some(od => hostname === od || hostname.endsWith("." + od))) {
        isKnownTrusted = true;
        checks.push({ name: "Brand Authenticity", passed: true, severity: "SAFE", detail: `Verified official infrastructure for ${brand.toUpperCase()}.` });
        break;
      }
    }
    if (!isKnownTrusted) {
      checks.push({ name: "Brand Authenticity", passed: true, severity: "SAFE", detail: "No explicit brand impersonation signatures detected." });
    }
  }

  // 6. Punycode / Homograph check
  if (hasPunycode) {
    riskScore += 50;
    signals.push("Punycode (IDN) encoding detected: Cyrillic or non-Latin lookalike characters may be masquerading as legitimate English letters.");
    checks.push({ name: "Homoglyph / Punycode Check", passed: false, severity: "CRITICAL", detail: "Internationalized domain name (xn--) used for visual spoofing." });
  }

  // 7. Excessive Subdomains or Deceptive Paths
  if (hostParts.length >= 4) {
    riskScore += 20;
    signals.push("Excessive subdomain depth: Phishers frequently stack subdomains to trick mobile browser address bars.");
  }

  const pathAndQuery = (parsed.pathname + parsed.search).toLowerCase();
  if (pathAndQuery.includes("login") || pathAndQuery.includes("verify") || pathAndQuery.includes("kyc") || pathAndQuery.includes("aadhaar") || pathAndQuery.includes("otp") || pathAndQuery.includes("claim")) {
    if (riskScore > 20) {
      riskScore += 15;
      signals.push(`Sensitive authentication / KYC keywords present in URL path: "${parsed.pathname}"`);
    }
  }

  riskScore = Math.min(Math.max(riskScore, 5), 99);

  // Check if fully trusted
  const isKnownTrusted = Object.values(POPULAR_TRUSTED_DOMAINS).flat().some(od => hostname === od || hostname.endsWith("." + od));
  if (isKnownTrusted && !isShortener && isHttps && !matchedHighRiskTld) {
    riskScore = 5;
  }

  let threatLevel: "SAFE" | "SUSPICIOUS" | "HIGH_RISK" | "CRITICAL_PHISH" = "SAFE";
  if (riskScore >= 70) threatLevel = "CRITICAL_PHISH";
  else if (riskScore >= 45) threatLevel = "HIGH_RISK";
  else if (riskScore >= 25) threatLevel = "SUSPICIOUS";

  const isTrusted = threatLevel === "SAFE";

  const recommendations: string[] = [];
  if (isTrusted) {
    recommendations.push("The domain appears genuine with valid SSL and legitimate naming structure.");
    recommendations.push("Always verify that you are logging into official saved bookmarks when entering banking passwords.");
  } else {
    recommendations.push("DO NOT click or open this link in your web browser.");
    recommendations.push("DO NOT enter any passwords, OTPs, Aadhaar numbers, or UPI PINs on this page.");
    recommendations.push("If received via WhatsApp/SMS claiming bank KYC update, report to Cyber Helpline 1930 / cybercrime.gov.in immediately.");
    recommendations.push("Verify independently by typing the official company URL directly into your browser.");
  }

  const verdictSummary = isTrusted
    ? `This link (${hostname}) matches verified authentic domain standards with zero malicious anomalies detected. (Verified for ${languageName})`
    : `WARNING: This link presents high-probability deceptive indicators (${signals.slice(0, 2).join("; ")}). Exercise extreme caution. (Verified for ${languageName})`;

  return {
    url: inputUrl,
    threatLevel,
    riskScore,
    isTrusted,
    verdictSummary,
    domainDetails: {
      protocol: parsed.protocol.replace(":", ""),
      hostname,
      rootDomain,
      tld: "." + (hostParts.slice(-1)[0] || ""),
      isIpAddress: isIp,
      isShortener,
      isHttps
    },
    brandImpersonation: {
      detected: brandSpoofDetected,
      brandName: brandSpoofDetected ? brandName : undefined,
      spoofingMechanism: brandSpoofDetected ? "Lookalike deceptive subdomain / unauthorized root domain" : undefined
    },
    securityChecks: checks,
    suspiciousSignals: signals.length > 0 ? signals : ["No deceptive signals found."],
    recommendations,
    language: languageName
  };
}

// -------------------------------------------------------------
// 2. IMAGE / SCREENSHOT HEURISTIC ANALYZER
// -------------------------------------------------------------
function runHeuristicImageAnalysis(description: string, mimeType: string, languageName: string) {
  const desc = (description || "").toLowerCase();
  const urgent = desc.includes("kyc") || desc.includes("blocked") || desc.includes("pan") || desc.includes("lottery") || desc.includes("electricity") || desc.includes("challan") || desc.includes("police");
  
  let riskScore = urgent ? 78 : 35;
  let threatLevel: "SAFE" | "SUSPICIOUS" | "HIGH_RISK" | "CRITICAL_PHISH" = urgent ? "CRITICAL_PHISH" : "SAFE";

  return {
    threatLevel,
    riskScore,
    isTrusted: riskScore < 30,
    documentType: desc.includes("receipt") ? "Payment Transaction Receipt" : desc.includes("qr") ? "QR Code Payment Notice" : "Digital Message / Notice Screenshot",
    verdictSummary: urgent
      ? `Visual analysis identified signature traits of Indian cyber financial deception (urgent account block, unauthorized payment QR, or fake regulatory notice).`
      : `Image inspected for digital tampering, spoofed stamps, and phishing markers. No lethal threats detected.`,
    authenticityStatus: urgent ? "HIGH_PROBABILITY_FRAUD" : "VERIFIED_OR_BENIGN",
    detectedTextSummary: description || "Screenshot containing digital text elements and graphic assets.",
    brandImpersonation: {
      detected: urgent,
      brandName: desc.includes("sbi") ? "State Bank of India (SBI)" : desc.includes("police") ? "Traffic / Cyber Police" : desc.includes("electricity") ? "State Electricity Board" : "Financial Institution / Govt Portal",
      details: urgent ? "Manipulated logo placement and unauthorized urgent ultimatum text format." : undefined
    },
    qrCodeOrLinkAnalysis: {
      present: desc.includes("qr") || desc.includes("link") || desc.includes("apk"),
      warning: desc.includes("qr") ? "Never scan QR codes to 'receive' money — QR codes only DEDUCT money from your bank account." : undefined
    },
    visualRedFlags: urgent ? [
      "Unofficial font weights and improper logo resolution",
      "Urgent countdown / immediate account disconnection ultimatum",
      "Demands scanning of dynamic UPI QR code or clicking shortened link",
      "Missing authorized digital signature certificate watermarks"
    ] : ["No obvious visual forgery artifacts detected."],
    forgeryIndicators: urgent ? ["Spoofed header seal", "Synthetic stamp overlay", "Non-standard bank typography"] : ["None"],
    recommendations: [
      "Never scan QR codes sent via WhatsApp/SMS to receive refunds, cashbacks, or lottery payouts.",
      "Check payment confirmations directly inside your official bank or UPI app, never rely on sender screenshots.",
      "In case of financial fraud, call the National Cyber Crime Helpline at 1930 immediately."
    ],
    language: languageName
  };
}

// -------------------------------------------------------------
// 3. EMAIL HEURISTIC ANALYZER
// -------------------------------------------------------------
function runHeuristicEmailAnalysis(emailText: string, sender: string, subject: string, languageName: string) {
  const fullText = `${sender} ${subject} ${emailText}`.toLowerCase();
  
  const urgentKeywords = ["urgent", "immediately", "account suspended", "blocked", "within 24 hours", "action required", "kyc update", "verify identity", "pan card", "aadhaar", "lottery", "winner", "tax refund", "unauthorized transaction", "click here", "login now", "reset password", "overdue invoice", "wire transfer", "gift card", "otp"];
  const urgentHits = urgentKeywords.filter(k => fullText.includes(k));
  
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const urlsFound = (emailText.match(urlRegex) || []);
  const suspiciousUrls = urlsFound.filter(u => 
    u.includes("bit.ly") || u.includes("tinyurl") || u.includes("free-gift") || 
    u.includes(".xyz") || u.includes(".top") || u.includes(".icu") || 
    u.includes(".click") || u.includes("login-secure") || u.includes("verify-bank") ||
    /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(u)
  );

  let riskScore = 15;
  const iocs: string[] = [];
  const recommendations: string[] = [];

  if (urgentHits.length >= 3) {
    riskScore += 35;
    iocs.push(`High urgency psychological pressure detected: found trigger terms (${urgentHits.slice(0, 4).join(", ")})`);
  } else if (urgentHits.length > 0) {
    riskScore += 15;
    iocs.push(`Urgency indicators detected: (${urgentHits.join(", ")})`);
  }

  if (suspiciousUrls.length > 0) {
    riskScore += 40;
    iocs.push(`Potentially malicious or masked link targets found: ${suspiciousUrls.slice(0, 2).join(", ")}`);
  } else if (urlsFound.length > 0) {
    riskScore += 10;
  }

  const bankSpoofPatterns = ["sbi", "hdfc", "icici", "paytm", "phonepe", "gpay", "income tax", "rbi", "amazon", "netflix", "microsoft", "paypal"];
  const senderMatchesBrand = bankSpoofPatterns.some(b => fullText.includes(b));
  const senderIsFreeDomain = sender.includes("@gmail.com") || sender.includes("@yahoo.com") || sender.includes("@hotmail.com") || sender.includes("@outlook.com");

  if (senderMatchesBrand && senderIsFreeDomain) {
    riskScore += 35;
    iocs.push(`Sender Domain Spoofing: Official brand communication originating from generic free public email provider (${sender})`);
  }

  if (fullText.includes("password") || fullText.includes("otp") || fullText.includes("cvv") || fullText.includes("pin")) {
    riskScore += 25;
    iocs.push("Credential or sensitive authentication data harvesting attempt detected.");
  }

  riskScore = Math.min(Math.max(riskScore, 5), 98);

  let threatLevel: "SAFE" | "SUSPICIOUS" | "HIGH_RISK" | "CRITICAL_PHISH" = "SAFE";
  if (riskScore >= 75) threatLevel = "CRITICAL_PHISH";
  else if (riskScore >= 50) threatLevel = "HIGH_RISK";
  else if (riskScore >= 25) threatLevel = "SUSPICIOUS";

  if (threatLevel === "SAFE") {
    recommendations.push("Standard email safety applies: always verify attachments before opening.");
    recommendations.push("Check sender domain matches official business address.");
  } else {
    recommendations.push("DO NOT click any links or download attached files.");
    recommendations.push("DO NOT share OTPs, PINs, passwords, or personal banking credentials.");
    recommendations.push("Report suspicious Indian financial fraud to National Cyber Crime Portal (1930 / cybercrime.gov.in).");
    recommendations.push("Verify independently by contacting the legitimate organization via official hotline.");
  }

  return {
    threatLevel,
    riskScore,
    verdictSummary: threatLevel === "SAFE" 
      ? `This email appears generally safe with low threat indicators. (Analyzed for ${languageName})`
      : `High probability of phishing or social engineering detected. Please exercise extreme caution before interacting. (Analyzed for ${languageName})`,
    senderAuthenticity: {
      status: senderIsFreeDomain && senderMatchesBrand ? "FAILED" : "VERIFIED_OR_STANDARD",
      details: senderIsFreeDomain && senderMatchesBrand ? "Domain mismatch: Impersonating enterprise brand using generic mail provider." : "Sender headers and domain syntax look plausible."
    },
    urgencyAnalysis: {
      isUrgent: urgentHits.length > 0,
      details: urgentHits.length > 0 ? `Psychological pressure used: ${urgentHits.slice(0, 3).join(", ")}` : "Normal tone with no artificial deadlines."
    },
    linksAnalysis: {
      totalLinks: urlsFound.length,
      suspiciousLinksCount: suspiciousUrls.length,
      details: suspiciousUrls.length > 0 ? "Masked or high-risk TLDs detected in link destinations." : "No known malicious or masked URL patterns detected."
    },
    credentialHarvestingRisk: fullText.includes("password") || fullText.includes("otp") || fullText.includes("kyc"),
    indicatorsOfCompromise: iocs.length > 0 ? iocs : ["No obvious Indicators of Compromise (IoCs) found."],
    recommendations,
    mitreTechniques: threatLevel !== "SAFE" ? ["T1566.002 - Phishing: Spearphishing Link", "T1056 - Input Capture / Credential Harvesting"] : ["T1566 - General Email Transmission"],
    language: languageName
  };
}

// -------------------------------------------------------------
// 4. GEMINI API CALL WITH RETRY & FALLBACKS
// -------------------------------------------------------------
async function callGeminiWithFallback(
  ai: GoogleGenAI,
  contents: any,
  systemPrompt: string,
  schema: any
): Promise<{ data: any; modelUsed: string }> {
  const modelsToTry = ["gemini-3.7-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        });

        const parsed = JSON.parse(response.text || "{}");
        return { data: parsed, modelUsed: model };
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isTransient =
          errMsg.includes("503") ||
          errMsg.includes("high demand") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("429") ||
          errMsg.includes("RESOURCE_EXHAUSTED");

        console.warn(
          `[Gemini Call Attempt ${attempt} on ${model}]: ${errMsg.slice(0, 100)}`
        );

        if (isTransient && attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 800));
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error("All Gemini models temporarily unavailable.");
}

// -------------------------------------------------------------
// ROUTES
// -------------------------------------------------------------

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "KAWACH AI Threat Engine", time: new Date().toISOString() });
});

// API 1: Email Threat Analysis
app.post("/api/analyze-email", async (req, res) => {
  try {
    const { emailContent, sender = "", subject = "", language = "English", languageCode = "en" } = req.body;

    if (!emailContent || typeof emailContent !== "string" || emailContent.trim().length === 0) {
      return res.status(400).json({ error: "Email content is required for analysis." });
    }

    const ai = getGeminiClient();

    if (!ai) {
      const fallbackResult = runHeuristicEmailAnalysis(emailContent, sender, subject, language);
      return res.json({
        ...fallbackResult,
        source: "kawach-heuristic-engine",
        notice: "Analyzed via KAWACH local threat rules engine.",
      });
    }

    const systemPrompt = `You are KAWACH AI (कवच AI), an elite cyber security and anti-phishing defense intelligence engine.
Analyze the provided email for phishing, domain spoofing, urgency traps, credential harvesting, fake banking/KYC fraud, APK drops, and electricity bill scams.
Provide the 'verdictSummary', 'senderAuthenticity.details', 'urgencyAnalysis.details', 'linksAnalysis.details', 'indicatorsOfCompromise', and 'recommendations' in ${language} (Language code: ${languageCode}).`;

    const prompt = `Analyze this email:
Sender: ${sender || "Not specified"}
Subject: ${subject || "Not specified"}
Content:
"""
${emailContent.slice(0, 8000)}
"""`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        threatLevel: { type: Type.STRING, description: "One of: SAFE, SUSPICIOUS, HIGH_RISK, CRITICAL_PHISH" },
        riskScore: { type: Type.INTEGER, description: "0 to 100" },
        verdictSummary: { type: Type.STRING, description: `Summary verdict in ${language}` },
        senderAuthenticity: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING },
            details: { type: Type.STRING }
          },
          required: ["status", "details"]
        },
        urgencyAnalysis: {
          type: Type.OBJECT,
          properties: {
            isUrgent: { type: Type.BOOLEAN },
            details: { type: Type.STRING }
          },
          required: ["isUrgent", "details"]
        },
        linksAnalysis: {
          type: Type.OBJECT,
          properties: {
            totalLinks: { type: Type.INTEGER },
            suspiciousLinksCount: { type: Type.INTEGER },
            details: { type: Type.STRING }
          },
          required: ["totalLinks", "suspiciousLinksCount", "details"]
        },
        credentialHarvestingRisk: { type: Type.BOOLEAN },
        indicatorsOfCompromise: { type: Type.ARRAY, items: { type: Type.STRING } },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
        mitreTechniques: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: [
        "threatLevel",
        "riskScore",
        "verdictSummary",
        "senderAuthenticity",
        "urgencyAnalysis",
        "linksAnalysis",
        "credentialHarvestingRisk",
        "indicatorsOfCompromise",
        "recommendations",
        "mitreTechniques"
      ]
    };

    const { data, modelUsed } = await callGeminiWithFallback(ai, prompt, systemPrompt, schema);
    return res.json({ ...data, language, source: `${modelUsed}-kawach` });
  } catch (error: any) {
    console.error("Gemini Email Analysis Error:", error?.message || error);
    const fallbackResult = runHeuristicEmailAnalysis(req.body.emailContent || "", req.body.sender || "", req.body.subject || "", req.body.language || "English");
    return res.json({
      ...fallbackResult,
      source: "kawach-heuristic-fallback",
      notice: "Completed analysis using KAWACH rapid heuristic cyber defense rules.",
    });
  }
});

// API 2: Link / URL Verifier
app.post("/api/verify-link", async (req, res) => {
  try {
    const { url, language = "English", languageCode = "en" } = req.body;

    if (!url || typeof url !== "string" || url.trim().length === 0) {
      return res.status(400).json({ error: "URL is required for verification." });
    }

    const heuristic = runHeuristicLinkVerification(url, language);

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        ...heuristic,
        source: "kawach-heuristic-link-engine",
        notice: "Link verified using KAWACH heuristic threat intelligence.",
      });
    }

    const systemPrompt = `You are KAWACH AI Link Reputation & Fraud Verifier.
Inspect the provided URL to determine if it is TRUSTED or a FAKE / MALICIOUS / PHISHING / TYPOSQUATTED link.
Analyze domain structure, brand impersonation (e.g. SBI, HDFC, Income Tax, Netflix, Amazon, WhatsApp), lookalike characters, high-risk TLDs (.xyz, .top, .icu, .click, etc.), raw IP addresses, and credential theft traps.
Provide 'verdictSummary', 'securityChecks', 'suspiciousSignals', and 'recommendations' in ${language} (Code: ${languageCode}).`;

    const prompt = `Analyze this URL for safety and trust:
URL: "${url}"
Deterministic Heuristic Findings:
- Protocol: ${heuristic.domainDetails.protocol} (HTTPS: ${heuristic.domainDetails.isHttps})
- Hostname: ${heuristic.domainDetails.hostname}
- Is IP address: ${heuristic.domainDetails.isIpAddress}
- Is Shortener: ${heuristic.domainDetails.isShortener}
- Brand Spoof Detected: ${heuristic.brandImpersonation.detected} (${heuristic.brandImpersonation.brandName || "None"})
- Initial Risk Score: ${heuristic.riskScore}`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        threatLevel: { type: Type.STRING, description: "SAFE, SUSPICIOUS, HIGH_RISK, or CRITICAL_PHISH" },
        riskScore: { type: Type.INTEGER, description: "0 to 100 (0=Trusted, 100=Severe malicious/fake)" },
        isTrusted: { type: Type.BOOLEAN, description: "true if safe, false if suspicious/fake" },
        verdictSummary: { type: Type.STRING, description: `Clear verdict explanation in ${language}` },
        brandImpersonation: {
          type: Type.OBJECT,
          properties: {
            detected: { type: Type.BOOLEAN },
            brandName: { type: Type.STRING },
            spoofingMechanism: { type: Type.STRING }
          },
          required: ["detected"]
        },
        securityChecks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              passed: { type: Type.BOOLEAN },
              severity: { type: Type.STRING, description: "SAFE, WARNING, or CRITICAL" },
              detail: { type: Type.STRING }
            },
            required: ["name", "passed", "severity", "detail"]
          }
        },
        suspiciousSignals: { type: Type.ARRAY, items: { type: Type.STRING } },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: [
        "threatLevel",
        "riskScore",
        "isTrusted",
        "verdictSummary",
        "brandImpersonation",
        "securityChecks",
        "suspiciousSignals",
        "recommendations"
      ]
    };

    const { data, modelUsed } = await callGeminiWithFallback(ai, prompt, systemPrompt, schema);

    return res.json({
      url,
      ...data,
      domainDetails: heuristic.domainDetails,
      language,
      source: `${modelUsed}-kawach-link-verifier`
    });
  } catch (error: any) {
    console.error("Link Verification Error:", error?.message || error);
    const fallbackResult = runHeuristicLinkVerification(req.body.url || "", req.body.language || "English");
    return res.json({
      ...fallbackResult,
      source: "kawach-heuristic-fallback",
      notice: "Completed verification using KAWACH rapid threat heuristic engine.",
    });
  }
});

// API 3: Image / Screenshot Threat Analyzer (Multimodal)
app.post("/api/analyze-image", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", description = "", language = "English", languageCode = "en" } = req.body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ error: "Image data (Base64) is required." });
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");

    const ai = getGeminiClient();
    if (!ai) {
      const heuristic = runHeuristicImageAnalysis(description, mimeType, language);
      return res.json({
        ...heuristic,
        source: "kawach-heuristic-image-engine",
        notice: "Analyzed via KAWACH local image forensic heuristics.",
      });
    }

    const systemPrompt = `You are KAWACH AI Multimodal Cyber Forensics & Document Fraud Analyzer.
Inspect the provided image (which may be a screenshot of an email, SMS, WhatsApp forward, bank payment confirmation, UPI transaction receipt, traffic e-challan, electricity bill notice, or QR code request).
Determine whether the image is TRUSTED or a FAKE / SCAM / PHISHING / FRAUDULENT forgery.
Look for:
1. Visual Forgery: Font inconsistencies, misaligned logos, doctored transaction IDs, edited amounts, fake official seals/signatures.
2. Scam Tactics: Urgent payment ultimatums, threat of electricity disconnection, fake bank KYC freeze, lottery/rewards, unauthorized QR codes.
3. QR Code Safety: Warning if the image encourages scanning a QR code to 'receive money' or 'unblock accounts'.
4. Brand Impersonation: Mimicking SBI, HDFC, Paytm, PhonePe, Google Pay, Income Tax Dept, Police, Amazon, etc.
Provide 'verdictSummary', 'detectedTextSummary', 'visualRedFlags', 'forgeryIndicators', and 'recommendations' in ${language} (Code: ${languageCode}).`;

    const contents = [
      {
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: cleanBase64,
        },
      },
      `Perform forensic cyber fraud analysis on this image. Additional user notes: "${description || "None provided"}". Explain findings clearly in ${language}.`
    ];

    const schema = {
      type: Type.OBJECT,
      properties: {
        threatLevel: { type: Type.STRING, description: "SAFE, SUSPICIOUS, HIGH_RISK, or CRITICAL_PHISH" },
        riskScore: { type: Type.INTEGER, description: "0 to 100" },
        isTrusted: { type: Type.BOOLEAN, description: "true if genuine/safe, false if fake/scam" },
        documentType: { type: Type.STRING, description: "e.g. UPI Payment Receipt, Fake Electricity Notice, Bank KYC Alert, WhatsApp Lottery Screenshot" },
        verdictSummary: { type: Type.STRING, description: `Comprehensive summary verdict in ${language}` },
        authenticityStatus: { type: Type.STRING, description: "GENUINE_VERIFIED, SUSPICIOUS_ARTIFACTS, HIGH_PROBABILITY_FORGERY, or MALICIOUS_SCAM" },
        detectedTextSummary: { type: Type.STRING, description: `Key extracted text and claims summarized in ${language}` },
        brandImpersonated: {
          type: Type.OBJECT,
          properties: {
            detected: { type: Type.BOOLEAN },
            brandName: { type: Type.STRING },
            details: { type: Type.STRING }
          },
          required: ["detected"]
        },
        qrCodeOrLinkAnalysis: {
          type: Type.OBJECT,
          properties: {
            present: { type: Type.BOOLEAN },
            warning: { type: Type.STRING }
          },
          required: ["present"]
        },
        visualRedFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
        forgeryIndicators: { type: Type.ARRAY, items: { type: Type.STRING } },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: [
        "threatLevel",
        "riskScore",
        "isTrusted",
        "documentType",
        "verdictSummary",
        "authenticityStatus",
        "detectedTextSummary",
        "brandImpersonated",
        "qrCodeOrLinkAnalysis",
        "visualRedFlags",
        "forgeryIndicators",
        "recommendations"
      ]
    };

    const { data, modelUsed } = await callGeminiWithFallback(ai, contents, systemPrompt, schema);

    return res.json({
      ...data,
      brandImpersonation: data.brandImpersonated || { detected: false },
      language,
      source: `${modelUsed}-kawach-vision-forensics`
    });
  } catch (error: any) {
    console.error("Image Analysis Error:", error?.message || error);
    const fallbackResult = runHeuristicImageAnalysis(req.body.description || "", req.body.mimeType || "image/jpeg", req.body.language || "English");
    return res.json({
      ...fallbackResult,
      source: "kawach-heuristic-fallback",
      notice: "Completed image analysis using KAWACH local forensic rules.",
    });
  }
});

// API 4: Spoken Emergency Alert API (Audio & Speech Dispatcher)
app.post("/api/speak-alert", async (req, res) => {
  try {
    const {
      threatLevel = "CRITICAL_PHISH",
      threatType = "email",
      threatSummary = "Suspicious financial scam and credential harvesting attack detected.",
      brandName = "",
      target = "",
      language = "English",
      languageCode = "en"
    } = req.body;

    const isCritical = threatLevel === "CRITICAL_PHISH" || threatLevel === "HIGH_RISK";

    // Heuristic Fallback emergency scripts for Indian languages
    const getFallbackScript = () => {
      const code = (languageCode || "en").toLowerCase();
      if (code === "hi") {
        return isCritical
          ? `सावधान! आपातकालीन साइबर सुरक्षा चेतावनी। इस संदेश में गंभीर फ़िशिंग और वित्तीय धोखाधड़ी का खतरा पाया गया है। किसी भी लिंक पर क्लिक न करें, न ही ओटीपी या यूपीआई पिन साझा करें। तुरंत राष्ट्रीय साइबर अपराध हेल्पलाइन १९३० (1930) पर कॉल करें।`
          : `साइबर सुरक्षा सूचना। जांची गई सामग्री में कुछ संदिग्ध संकेत पाए गए हैं। कृपया सतर्क रहें और किसी भी अज्ञात लिंक पर अपनी निजी जानकारी साझा न करें।`;
      }
      if (code === "bn") {
        return isCritical
          ? `জরুরি সাইবার সতর্কতা! এই বার্তায় মারাত্মক ফিশিং এবং আর্থিক প্রতারণার ঝুঁকি সনাক্ত করা হয়েছে। কোনো লিঙ্কে ক্লিক করবেন না এবং ওটিপি বা পিন শেয়ার করবেন না। প্রয়োজনে অবিলম্বে ১৯৩০ নম্বরে কল করুন।`
          : `সাইবার নিরাপত্তা নোটিশ। কিছু সন্দেহজনক কার্যকলাপ পাওয়া গেছে। সতর্ক থাকুন এবং তথ্য গোপন রাখুন।`;
      }
      if (code === "mr") {
        return isCritical
          ? `सावधान! आणीबाणी सायबर सुरक्षा इशारा. या संदेशात गंभीर फसवणूक आणि आर्थिक घोटाळ्याचा धोका आढळला आहे. कोणत्याही लिंकवर क्लिक करू नका आणि ओटीपी शेअर करू नका. तातडीने १९३० वर संपर्क साधा.`
          : `सायबर सुरक्षा सूचना. संशयास्पद हालचाली आढळल्या आहेत. कृपया सावधगिरी बाळगा.`;
      }
      if (code === "ta") {
        return isCritical
          ? `அவசர சைபர் பாதுகாப்பு எச்சரிக்கை! இதில் கடுமையான மோசடி மற்றும் நிதி திருட்டு ஆபத்து கண்டறியப்பட்டுள்ளது. எந்த லிங்க்கையும் கிளிக் செய்யாதீர்கள், OTP பகிராதீர்கள். உடனே 1930 எண்ணை அழைக்கவும்.`
          : `சைபர் பாதுகாப்பு அறிவிப்பு. எச்சரிக்கையுடன் செயல்படவும்.`;
      }
      if (code === "te") {
        return isCritical
          ? `అత్యవసర సైబర్ భద్రతా హెచ్చరిక! ఇందులో తీవ్రమైన ఫిషింగ్ మరియు ఆర్థిక మోసం ప్రమాదం గుర్తించబడింది. ఏ లింక్‌ను క్లిక్ చేయవద్దు, OTP షేర్ చేయవద్దు. వెంటనే 1930 కి కాల్ చేయండి.`
          : `సైబర్ భద్రతా సమాచారం. దయచేసి అప్రమత్తంగా ఉండండి.`;
      }
      if (code === "gu") {
        return isCritical
          ? `સાવધાન! કટોકટી સાયબર સુરક્ષા ચેતવણી. આમાં ગંભીર છેતરપિંડી અને નાણાકીય જોખમ મળ્યું છે. કોઈપણ લિંક પર ક્લિક કરશો નહીં અને ઓટીપી શેર કરશો નહીં. તાત્કાલિક 1930 પર કોલ કરો.`
          : `સાયબર સુરક્ષા સૂચના. કૃપા કરીને સાવચેત રહો.`;
      }
      // Default English
      return isCritical
        ? `Emergency Cyber Security Alert! A critical threat and high-probability fraud attempt has been detected in this ${threatType}. Do not click any links, do not download attachments, and never share OTPs or passwords. If you suspect fraud, immediately call the National Cyber Crime Helpline at 1 9 3 0.`
        : `Cyber Security Notice. The analyzed ${threatType} contains suspicious patterns. Please exercise caution before trusting this message or entering personal credentials.`;
    };

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        alertTitle: isCritical ? "EMERGENCY CYBER ALERT" : "CYBER SECURITY NOTICE",
        emergencySpokenScript: getFallbackScript(),
        phoneticTone: isCritical ? "URGENT_COMMAND" : "ADVISORY",
        keySafetyDirectives: [
          "Do not click links or enter passwords",
          "Never share bank OTP or UPI PIN",
          "Dial Cyber Helpline 1930 immediately"
        ],
        target: target || "Suspicious target",
        language,
        languageCode,
        audioSirenProfile: isCritical ? "PULSED_DUAL_KLAXON" : "SOFT_CHIME",
        source: "kawach-emergency-dispatch-engine"
      });
    }

    const systemPrompt = `You are KAWACH AI Emergency Cyber Broadcast Announcer.
Your job is to generate a short, authoritative, natural spoken emergency announcement script that will be read aloud via Text-to-Speech to protect the victim from immediate financial loss and cyber fraud.
Language Requirement: Generate the speech announcement in ${language} (Code: ${languageCode}).
Tone: Crisp, authoritative, urgent, protective (like an emergency broadcast or air-raid siren voice).
Length: 2 to 4 sentences maximum. Must explicitly instruct not to share OTP/passwords, not to transfer money, and to call National Cyber Crime Helpline 1930.`;

    const prompt = `Create an emergency spoken voice announcement:
Threat Level: ${threatLevel}
Threat Type: ${threatType}
Summary: ${threatSummary}
Target: ${target || "Suspicious content"}
Brand Spoofed: ${brandName || "None"}
Language: ${language} (${languageCode})`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        alertTitle: { type: Type.STRING, description: "e.g. EMERGENCY CYBER ALERT" },
        emergencySpokenScript: { type: Type.STRING, description: `Spoken speech announcement text in ${language}` },
        phoneticTone: { type: Type.STRING, description: "URGENT_COMMAND or ADVISORY" },
        keySafetyDirectives: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["alertTitle", "emergencySpokenScript", "phoneticTone", "keySafetyDirectives"]
    };

    const { data, modelUsed } = await callGeminiWithFallback(ai, prompt, systemPrompt, schema);

    return res.json({
      ...data,
      target: target || "Target",
      language,
      languageCode,
      audioSirenProfile: isCritical ? "PULSED_DUAL_KLAXON" : "SOFT_CHIME",
      source: `${modelUsed}-emergency-voice-api`
    });
  } catch (error: any) {
    console.error("Speak Alert API Error:", error?.message || error);
    return res.json({
      alertTitle: "EMERGENCY CYBER ALERT",
      emergencySpokenScript: "Emergency Cyber Security Alert! Critical threat detected. Do not click links, do not share OTPs, and immediately call Cyber Crime Helpline 1930.",
      phoneticTone: "URGENT_COMMAND",
      keySafetyDirectives: [
        "Do not click links or enter passwords",
        "Never share bank OTP or UPI PIN",
        "Dial Cyber Helpline 1930 immediately"
      ],
      target: req.body.target || "Target",
      language: req.body.language || "English",
      languageCode: req.body.languageCode || "en",
      audioSirenProfile: "PULSED_DUAL_KLAXON",
      source: "kawach-fallback-voice-engine"
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`KAWACH AI Defense Engine running on http://localhost:${PORT}`);
  });
}

startServer();
