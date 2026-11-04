import type { ExportFormat, FieldFilters, ReportModule } from './reports.config';
import { apiJson, type ReportFilters } from './reports.api';

// History stores report SETTINGS (not the exported file). Re-running regenerates from current data.
//
// Two stores behind one interface:
//  - server: the backend's /admin/reports/history endpoints (per admin, shared across devices)
//  - local:  this browser's localStorage (kept for the one-time import and as a fallback)
// Switch with HISTORY_BACKEND.

export const HISTORY_BACKEND: 'server' | 'local' = 'server';

export interface HistoryEntry {
  id: string;
  module: ReportModule;
  columns: string[];
  filters: ReportFilters; // base filters: start_date, end_date, status, search
  fieldFilters: FieldFilters; // per-column filters
  format: ExportFormat;
  recordCount: number | null;
  createdAt: string; // ISO
  lastRunAt: string; // ISO
  runs: number;
  copiedFrom?: string; // id of the entry this was copied from
}

export type NewHistoryEntry = Omit<HistoryEntry, 'id' | 'createdAt' | 'lastRunAt' | 'runs'>;

export interface HistoryStore {
  list(): Promise<HistoryEntry[]>;
  /** Saves a generated report. Identical settings update the existing entry (unless copiedFrom is set). */
  record(entry: NewHistoryEntry): Promise<HistoryEntry>;
  /** A re-run of an existing entry: bumps run count and last run time. */
  touch(id: string, recordCount: number | null): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

// ---- Server store ------------------------------------------------------------
/* eslint-disable @typescript-eslint/no-explicit-any */
function parseJson<T>(v: unknown, fallback: T): T {
  if (typeof v === 'string') {
    try {
      return JSON.parse(v) as T;
    } catch {
      return fallback;
    }
  }
  return ((v ?? fallback) as T) || fallback;
}

function fromServer(e: any): HistoryEntry {
  return {
    id: String(e.id),
    module: e.module,
    columns: parseJson<string[]>(e.columns, []),
    filters: parseJson<ReportFilters>(e.filters, {}),
    fieldFilters: parseJson<FieldFilters>(e.field_filters, {}),
    format: e.format === 'pdf' ? 'pdf' : 'excel',
    recordCount: typeof e.record_count === 'number' ? e.record_count : null,
    createdAt: e.created_at ?? e.last_run_at ?? new Date().toISOString(),
    lastRunAt: e.last_run_at ?? e.created_at ?? new Date().toISOString(),
    runs: typeof e.runs === 'number' ? e.runs : 1,
    copiedFrom: e.copied_from ? String(e.copied_from) : undefined,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const serverHistoryStore: HistoryStore = {
  async list() {
    const out: HistoryEntry[] = [];
    for (let page = 1; page <= 25; page++) {
      const json = await apiJson('GET', `/admin/reports/history?page=${page}&limit=20`);
      const items: unknown[] = Array.isArray(json?.data) ? json.data : [];
      out.push(...items.map(fromServer));
      const pages = Number(json?.pagination?.pages ?? 1);
      if (page >= pages || items.length === 0) break;
    }
    return out; // the API already returns newest last_run_at first
  },

  async record(entry) {
    const body: Record<string, unknown> = {
      module: entry.module,
      columns: entry.columns,
      filters: entry.filters,
      field_filters: entry.fieldFilters,
      format: entry.format,
    };
    if (entry.recordCount !== null) body.record_count = entry.recordCount;
    if (entry.copiedFrom && /^\d+$/.test(entry.copiedFrom)) body.copied_from = Number(entry.copiedFrom);
    const json = await apiJson('POST', '/admin/reports/history', body);
    return fromServer(json?.data ?? json);
  },

  async touch(id, recordCount) {
    await apiJson(
      'POST',
      `/admin/reports/history/${encodeURIComponent(id)}/run`,
      recordCount === null ? {} : { record_count: recordCount },
    );
  },

  async remove(id) {
    await apiJson('DELETE', `/admin/reports/history/${encodeURIComponent(id)}`);
  },

  async clear() {
    await apiJson('DELETE', '/admin/reports/history');
  },
};

// ---- localStorage store ----------------------------------------------------------
const KEY = 'reports.history.v1';
const MAX_ENTRIES = 200;

function read(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(list: HistoryEntry[]): void {
  try {
    const sorted = [...list].sort((a, b) => b.lastRunAt.localeCompare(a.lastRunAt));
    localStorage.setItem(KEY, JSON.stringify(sorted.slice(0, MAX_ENTRIES)));
  } catch {
    /* storage full or blocked: history just won't persist */
  }
}

const sortedPairs = (o: object) => Object.entries(o).sort(([a], [b]) => a.localeCompare(b));
const signature = (e: NewHistoryEntry) =>
  JSON.stringify([e.module, [...e.columns].sort(), sortedPairs(e.filters), sortedPairs(e.fieldFilters), e.format]);

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const localHistoryStore: HistoryStore = {
  async list() {
    return read().sort((a, b) => b.lastRunAt.localeCompare(a.lastRunAt));
  },

  async record(entry) {
    const list = read();
    const now = new Date().toISOString();
    const existing = entry.copiedFrom ? undefined : list.find((e) => signature(e) === signature(entry));
    if (existing) {
      existing.lastRunAt = now;
      existing.runs += 1;
      existing.recordCount = entry.recordCount;
      write(list);
      return existing;
    }
    const created: HistoryEntry = { ...entry, id: newId(), createdAt: now, lastRunAt: now, runs: 1 };
    write([created, ...list]);
    return created;
  },

  async touch(id, recordCount) {
    const list = read();
    const e = list.find((x) => x.id === id);
    if (!e) return;
    e.lastRunAt = new Date().toISOString();
    e.runs += 1;
    e.recordCount = recordCount ?? e.recordCount;
    write(list);
  },

  async remove(id) {
    write(read().filter((e) => e.id !== id));
  },

  async clear() {
    write([]);
  },
};

export const historyStore: HistoryStore = HISTORY_BACKEND === 'server' ? serverHistoryStore : localHistoryStore;

/** One-time move of reports saved in this browser (the old storage) to the admin's server history. */
export async function migrateLocalHistory(): Promise<number> {
  const local = (await localHistoryStore.list()).reverse(); // oldest first
  let moved = 0;
  for (const e of local) {
    await serverHistoryStore.record({
      module: e.module,
      columns: e.columns,
      filters: e.filters,
      fieldFilters: e.fieldFilters,
      format: e.format,
      recordCount: e.recordCount,
    });
    await localHistoryStore.remove(e.id); // removed as we go, so a retry never duplicates
    moved++;
  }
  return moved;
}