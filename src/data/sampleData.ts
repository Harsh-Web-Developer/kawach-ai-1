import { SampleEmail, SampleLink, SampleImageScenario } from '../types';

export { SAMPLE_EMAILS } from './sampleEmails';

export const SAMPLE_LINKS: SampleLink[] = [
  {
    id: 'sbi-fake-kyc',
    title: '🚨 Fake SBI KYC Portal (Brand Impersonation)',
    category: 'phishing',
    url: 'http://login.sbi-bank-verify.xyz/login.php?action=kyc_update',
    description: 'Impersonates State Bank of India with disposable .xyz TLD, insecure HTTP, and deceptive subdomain.'
  },
  {
    id: 'google-official',
    title: '🛡️ Official Google Security Portal (Trusted)',
    category: 'safe',
    url: 'https://myaccount.google.com/security-checkup',
    description: 'Genuine Google domain with valid SSL encryption and verified global reputation.'
  },
  {
    id: 'incometax-refund-scam',
    title: '💸 Fake Income Tax Refund Claim (Scam)',
    category: 'scam',
    url: 'https://incometaxindia-refund-portal.top/claim-fast-refund.html',
    description: 'Mimics Indian Income Tax department with lookalike domain and fraudulent refund lure.'
  },
  {
    id: 'bitly-masked-trap',
    title: '🔗 Masked Shortener Redirect (Suspicious)',
    category: 'shortener',
    url: 'http://bit.ly/free-recharge-offer-599',
    description: 'Masked URL shortener concealing actual malware download or phishing destination.'
  },
  {
    id: 'hdfc-official',
    title: '🛡️ Official HDFC NetBanking (Trusted)',
    category: 'safe',
    url: 'https://netbanking.hdfcbank.com/netbanking/',
    description: 'Verified official corporate netbanking portal of HDFC Bank.'
  },
  {
    id: 'raw-ip-malware',
    title: '⚠️ Direct IP APK Dropper (Critical Hazard)',
    category: 'phishing',
    url: 'http://192.241.144.20/bses-power-bill-update.apk',
    description: 'Direct numerical IP address hosting a malicious Android APK payload.'
  }
];

// High quality, self-contained SVG Data URLs for realistic scam/safe sample previews
export const SAMPLE_IMAGES: SampleImageScenario[] = [
  {
    id: 'fake-electricity-notice',
    title: '⚡ Fake Electricity Bill Disconnection Notice',
    category: 'fraud',
    description: 'Urgent notice claiming power cut at 9:30 PM with unauthorized WhatsApp contact number.',
    mimeType: 'image/svg+xml',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420" fill="none">
      <rect width="600" height="420" rx="16" fill="%23111111"/>
      <rect x="20" y="20" width="560" height="380" rx="12" fill="%231a0d0d" stroke="%23dc2626" stroke-width="2"/>
      <circle cx="60" cy="65" r="22" fill="%23dc2626" fill-opacity="0.2"/>
      <text x="60" y="72" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23ef4444" text-anchor="middle">⚡</text>
      <text x="95" y="60" font-family="sans-serif" font-size="16" font-weight="900" fill="%23ffffff">STATE ELECTRICITY DISTRIBUTION CORP</text>
      <text x="95" y="78" font-family="sans-serif" font-size="11" fill="%23f87171">URGENT DISCONNECTION NOTICE %23DL-8924</text>
      <line x1="40" y1="105" x2="560" y2="105" stroke="%237f1d1d" stroke-dasharray="4 4"/>
      <text x="40" y="140" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23ffffff">Dear Consumer (Consumer No: 10098234),</text>
      <text x="40" y="170" font-family="sans-serif" font-size="13" fill="%23e5e7eb">Your electricity power will be DISCONNECTED TONIGHT at 09:30 PM</text>
      <text x="40" y="195" font-family="sans-serif" font-size="13" fill="%23e5e7eb">because previous month unpaid bill of Rs. 1,840 is not updated.</text>
      <rect x="40" y="225" width="520" height="60" rx="8" fill="%232d0c0c" stroke="%23ef4444"/>
      <text x="55" y="250" font-family="sans-serif" font-size="12" font-weight="bold" fill="%23fca5a5">IMMEDIATELY CALL POWER OFFICER ON WHATSAPP:</text>
      <text x="55" y="272" font-family="monospace" font-size="16" font-weight="bold" fill="%23ffffff">+91 98765-XXXXX / Scan QR below to pay</text>
      <rect x="40" y="305" width="90" height="75" rx="6" fill="%23ffffff"/>
      <rect x="50" y="315" width="20" height="20" fill="%23000000"/>
      <rect x="100" y="315" width="20" height="20" fill="%23000000"/>
      <rect x="50" y="350" width="20" height="20" fill="%23000000"/>
      <rect x="75" y="335" width="20" height="20" fill="%23dc2626"/>
      <text x="145" y="335" font-family="sans-serif" font-size="11" fill="%239ca3af">Do not reply to this auto-generated ticket.</text>
      <text x="145" y="355" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23ef4444">FAILURE TO PAY WILL INCUR RS 5,000 PENALTY</text>
    </svg>`
  },
  {
    id: 'fake-upi-receipt',
    title: '💸 Doctored Fake UPI Payment Receipt (Scam)',
    category: 'receipt',
    description: 'Fabricated UPI payment success screenshot showing Rs. 25,000 transferred with fake UTR.',
    mimeType: 'image/svg+xml',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420" fill="none">
      <rect width="600" height="420" rx="16" fill="%2309090b"/>
      <rect x="20" y="20" width="560" height="380" rx="12" fill="%23121217" stroke="%2327272a" stroke-width="1.5"/>
      <circle cx="300" cy="70" r="26" fill="%2310b981"/>
      <path d="M290 70 L297 77 L312 62" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="300" y="125" font-family="sans-serif" font-size="24" font-weight="900" fill="%23ffffff" text-anchor="middle">₹25,000.00</text>
      <text x="300" y="148" font-family="sans-serif" font-size="13" font-weight="bold" fill="%2310b981" text-anchor="middle">Paid Successfully to Merchant</text>
      <line x1="50" y1="170" x2="550" y2="170" stroke="%2327272a"/>
      <text x="60" y="205" font-family="sans-serif" font-size="12" fill="%23a1a1aa">To</text>
      <text x="540" y="205" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23ffffff" text-anchor="end">Shree Electronics Store</text>
      <text x="60" y="240" font-family="sans-serif" font-size="12" fill="%23a1a1aa">UPI Transaction ID</text>
      <text x="540" y="240" font-family="monospace" font-size="12" fill="%23e4e4e7" text-anchor="end">429183049281 (UNVERIFIED)</text>
      <text x="60" y="275" font-family="sans-serif" font-size="12" fill="%23a1a1aa">Google Pay Ref No.</text>
      <text x="540" y="275" font-family="monospace" font-size="12" fill="%23e4e4e7" text-anchor="end">CIC89234823</text>
      <text x="60" y="310" font-family="sans-serif" font-size="12" fill="%23a1a1aa">Debited from</text>
      <text x="540" y="310" font-family="sans-serif" font-size="12" fill="%23e4e4e7" text-anchor="end">State Bank of India - XX9921</text>
      <rect x="50" y="340" width="500" height="40" rx="8" fill="%23271414" stroke="%23dc2626"/>
      <text x="300" y="365" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23ef4444" text-anchor="middle">⚠️ FAKE RECEIPT ALERT: No bank ledger entry recorded for this UTR</text>
    </svg>`
  },
  {
    id: 'bank-kyc-alert-sms',
    title: '📱 WhatsApp / SMS Bank KYC Suspension Warning',
    category: 'kyc',
    description: 'Viral WhatsApp forward threatening bank account freeze within 24h with fake biometric link.',
    mimeType: 'image/svg+xml',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420" fill="none">
      <rect width="600" height="420" rx="16" fill="%230b141a"/>
      <rect x="20" y="20" width="560" height="380" rx="12" fill="%23111b21" stroke="%23202c33"/>
      <rect x="40" y="40" width="520" height="50" rx="8" fill="%23202c33"/>
      <circle cx="70" cy="65" r="16" fill="%2300a884"/>
      <text x="70" y="70" font-family="sans-serif" font-size="14" fill="%23ffffff" text-anchor="middle">🏦</text>
      <text x="100" y="60" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23e9edef">+91 78901-XXXXX (Unknown)</text>
      <text x="100" y="76" font-family="sans-serif" font-size="11" fill="%238696a0">Forwarded message</text>
      <rect x="40" y="110" width="520" height="220" rx="12" fill="%23005c4b" fill-opacity="0.3" stroke="%2300a884" stroke-opacity="0.4"/>
      <text x="60" y="145" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23ff7676">🚨 DEAR CUSTOMER YOUR SBI YONO ACCOUNT BLOCKED</text>
      <text x="60" y="180" font-family="sans-serif" font-size="13" fill="%23e9edef">Your SBI YONO NetBanking has been suspended today</text>
      <text x="60" y="205" font-family="sans-serif" font-size="13" fill="%23e9edef">due to missing PAN card upload under RBI notification.</text>
      <text x="60" y="240" font-family="sans-serif" font-size="13" font-weight="bold" fill="%2353bdeb">Click here to update PAN immediately:</text>
      <text x="60" y="265" font-family="monospace" font-size="13" font-weight="bold" fill="%2338bdf8" text-decoration="underline">http://sbiyono-kyc-verify.top/pan.apk</text>
      <text x="60" y="300" font-family="sans-serif" font-size="11" fill="%238696a0">Thank you, Team SBI Online Support</text>
      <rect x="40" y="345" width="520" height="35" rx="6" fill="%231f1315" stroke="%23dc2626"/>
      <text x="300" y="367" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23f87171" text-anchor="middle">FRAUD PATTERN: Banks NEVER send APK files or third-party links on WhatsApp</text>
    </svg>`
  }
];
