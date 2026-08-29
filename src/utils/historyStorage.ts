import { HistoryRecord, AppToolMode, ThreatLevel } from '../types';

const STORAGE_KEY = 'kawach_scan_history_v1';
const MAX_HISTORY_ITEMS = 50;

export const HISTORY_UPDATED_EVENT = 'kawach_history_updated';

export function getHistoryRecords(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Failed to parse history from localStorage:', err);
    return [];
  }
}

export function saveHistoryRecord(
  item: Omit<HistoryRecord, 'id' | 'timestamp'>
): HistoryRecord {
  try {
    const current = getHistoryRecords();
    const newRecord: HistoryRecord = {
      ...item,
      id: 'scan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now(),
    };

    // Keep most recent first, limit to MAX_HISTORY_ITEMS
    const updated = [newRecord, ...current.filter((r) => r.id !== newRecord.id)].slice(
      0,
      MAX_HISTORY_ITEMS
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(HISTORY_UPDATED_EVENT));
    return newRecord;
  } catch (err) {
    console.error('Failed to save scan record to history:', err);
    return {
      ...item,
      id: 'temp_' + Date.now(),
      timestamp: Date.now(),
    };
  }
}

export function deleteHistoryRecord(id: string): void {
  try {
    const current = getHistoryRecords();
    const filtered = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event(HISTORY_UPDATED_EVENT));
  } catch (err) {
    console.error('Failed to delete history record:', err);
  }
}

export function clearAllHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(HISTORY_UPDATED_EVENT));
  } catch (err) {
    console.error('Failed to clear history:', err);
  }
}

export function exportHistoryJSON(): void {
  const records = getHistoryRecords();
  const blob = new Blob([JSON.stringify(records, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kawach_scan_history_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
