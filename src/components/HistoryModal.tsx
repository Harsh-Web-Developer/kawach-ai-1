import React, { useState, useEffect } from 'react';
import {
  History,
  Trash2,
  Download,
  X,
  Search,
  Mail,
  Link as LinkIcon,
  Image as ImageIcon,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  Copy,
  Check,
  Volume2,
  Filter,
} from 'lucide-react';
import { HistoryRecord, AppToolMode, ThreatLevel, IndianLanguage, TranslationStrings } from '../types';
import {
  getHistoryRecords,
  deleteHistoryRecord,
  clearAllHistory,
  exportHistoryJSON,
  HISTORY_UPDATED_EVENT,
} from '../utils/historyStorage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRestoreRecord: (record: HistoryRecord) => void;
  onTriggerEmergencyAlert: (record: HistoryRecord) => void;
  translations: TranslationStrings;
  currentLanguage: IndianLanguage;
}

export const HistoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onRestoreRecord,
  onTriggerEmergencyAlert,
  translations,
  currentLanguage,
}) => {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [filterType, setFilterType] = useState<AppToolMode | 'all'>('all');
  const [filterThreat, setFilterThreat] = useState<ThreatLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadRecords = () => {
    setRecords(getHistoryRecords());
  };

  useEffect(() => {
    if (isOpen) {
      loadRecords();
    }
  }, [isOpen]);

  useEffect(() => {
    window.addEventListener(HISTORY_UPDATED_EVENT, loadRecords);
    return () => window.removeEventListener(HISTORY_UPDATED_EVENT, loadRecords);
  }, []);

  if (!isOpen) return null;

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteHistoryRecord(id);
    loadRecords();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all scan history? This action cannot be undone.')) {
      clearAllHistory();
      loadRecords();
    }
  };

  const handleCopySummary = (record: HistoryRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `KAWACH AI SCAN REPORT (${record.type.toUpperCase()})
Title: ${record.title}
Target: ${record.target}
Verdict: ${record.threatLevel} (Risk: ${record.riskScore}/100)
Summary: ${record.verdictSummary}
Date: ${new Date(record.timestamp).toLocaleString()}`;

    navigator.clipboard.writeText(text);
    setCopiedId(record.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredRecords = records.filter((r) => {
    if (filterType !== 'all' && r.type !== filterType) return false;
    if (filterThreat !== 'all' && r.threatLevel !== filterThreat) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchTarget = r.target.toLowerCase().includes(q);
      const matchVerdict = r.verdictSummary.toLowerCase().includes(q);
      return matchTitle || matchTarget || matchVerdict;
    }
    return true;
  });

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getThreatBadge = (level: ThreatLevel) => {
    switch (level) {
      case 'CRITICAL_PHISH':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-sm">
            Critical
          </span>
        );
      case 'HIGH_RISK':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-700 text-white shadow-sm">
            High Risk
          </span>
        );
      case 'SUSPICIOUS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-600 text-white shadow-sm">
            Suspicious
          </span>
        );
      case 'SAFE':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-sm">
            Safe
          </span>
        );
    }
  };

  return (
    <div
      id="history-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        id="history-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl rounded-3xl bg-[#0b0b0e] border border-red-900/40 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-950/60 border border-red-900/50 text-red-500">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {translations.historyTitle || 'Scan History'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 text-xs font-mono font-bold">
                  {records.length} {records.length === 1 ? 'Scan' : 'Scans'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {translations.historySubtitle || 'Chronological log of verified emails, links, and scanned images'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {records.length > 0 && (
              <>
                <button
                  id="history-export-btn"
                  type="button"
                  onClick={exportHistoryJSON}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                  title="Export History JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  id="history-clear-all-btn"
                  type="button"
                  onClick={handleClearAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-950 border border-red-900/40 text-red-400 text-xs font-semibold transition-colors cursor-pointer"
                  title="Clear all records"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </>
            )}

            <button
              id="close-history-modal-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters & Search Controls */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-950/30 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Tool Category Tabs */}
          <div className="flex items-center gap-1 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800 overflow-x-auto shrink-0">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              All ({records.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('email')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'email'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Emails ({records.filter((r) => r.type === 'email').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('link')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'link'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Links ({records.filter((r) => r.type === 'link').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('image')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'image'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Images ({records.filter((r) => r.type === 'image').length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              id="history-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search targets or verdicts..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-red-600 text-xs text-white placeholder:text-zinc-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Records List Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 max-h-[55vh]">
          {filteredRecords.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-3">
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-600">
                <History className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">
                {translations.emptyHistoryTitle || 'No Scans Found'}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {searchQuery
                  ? `No scan records match "${searchQuery}". Try a different search query.`
                  : translations.emptyHistoryText ||
                    'When you analyze emails, check links, or scan screenshots, they will appear here.'}
              </p>
            </div>
          ) : (
            filteredRecords.map((record) => {
              const isCrit = record.threatLevel === 'CRITICAL_PHISH' || record.threatLevel === 'HIGH_RISK';
              return (
                <div
                  key={record.id}
                  id={`history-item-${record.id}`}
                  onClick={() => {
                    onRestoreRecord(record);
                    onClose();
                  }}
                  className="group p-4 rounded-2xl bg-zinc-950 hover:bg-zinc-900/90 border border-zinc-800/80 hover:border-red-900/60 transition-all cursor-pointer shadow-sm relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left Icon & Details */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                          isCrit
                            ? 'bg-red-950/80 border border-red-700/60 text-red-500'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                        }`}
                      >
                        {record.type === 'email' && <Mail className="w-4 h-4" />}
                        {record.type === 'link' && <LinkIcon className="w-4 h-4" />}
                        {record.type === 'image' && <ImageIcon className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-white truncate max-w-md group-hover:text-red-400 transition-colors">
                            {record.title}
                          </span>
                          {getThreatBadge(record.threatLevel)}
                          <span className="text-[10px] font-mono text-zinc-500 font-bold">
                            Score: {record.riskScore}/100
                          </span>
                        </div>

                        {record.target && (
                          <div className="text-[11px] text-zinc-400 font-mono truncate mb-1">
                            {record.target}
                          </div>
                        )}

                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {record.verdictSummary}
                        </p>
                      </div>
                    </div>

                    {/* Right Side Metadata & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60 shrink-0">
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(record.timestamp)}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Copy Summary */}
                        <button
                          type="button"
                          onClick={(e) => handleCopySummary(record, e)}
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                          title="Copy scan summary"
                        >
                          {copiedId === record.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Speak Alert */}
                        {isCrit && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTriggerEmergencyAlert(record);
                            }}
                            className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-600 border border-red-900/50 text-red-400 hover:text-white transition-colors"
                            title="Speak Emergency Alert"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* View & Restore */}
                        <button
                          type="button"
                          onClick={() => {
                            onRestoreRecord(record);
                            onClose();
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors shadow-sm"
                          title="View Full Report"
                        >
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(record.id, e)}
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950 text-zinc-500 hover:text-red-400 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800/80 bg-zinc-950/80 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>Click any scan report to load full threat forensics</span>
          <span>KAWACH Local Threat Log</span>
        </div>
      </div>
    </div>
  );
};
