import type { ReportModule } from './reports.config';

// ---- Setup -----------------------------------------------------------------
// Vite: set VITE_API_BASE_URL in .env (e.g. http://localhost:3009/api/v1).
// Next.js / CRA: replace with process.env.NEXT_PUBLIC_... / REACT_APP_...
const API_BASE: string =
  import.meta.env.VITE_API_BASE_URL ?? 'https://meemaw.sands.com.ng/api/v1';

// Same behaviour as the version that worked: 'adminToken' first, then common login-token names.
const TOKEN_KEYS = ['adminToken', 'accessToken', 'access_token', 'authToken', 'auth_token', 'token', 'jwt'];

function getToken(): string | null {
  for (const store of [localStorage, sessionStorage]) {
    for (const key of TOKEN_KEYS) {
      const raw = store.getItem(key);
      if (raw) {
        if (import.meta.env.DEV) console.debug(`[reports] using token from "${key}"`);
        return raw.replace(/^"|"$/g, '').replace(/^Bearer\s+/i, '');
      }
    }
  }
  return null;
}

// ---- Types -----------------------------------------------------------------
// Filters sent to the API: start_date, end_date, status, search, plus per-report ones
// (type, active, promo_type, min_amount, expiry_from, search_key_words ...).
export type ReportFilters = Record<string, string | number | boolean>;

export interface ReportRequest {
  module: ReportModule;
  columns: string[];
  filters: ReportFilters;
  page?: number; // paginated modules only
  limit?: number; // 1-100
}

export type Row = Record<string, unknown>;

export interface PreviewResult {
  raw: unknown; // untouched server response (shown in the UI when nothing matches)
  rows: Row[]; // list modules
  total: number | null; // total matching records, if the API reports it
  stats: Row | null; // statistics module
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ---- Internals -------------------------------------------------------------
async function send(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<Response> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw await toApiError(res);
  return res;
}

const post = (path: string, body: unknown, signal?: AbortSignal) => send('POST', path, body, signal);

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export async function apiJson(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown): Promise<any> {
  const res = await send(method, path, body);
  return res.status === 204 ? null : res.json();
}

async function toApiError(res: Response): Promise<ApiError> {
  const fallback: Record<number, string> = {
    400: 'The report request was invalid. Check the selected columns and filters.',
    401: 'Your session has expired. Sign in again to continue.',
    403: 'Your account does not have permission to view reports.',
  };
  let detail = '';
  try {
    const json = await res.json();
    const m = json?.message;
    detail = Array.isArray(m) ? m.join(', ') : typeof m === 'string' ? m : '';
  } catch {
    /* body was not JSON */
  }
  const message =
    res.status >= 500
      ? 'The server could not build this report. Try again in a moment.'
      : detail || fallback[res.status] || `Request failed (${res.status}).`;
  return new ApiError(res.status, message);
}

function filenameFromHeader(header: string | null): string | null {
  if (!header) return null;
  const star = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (star) return decodeURIComponent(star[1]);
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : null;
}

/** Reads "a.b" from nested objects, or a literal "a.b" key if the API flattens them. */
export function getByPath(obj: unknown, path: string): unknown {
  if (obj == null || typeof obj !== 'object') return undefined;
  if (path in (obj as Row)) return (obj as Row)[path];
  return path
    .split('.')
    .reduce<unknown>((acc, k) => (acc && typeof acc === 'object' ? (acc as Row)[k] : undefined), obj);
}

/** Searches the whole response for the object that actually holds the statistics fields. */
function findStatsObject(root: unknown, columns: string[]): Row | null {
  const queue: unknown[] = [root];
  for (let seen = 0; queue.length && seen < 300; seen++) {
    const node = queue.shift();
    if (Array.isArray(node)) {
      queue.push(...node);
    } else if (node && typeof node === 'object') {
      if (columns.some((c) => getByPath(node, c) !== undefined)) return node as Row;
      queue.push(...Object.values(node));
    }
  }
  return null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
// The spec doesn't document the preview response shape, so this accepts the
// common ones: [..], { data: [..] }, { data: { rows|items|data|results, total } }.
// Once you've seen a real response, tighten this to match.
function normalizePreview(json: any, module: ReportModule, columns: string[]): PreviewResult {
  const payload = json?.data ?? json;

  if (module === 'statistics') {
    // Backend shape: { data: [{ column: 'totalRegistrations', value: 1575 }, ...] }
    if (Array.isArray(payload) && payload.every((i: any) => i && typeof i === 'object' && 'column' in i)) {
      const stats: Row = {};
      for (const item of payload) stats[String(item.column)] = item.value;
      return { raw: json, rows: [], total: null, stats };
    }
    // Fallback: look for an object that holds the fields anywhere in the response
    return { raw: json, rows: [], total: null, stats: findStatsObject(json, columns) };
  }

  const listKeys = ['rows', 'items', 'data', 'results', 'records'];
  const pick = (p: any): Row[] | null => {
    if (Array.isArray(p)) return p;
    if (p && typeof p === 'object') {
      for (const k of listKeys) if (Array.isArray(p[k])) return p[k];
    }
    return null;
  };
  const rows = pick(payload) ?? pick(json) ?? [];

  const totalCandidates = [
    payload?.total,
    payload?.totalItems,
    payload?.count,
    payload?.meta?.total,
    payload?.pagination?.total,
    json?.total,
    json?.meta?.total,
    json?.pagination?.total,
  ];
  const total = totalCandidates.find((t) => typeof t === 'number');

  return { raw: json, rows, total: typeof total === 'number' ? total : null, stats: null };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---- Public API ------------------------------------------------------------
export async function previewReport(
  req: ReportRequest,
  signal?: AbortSignal,
): Promise<PreviewResult> {
  const res = await post('/admin/reports/preview', req, signal);
  const json = await res.json();
  if (import.meta.env.DEV) console.debug('[reports] preview response', json);
  return normalizePreview(json, req.module, req.columns);
}

/** Downloads the Excel file. Export sends module + columns + filters (no paging). */
export async function exportReport(
  exportRoute: string,
  req: Omit<ReportRequest, 'page' | 'limit'>,
): Promise<void> {
  const res = await post(`/admin/reports/export/${exportRoute}`, req);
  const blob = await res.blob();

  // Note: browsers only expose Content-Disposition cross-origin if the backend
  // sends Access-Control-Expose-Headers: Content-Disposition. Otherwise we fall back.
  const filename =
    filenameFromHeader(res.headers.get('Content-Disposition')) ??
    `${req.module}-report-${new Date().toISOString().slice(0, 10)}.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---- Export everything (all pages) from the dashboard ------------------------
// For reports whose server Excel file only holds one page (serverExportsAll is false in
// reports.config.ts) the file is built here by paging through /preview, 100 rows at a time.
// Needs: npm install xlsx jspdf jspdf-autotable

type ExportReq = Omit<ReportRequest, 'page' | 'limit'>;
type ColumnDefLite = { key: string; label: string };
type Progress = (done: number, total: number | null) => void;
export type RowFilter = (row: Row) => boolean;

const toCell = (v: unknown) =>
  v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : v;
const today = () => new Date().toISOString().slice(0, 10);

/** Pages through /preview (100 rows at a time, the API maximum) and returns every row. */
export async function fetchAllRows(
  req: ExportReq,
  onProgress?: Progress,
  signal?: AbortSignal,
): Promise<Row[]> {
  const PAGE_SIZE = 100;
  const MAX_PAGES = 500; // safety stop: 50,000 rows
  const all: Row[] = [];
  let total: number | null = null;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const r = await previewReport({ ...req, page, limit: PAGE_SIZE }, signal);
    all.push(...r.rows);
    if (r.total !== null) total = r.total;
    onProgress?.(all.length, total);
    if (r.rows.length < PAGE_SIZE || (total !== null && all.length >= total)) break;
  }
  return all;
}

export async function exportAllAsExcel(
  req: ExportReq,
  columnDefs: ColumnDefLite[],
  sheetName: string,
  onProgress?: Progress,
  rowFilter?: RowFilter,
): Promise<number> {
  const fetched = await fetchAllRows(req, onProgress);
  const all = rowFilter ? fetched.filter(rowFilter) : fetched;
  const XLSX = await import('xlsx');
  const headers = columnDefs.map((c) => c.label);
  const data = all.map((row) =>
    Object.fromEntries(columnDefs.map((c) => [c.label, toCell(getByPath(row, c.key))])),
  );
  const ws = XLSX.utils.json_to_sheet(data, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, `${req.module}-report-${today()}.xlsx`);
  return all.length;
}

/** Builds a PDF of the whole report (all pages). `format` renders each cell like the on-screen table. */
export async function exportAllAsPdf(
  req: ExportReq,
  columnDefs: ColumnDefLite[],
  title: string,
  format: (key: string, value: unknown) => string,
  onProgress?: Progress,
  rowFilter?: RowFilter,
): Promise<number | null> {
  let head: string[][];
  let body: string[][];

  if (req.module === 'statistics') {
    const { stats } = await previewReport(req);
    head = [['Metric', 'Value']];
    body = columnDefs.map((c) => {
      const v = getByPath(stats, c.key);
      return [c.label, typeof v === 'number' ? v.toLocaleString() : format(c.key, v)];
    });
  } else {
    const fetched = await fetchAllRows(req, onProgress);
    const all = rowFilter ? fetched.filter(rowFilter) : fetched;
    head = [columnDefs.map((c) => c.label)];
    body = all.map((row) => columnDefs.map((c) => format(c.key, getByPath(row, c.key))));
  }

  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: columnDefs.length > 5 ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });

  doc.setFontSize(16);
  doc.text(`${title} report`, 40, 40);
  doc.setFontSize(9);
  doc.setTextColor(100);
  const count = req.module === 'statistics' ? '' : ` · ${body.length.toLocaleString()} records`;
  doc.text(`Generated ${new Date().toLocaleString()}${count}`, 40, 56);

  autoTable(doc, {
    head,
    body,
    startY: 70,
    margin: { left: 40, right: 40 },
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [15, 23, 42] },
  });

  const pages = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  for (let n = 1; n <= pages; n++) {
    doc.setPage(n);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Page ${n} of ${pages}`, w - 40, h - 20, { align: 'right' });
  }
  doc.save(`${req.module}-report-${today()}.pdf`);
  return req.module === 'statistics' ? null : body.length;
}