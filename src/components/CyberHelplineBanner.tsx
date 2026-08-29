import React from 'react';
import { PhoneCall, ExternalLink, ShieldAlert } from 'lucide-react';
import { TranslationStrings } from '../types';

interface Props {
  translations: TranslationStrings;
}

export const CyberHelplineBanner: React.FC<Props> = ({ translations }) => {
  return (
    <div
      id="cyber-helpline-banner"
      className="p-6 sm:p-7 rounded-2xl bg-[#0a0a0a] border border-red-900/40 shadow-2xl shadow-red-900/10 relative overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-950/40 border border-red-900/60 text-red-500 flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h4 className="text-base font-black text-white flex items-center gap-2.5 tracking-tight">
              <span>{translations.cyberHelplineTitle}</span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-red-600 text-white font-black shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                1930
              </span>
            </h4>
            <p className="text-xs text-gray-400 mt-1 max-w-xl leading-relaxed">
              {translations.cyberHelplineText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto">
          <a
            id="cybercrime-gov-portal-link"
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-red-600/50 text-xs font-bold uppercase tracking-wider text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-[0_0_10px_rgba(220,38,38,0.15)] group"
          >
            <span>cybercrime.gov.in</span>
            <ExternalLink className="w-3.5 h-3.5 text-red-400 group-hover:text-white transition-colors" />
          </a>
        </div>
      </div>
    </div>
  );
};

