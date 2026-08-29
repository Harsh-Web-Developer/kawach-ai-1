import { SampleEmail } from '../types';

export const SAMPLE_EMAILS: SampleEmail[] = [
  {
    id: 'sbi-kyc-scam',
    title: '🚨 SBI / HDFC Bank KYC Block (Critical Phish)',
    category: 'phishing',
    sender: 'customer-care@sbi-online-verification.xyz',
    subject: 'URGENT: Your SBI Account will be BLOCKED in 24 Hours due to Pending KYC',
    content: `Dear Customer,

Your State Bank Account No: XXXX-XXXX-2194 has been temporarily frozen due to unverified PAN and Aadhaar KYC documents under RBI regulations.

If you fail to update your KYC within 24 HOURS, your debit card and internet banking services will be permanently suspended with a penalty fine of Rs. 2,500.

Please click the secure link below to verify your NetBanking credentials and complete instant biometric/OTP verification:

👉 http://login-sbi-portal.top/verify-kyc.php?token=92837492

NOTE: Do NOT share this email with anyone.

Regards,
State Bank of India Online Security Cell
Nariman Point, Mumbai`,
    description: 'Realistic fake banking KYC phishing email with urgent ultimatum, spoofed domain (.xyz/.top), and credential harvesting link.'
  },
  {
    id: 'electricity-bill-scam',
    title: '⚡ Electricity Power Disconnection Scam (High Risk)',
    category: 'scam',
    sender: 'alerts@bses-delhi-power.click',
    subject: 'IMPORTANT NOTICE: Electricity power disconnect tonight at 9:30 PM',
    content: `Dear Consumer,

Your Electricity connection will be disconnected tonight at 9.30 pm from the central power grid office because your previous month's bill payment was not updated.

Please immediately contact our head electricity billing officer Mr. Sharma on WhatsApp / Phone: 98765-XXXXX or download our official consumer verification APK support app to clear payment instantly:

👉 http://192.241.144.20/bses-support-update.apk

Do not delay or power will not be restored for 7 working days.

Chief Engineer,
Electricity Distribution Board`,
    description: 'Targeted Indian electricity bill scam pushing malware/fake APK download and urgent panic disconnect threats.'
  },
  {
    id: 'ceo-giftcard-spearphish',
    title: '💼 CEO / Executive Gift Card Trap (Spearphish)',
    category: 'spearphishing',
    sender: 'rajesh.ceo.office@gmail.com',
    subject: 'Quick task - Are you available at your desk right now?',
    content: `Hi,

I am currently in an urgent board meeting with overseas investors and cannot receive voice calls right now.

I need you to handle a discrete, urgent company task immediately. Can you please purchase 5 Apple App Store Gift Cards (Rs. 10,000 each) for client appreciation gifts?

Scratch the back, take clear photos of the codes, and email them back to me directly at this address within 30 minutes. I will approve your reimbursement expense voucher first thing tomorrow morning.

Keep this strictly confidential.

Best regards,
Rajesh Kumar
Chief Executive Officer`,
    description: 'Classic business email compromise (BEC) impersonating the CEO using a personal Gmail address with high urgency.'
  },
  {
    id: 'safe-google-security',
    title: '🛡️ Legitimate Google Security Alert (Safe)',
    category: 'safe',
    sender: 'no-reply@accounts.google.com',
    subject: 'Security alert: New device signed in to your Google Account',
    content: `Your Google Account was just signed in to from a new Linux device in Bengaluru, Karnataka, India.

Device: Chrome on Ubuntu Linux
Time: Today, 3:45 PM IST
IP Address: 103.21.244.12

If this was you, you don't need to do anything. If you don't recognize this activity, review your devices immediately at https://myaccount.google.com/notifications

Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA`,
    description: 'Legitimate security notification with authentic domain, verified SPF/DKIM references, and genuine google.com safety URLs.'
  },
  {
    id: 'courier-package-scam',
    title: '📦 India Post / DHL Delivery Fee Phishing (High Risk)',
    category: 'phishing',
    sender: 'tracking-update@indiapost-speed-customs.icu',
    subject: 'Notice: Your package #IN-8492048 cannot be delivered (Customs Duty Unpaid)',
    content: `Dear Consignee,

Your Speed Post parcel (Tracking ID: IN-8492048) has arrived at the regional sorting hub but could not be dispatched due to an unpaid address re-delivery & clearance fee of Rs. 48.

Please update your delivery address and pay the clearance fee using Credit Card/UPI immediately to prevent return to sender:

👉 https://indiapost-customs-pay.icu/track/IN8492048

After payment, your package will be delivered within 24 hours.

India Post Delivery Services`,
    description: 'Package customs fee scam using fake domain (.icu) asking for small token payments to steal card credentials and CVV.'
  }
];
