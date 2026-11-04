import {
  REPORTS,
  type ColumnDef,
  type ExportFormat,
  type FieldFilters,
  type ReportModule,
} from './reports.config';
import {
  exportAllAsExcel,
  exportAllAsPdf,
  exportReport,
  getByPath,
  type ReportFilters,
  type Row,
} from './reports.api';

export const MIN = '__min'; // number minimum / date "from"
export const MAX = '__max'; // number maximum / date "to"

export const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : 'Something went wrong. Try again.';

/** A filter value as text (filters can also hold numbers and booleans once sent to the API). */
export const fstr = (v: unknown): string => (typeof v === 'string' ? v : '');

// ---- Display ---------------------------------------------------------------
export function formatCell(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (/(_at|_date|At|Date)$/.test(key)) {
    const d = new Date(String(value));
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString(undefined, {
        dateStyle: 'medium',
        ...(/(_at|At)$/.test(key) ? { timeStyle: 'short' as const } : {}),
      });
    }
  }
  if (typeof value === 'number' && /amount/i.test(key)) return value.toLocaleString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// ---- Filters ---------------------------------------------------------------
export function cleanFilters(f: ReportFilters): ReportFilters {
  const out: ReportFilters = {};
  Object.entries(f).forEach(([k, v]) => {
    if (typeof v === 'string') {
      const t = v.trim();
      if (t) out[k] = t;
    } else if (v !== undefined && v !== null) {
      out[k] = v;
    }
  });
  return out;
}

export function cleanFieldFilters(f: FieldFilters): FieldFilters {
  const out: FieldFilters = {};
  Object.entries(f).forEach(([k, v]) => {
    const t = v?.trim();
    if (t) out[k] = t;
  });
  return out;
}

/**
 * Splits the per-column filters into what the API understands (merged into `filters`, using the
 * names in reports.config.ts) and what must be applied in the browser (`client`).
 */
export function buildRequest(
  module: ReportModule,
  baseFilters: ReportFilters,
  fieldFilters: FieldFilters,
): { filters: ReportFilters; client: FieldFilters } {
  const filters: ReportFilters = { ...cleanFilters(baseFilters) };
  const client: FieldFilters = {};
  const ff = cleanFieldFilters(fieldFilters);

  const num = (v: string): string | number => (v !== '' && !Number.isNaN(Number(v)) ? Number(v) : v);

  for (const c of REPORTS[module].columns) {
    const eq = ff[c.key];
    const lo = ff[c.key + MIN];
    const hi = ff[c.key + MAX];
    const s = c.server;

    if (eq) {
      if (s?.eq) filters[s.eq] = c.type === 'boolean' ? eq === 'true' : s.numeric ? num(eq) : eq;
      else client[c.key] = eq;
    }
    if (lo) {
      if (s?.min) filters[s.min] = c.type === 'number' ? num(lo) : lo;
      else client[c.key + MIN] = lo;
    }
    if (hi) {
      if (s?.max) filters[s.max] = c.type === 'number' ? num(hi) : hi;
      else client[c.key + MAX] = hi;
    }
  }
  return { filters, client };
}

const truthy = (v: unknown) => v === true || v === 1 || /^(true|1|yes|y|active)$/i.test(String(v));

/** Applies per-column filters in the browser. A row must pass every active filter. */
export function matchesFieldFilters(row: Row, filters: FieldFilters, columns: ColumnDef[]): boolean {
  for (const c of columns) {
    const v = getByPath(row, c.key);
    const eq = filters[c.key];
    const lo = filters[c.key + MIN];
    const hi = filters[c.key + MAX];

    if (c.type === 'text' && eq) {
      if (!String(v ?? '').toLowerCase().includes(eq.toLowerCase())) return false;
    } else if (c.type === 'boolean' && eq) {
      if (truthy(v) !== (eq === 'true')) return false;
    } else if (c.type === 'number' && (lo || hi)) {
      const n = v === null || v === undefined || v === '' ? NaN : Number(v);
      if (Number.isNaN(n)) return false;
      if (lo && n < Number(lo)) return false;
      if (hi && n > Number(hi)) return false;
    } else if (c.type === 'date' && (lo || hi)) {
      const t = new Date(String(v)).getTime();
      if (Number.isNaN(t)) return false;
      if (lo && t < new Date(`${lo}T00:00:00`).getTime()) return false;
      if (hi && t > new Date(`${hi}T23:59:59.999`).getTime()) return false;
    }
  }
  return true;
}

// ---- Date presets ----------------------------------------------------------
export const isoLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function rangeFromMonths(months: number): { start_date: string; end_date: string } {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - months);
  return { start_date: isoLocal(start), end_date: isoLocal(end) };
}

// ---- Human-readable summary (used in History) --------------------------------
export function describeFilters(
  module: ReportModule,
  filters: ReportFilters,
  fieldFilters: FieldFilters,
): string[] {
  const out: string[] = [];
  const d = (s?: string) =>
    s ? new Date(`${s}T00:00:00`).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '…';

  const start = fstr(filters.start_date);
  const end = fstr(filters.end_date);
  if (start || end) out.push(`${d(start)} → ${d(end)}`);
  if (fstr(filters.status)) out.push(`Status: ${fstr(filters.status)}`);
  if (fstr(filters.search)) out.push(`Search: “${fstr(filters.search)}”`);

  for (const c of REPORTS[module].columns) {
    const eq = fieldFilters[c.key];
    const lo = fieldFilters[c.key + MIN];
    const hi = fieldFilters[c.key + MAX];
    if (c.type === 'text' && eq) out.push(`${c.label} ${c.server?.exact ? '=' : 'contains'} “${eq}”`);
    if (c.type === 'boolean' && eq) out.push(`${c.label}: ${eq === 'true' ? 'Yes' : 'No'}`);
    if (c.type === 'number' && (lo || hi))
      out.push(`${c.label} ${lo && hi ? `${lo}–${hi}` : lo ? `≥ ${lo}` : `≤ ${hi}`}`);
    if (c.type === 'date' && (lo || hi)) out.push(`${c.label} ${d(lo)} → ${d(hi)}`);
  }
  return out;
}

// ---- Generate a report file (used by the builder and by History re-runs) ------
export interface RunOptions {
  module: ReportModule;
  columns: string[];
  filters: ReportFilters; // base filters: date range, status, search
  fieldFilters: FieldFilters; // per-column filters
  format: ExportFormat;
  onProgress?: (done: number, total: number | null) => void;
}

/** Downloads the file. Returns how many records it contains (null if unknown). */
export async function runReport(opts: RunOptions): Promise<number | null> {
  const config = REPORTS[opts.module];
  const columnDefs = config.columns.filter((c) => opts.columns.includes(c.key));
  const { filters, client } = buildRequest(opts.module, opts.filters, opts.fieldFilters);
  const req = { module: opts.module, columns: columnDefs.map((c) => c.key), filters };

  const rowFilter = Object.keys(client).length
    ? (row: Row) => matchesFieldFilters(row, client, config.columns)
    : undefined;

  if (opts.format === 'pdf') {
    return exportAllAsPdf(req, columnDefs, config.label, formatCell, opts.onProgress, rowFilter);
  }
  // Excel: use the server's file when it is known to contain every record and nothing is left to
  // filter in the browser. Otherwise build the file from /preview.
  if (!config.paginated || (config.serverExportsAll && !rowFilter)) {
    await exportReport(config.exportRoute, req);
    return null;
  }
  return exportAllAsExcel(req, columnDefs, config.label, opts.onProgress, rowFilter);
}