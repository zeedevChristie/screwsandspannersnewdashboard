import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  REPORTS,
  REPORT_ORDER,
  type ColumnDef,
  type ExportFormat,
  type FieldFilters,
  type ReportConfig,
  type ReportModule,
} from './reports.config';
import {
  fetchAllRows,
  getByPath,
  previewReport,
  type PreviewResult,
  type ReportFilters,
  type Row,
} from './reports.api';
import {
  MAX,
  MIN,
  buildRequest,
  cleanFieldFilters,
  cleanFilters,
  errorMessage,
  formatCell,
  fstr,
  matchesFieldFilters,
  rangeFromMonths,
  runReport,
} from './Reports.utils';
import { historyStore, type HistoryEntry, type NewHistoryEntry } from './Reports.History';
import HistoryTab from './historyTab';
import { btn, btnPrimary, focus, input, linkBtn } from './Reports.Ui';

const PAGE_SIZES = [10, 25, 50, 100];
const allKeys = (c: ReportConfig) => c.columns.map((col) => col.key);
const stable = (o: object) => JSON.stringify(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));

interface Applied {
  columns: string[];
  filters: ReportFilters; // base filters: date range, status, search
  fieldFilters: FieldFilters; // per-column filters
}
interface PreviewState {
  status: 'loading' | 'ready' | 'error';
  result: PreviewResult | null;
  error: string | null;
}

// ---- Page: tabs + module dropdown ---------------------------------------------
type Tab = 'build' | 'history';

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('build');
  const [module, setModule] = useState<ReportModule | ''>('');
  const [seed, setSeed] = useState<HistoryEntry | null>(null); // history entry being copied
  const [viewKey, setViewKey] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const refreshHistory = useCallback(async () => {
    try {
      setHistory(await historyStore.list());
      setHistoryError(null);
    } catch (e) {
      setHistoryError(errorMessage(e));
    }
  }, []);
  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  async function saveToHistory(entry: NewHistoryEntry) {
    await historyStore.record(entry);
    await refreshHistory();
  }

  function copyAndEdit(entry: HistoryEntry) {
    setSeed(entry);
    setModule(entry.module);
    setViewKey((k) => k + 1);
    setTab('build');
  }

  const tabClass = (active: boolean) =>
    `-mb-px whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm ${focus} ${
      active
        ? 'border-slate-900 font-semibold text-slate-900'
        : 'border-transparent text-slate-500 hover:text-slate-900'
    }`;

  return (
    <div className="pb-8">
      <div role="tablist" aria-label="Reports sections" className="mb-5 flex gap-1 border-b border-slate-200">
        <button role="tab" type="button" aria-selected={tab === 'build'} className={tabClass(tab === 'build')} onClick={() => setTab('build')}>
          Build report
        </button>
        <button role="tab" type="button" aria-selected={tab === 'history'} className={tabClass(tab === 'history')} onClick={() => setTab('history')}>
          History{history.length > 0 ? ` (${history.length})` : ''}
        </button>
      </div>

      {tab === 'history' ? (
        <HistoryTab entries={history} onChanged={refreshHistory} onCopy={copyAndEdit} loadError={historyError} />
      ) : (
        <>
          <div className="mb-6">
            <label htmlFor="report-module" className="mb-2 block text-lg font-semibold text-slate-900">
              Modules
            </label>
            <select
              id="report-module"
              className={`${input} w-full max-w-xs`}
              value={module}
              onChange={(e) => {
                setSeed(null);
                setModule(e.target.value as ReportModule | '');
              }}
            >
              <option value="">Select Module</option>
              {REPORT_ORDER.map((m) => (
                <option key={m} value={m}>
                  {REPORTS[m].label}
                </option>
              ))}
            </select>
          </div>

          {module ? (
            // key: switching modules (or copying a history entry) resets columns, filters and paging
            <ReportView
              key={`${module}-${viewKey}`}
              module={module}
              initial={seed}
              onGenerated={saveToHistory}
              onDiscardSeed={() => {
                setSeed(null);
                setViewKey((k) => k + 1);
              }}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center text-slate-500">
              Select a module to build a report, or open History to re-run a previous one.
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---- The report builder --------------------------------------------------------
export function ReportView({
  module,
  initial = null,
  onGenerated,
  onDiscardSeed,
}: {
  module: ReportModule;
  initial?: HistoryEntry | null;
  onGenerated?: (entry: NewHistoryEntry) => void | Promise<void>;
  onDiscardSeed?: () => void;
}) {
  const config = REPORTS[module];
  const seed = initial && initial.module === module ? initial : null;
  const seedColumns = seed ? allKeys(config).filter((k) => seed.columns.includes(k)) : allKeys(config);

  // Draft = what the admin is editing. Applied = what preview/export actually use.
  const [draftColumns, setDraftColumns] = useState<string[]>(seedColumns);
  const [draftFilters, setDraftFilters] = useState<ReportFilters>(seed ? { ...seed.filters } : {});
  const [draftFields, setDraftFields] = useState<FieldFilters>(seed ? { ...seed.fieldFilters } : {});
  const [applied, setApplied] = useState<Applied>({
    columns: seedColumns,
    filters: seed ? { ...seed.filters } : {},
    fieldFilters: seed ? { ...seed.fieldFilters } : {},
  });
  const [fieldsOpen] = useState(() => !!seed && Object.keys(seed.fieldFilters).length > 0);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [preview, setPreview] = useState<PreviewState>({ status: 'loading', result: null, error: null });
  const [clientRows, setClientRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [exportProgress, setExportProgress] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState(false);
  const [copySaved, setCopySaved] = useState(false); // after the copy is saved, later exports update it
  const [formError, setFormError] = useState<string | null>(null);

  // Per-column filters the API understands are sent with the request (reqFilters). Any that it
  // doesn't (clientFilters) are applied in the browser after loading every matching record.
  const { filters: reqFilters, client: clientFilters } = useMemo(
    () => buildRequest(module, applied.filters, applied.fieldFilters),
    [module, applied.filters, applied.fieldFilters],
  );
  const clientMode = config.paginated && Object.keys(clientFilters).length > 0;
  const clientLabels = [...new Set(Object.keys(clientFilters).map((k) => k.replace(/__(min|max)$/, '')))].map(
    (k) => config.columns.find((c) => c.key === k)?.label ?? k,
  );

  const visibleColumns = useMemo(
    () => config.columns.filter((c) => applied.columns.includes(c.key)),
    [config, applied.columns],
  );

  const dirty =
    stable({ c: [...draftColumns].sort(), f: cleanFilters(draftFilters), x: cleanFieldFilters(draftFields) }) !==
    stable({ c: [...applied.columns].sort(), f: applied.filters, x: applied.fieldFilters });

  // Server-side paging
  useEffect(() => {
    if (clientMode) return;
    const ctrl = new AbortController();
    setPreview((p) => ({ ...p, status: 'loading', error: null }));

    previewReport(
      {
        module,
        columns: applied.columns,
        filters: reqFilters,
        ...(config.paginated ? { page, limit } : {}),
      },
      ctrl.signal,
    )
      .then((result) => setPreview({ status: 'ready', result, error: null }))
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        // TODO: on err.status === 401, redirect to your login route here.
        setPreview({ status: 'error', result: null, error: errorMessage(err) });
      });

    return () => ctrl.abort();
  }, [module, applied, reqFilters, page, limit, config.paginated, clientMode]);

  // Browser-side filtering: load everything once, then filter and paginate locally
  useEffect(() => {
    if (!clientMode) {
      setClientRows(null);
      return;
    }
    const ctrl = new AbortController();
    setPreview((p) => ({ ...p, status: 'loading', error: null }));

    fetchAllRows({ module, columns: applied.columns, filters: reqFilters }, undefined, ctrl.signal)
      .then((all) => {
        const filtered = all.filter((r) => matchesFieldFilters(r, clientFilters, config.columns));
        setClientRows(filtered);
        setPreview({
          status: 'ready',
          result: { raw: null, rows: [], total: filtered.length, stats: null },
          error: null,
        });
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        setPreview({ status: 'error', result: null, error: errorMessage(err) });
      });

    return () => ctrl.abort();
  }, [module, applied, reqFilters, clientFilters, clientMode, config.columns]);

  function toggleColumn(key: string) {
    setDraftColumns((cols) => (cols.includes(key) ? cols.filter((c) => c !== key) : [...cols, key]));
  }
  function setFilter(key: string, value: string) {
    setDraftFilters((f) => ({ ...f, [key]: value }));
  }
  function setField(key: string, value: string) {
    setDraftFields((f) => ({ ...f, [key]: value }));
  }

  function applyChanges() {
    if (draftColumns.length === 0) {
      setFormError('Select at least one column.');
      return;
    }
    const start = fstr(draftFilters.start_date);
    const end = fstr(draftFilters.end_date);
    if (start && end && start > end) {
      setFormError('The start date must be on or before the end date.');
      return;
    }
    setFormError(null);
    setSavedNote(false);
    setApplied({
      columns: allKeys(config).filter((k) => draftColumns.includes(k)),
      filters: cleanFilters(draftFilters),
      fieldFilters: cleanFieldFilters(draftFields),
    });
    setPage(1);
  }

  function resetAll() {
    setDraftColumns(allKeys(config));
    setDraftFilters({});
    setDraftFields({});
    setApplied({ columns: allKeys(config), filters: {}, fieldFilters: {} });
    setPage(1);
    setFormError(null);
  }

  const rows = clientMode
    ? (clientRows ?? []).slice((page - 1) * limit, page * limit)
    : (preview.result?.rows ?? []);
  const total = clientMode ? (clientRows?.length ?? null) : (preview.result?.total ?? null);

  async function generate(format: ExportFormat) {
    setBusy(format);
    setExportError(null);
    setHistoryError(null);
    setSavedNote(false);
    try {
      const count = await runReport({
        module,
        columns: applied.columns,
        filters: applied.filters,
        fieldFilters: applied.fieldFilters,
        format,
        onProgress: (done, t) =>
          setExportProgress(`Fetching ${done.toLocaleString()}${t ? ` of ${t.toLocaleString()}` : ''}…`),
      });
      if (onGenerated) {
        try {
          await onGenerated({
            module,
            columns: applied.columns,
            filters: applied.filters,
            fieldFilters: applied.fieldFilters,
            format,
            recordCount: count ?? total,
            copiedFrom: seed && !copySaved ? seed.id : undefined,
          });
          setSavedNote(true);
          if (seed) setCopySaved(true);
        } catch (e) {
          setHistoryError(errorMessage(e)); // the file already downloaded; only saving failed
        }
      }
    } catch (e) {
      setExportError(errorMessage(e));
    } finally {
      setBusy(null);
      setExportProgress(null);
    }
  }

  const totalPages = total !== null ? Math.max(1, Math.ceil(total / limit)) : null;
  const hasNext = totalPages !== null ? page < totalPages : rows.length === limit;
  const activeFieldCount = new Set(
    Object.keys(cleanFieldFilters(draftFields)).map((k) => k.replace(/__(min|max)$/, '')),
  ).size;

  return (
    <div className="text-slate-900">
      {seed && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <span>
            You’re editing a <strong>copy</strong> of a saved report. Change anything, then export it to save it as
            a new history entry. The original stays as it was.
          </span>
          <button type="button" className={linkBtn} onClick={onDiscardSeed}>
            Start from scratch
          </button>
        </div>
      )}

      <p className="mb-4 text-sm text-slate-500">{config.description}</p>

      {/* Columns + filters */}
      <section aria-label="Report options" className="mb-5 rounded-xl border border-slate-200 bg-white p-4 sm:px-5">
        <fieldset className="mb-4 min-w-0">
          <legend className="mb-2 text-sm font-semibold">Columns</legend>
          <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {config.columns.map((c) => (
              <label key={c.key} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className={`h-4 w-4 rounded border-slate-300 accent-slate-900 ${focus}`}
                  checked={draftColumns.includes(c.key)}
                  onChange={() => toggleColumn(c.key)}
                />
                {c.label}
              </label>
            ))}
          </div>
          <div className="mt-2 flex gap-4">
            <button type="button" className={linkBtn} onClick={() => setDraftColumns(allKeys(config))}>
              Select all
            </button>
            <button type="button" className={linkBtn} onClick={() => setDraftColumns([])}>
              Clear
            </button>
          </div>
        </fieldset>

        {config.filters.length > 0 && (
          <fieldset className="mb-4 min-w-0">
            <legend className="mb-2 text-sm font-semibold">Filters</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-3">
              {config.filters.includes('dateRange') && (
                <>
                  <label className="flex flex-col gap-1 text-sm text-slate-500">
                    From
                    <input
                      type="date"
                      className={input}
                      value={fstr(draftFilters.start_date)}
                      onChange={(e) => setFilter('start_date', e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-slate-500">
                    To
                    <input
                      type="date"
                      className={input}
                      value={fstr(draftFilters.end_date)}
                      onChange={(e) => setFilter('end_date', e.target.value)}
                    />
                  </label>
                </>
              )}
              {config.filters.includes('status') && (
                <label className="flex flex-col gap-1 text-sm text-slate-500">
                  Status
                  <select
                    className={input}
                    value={fstr(draftFilters.status)}
                    onChange={(e) => setFilter('status', e.target.value)}
                  >
                    <option value="">All</option>
                    {config.statusOptions?.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {config.filters.includes('search') && (
                <label className="flex min-w-[240px] flex-1 flex-col gap-1 text-sm text-slate-500">
                  Search
                  <input
                    type="search"
                    className={input}
                    placeholder="Name, email or phone"
                    value={fstr(draftFilters.search)}
                    onChange={(e) => setFilter('search', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyChanges()}
                  />
                </label>
              )}
            </div>
            {config.filters.includes('dateRange') && (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                <span>Quick range:</span>
                {[1, 3, 6, 12].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={linkBtn}
                    onClick={() => setDraftFilters((f) => ({ ...f, ...rangeFromMonths(m) }))}
                  >
                    {m === 12 ? 'Last year' : `Last ${m === 1 ? 'month' : `${m} months`}`}
                  </button>
                ))}
              </div>
            )}
          </fieldset>
        )}

        {config.columns.some((c) => c.type) && (
          <details className="mb-4" open={fieldsOpen}>
            <summary className={`cursor-pointer text-sm font-semibold ${focus}`}>
              Filter by field{activeFieldCount > 0 ? ` (${activeFieldCount} active)` : ''}
            </summary>
            <div className="mt-3">
              <FieldFilterGrid config={config} values={draftFields} onChange={setField} />
              {activeFieldCount > 0 && (
                <button type="button" className={`${linkBtn} mt-3`} onClick={() => setDraftFields({})}>
                  Clear field filters
                </button>
              )}
            </div>
          </details>
        )}

        {formError && (
          <p className="mb-3 text-sm text-red-700" role="alert">
            {formError}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={btnPrimary} onClick={applyChanges}>
            Apply{dirty ? ' changes' : ''}
          </button>
          <button type="button" className={btn} onClick={resetAll}>
            Reset
          </button>
          {dirty && <span className="text-sm text-slate-500">You have changes that aren’t applied yet.</span>}
        </div>
      </section>

      {/* Results */}
      <section aria-label="Report preview" aria-busy={preview.status === 'loading'}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-slate-500">
            {preview.status === 'ready' && config.paginated && total !== null
              ? `${total.toLocaleString()} record${total === 1 ? '' : 's'}`
              : preview.status === 'loading'
                ? 'Loading…'
                : ''}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className={btn}
              onClick={() => generate('pdf')}
              disabled={preview.status !== 'ready' || busy !== null}
            >
              {busy === 'pdf' ? (exportProgress ?? 'Building PDF…') : 'Download PDF'}
            </button>
            <button
              type="button"
              className={btnPrimary}
              onClick={() => generate('excel')}
              disabled={preview.status === 'error' || busy !== null}
            >
              {busy === 'excel' ? (exportProgress ?? 'Preparing file…') : 'Export to Excel'}
            </button>
          </div>
        </div>

        {clientMode && (
          <p className="mb-3 text-xs text-slate-500">
            Filtering by {clientLabels.join(', ')} runs in your browser, so every matching record is loaded first.
            Large reports can take a moment.
          </p>
        )}
        {savedNote && (
          <p className="mb-3 text-sm text-green-700" role="status">
            Saved to History. Open the History tab to run it again later.
          </p>
        )}
        {historyError && (
          <p className="mb-3 text-sm text-amber-800" role="alert">
            The file was downloaded, but it couldn’t be saved to History. {historyError}
          </p>
        )}
        {exportError && (
          <p className="mb-3 text-sm text-red-700" role="alert">
            Export failed. {exportError}
          </p>
        )}

        {preview.status === 'error' && (
          <div className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center text-slate-600" role="alert">
            <p className="mb-3">{preview.error}</p>
            <button type="button" className={btn} onClick={() => setApplied({ ...applied })}>
              Try again
            </button>
          </div>
        )}

        {preview.status === 'loading' && !preview.result && (
          <div className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center text-slate-500">
            Loading report…
          </div>
        )}

        {preview.status !== 'error' && preview.result && (
          <div className={preview.status === 'loading' ? 'opacity-50 transition-opacity' : ''}>
            {module === 'statistics' ? (
              <StatsGrid stats={preview.result.stats} raw={preview.result.raw} columns={visibleColumns} />
            ) : rows.length === 0 ? (
              preview.status === 'ready' && (
                <div className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center text-slate-500">
                  No records match these filters. Widen the date range or clear some filters to see more.
                  {!clientMode && <RawResponse raw={preview.result.raw} />}
                </div>
              )
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {visibleColumns.map((c) => (
                        <th key={c.key} scope="col" className="whitespace-nowrap border-b border-slate-200 px-3.5 py-2.5 font-semibold">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={String(row.id ?? row.code ?? row._id ?? i)} className="hover:bg-slate-50">
                        {visibleColumns.map((c) => (
                          <td key={c.key} className="whitespace-nowrap border-b border-slate-100 px-3.5 py-2.5">
                            {formatCell(c.key, getByPath(row, c.key))}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {config.paginated && preview.status === 'ready' && rows.length > 0 && (
          <nav className="mt-3 flex flex-wrap items-center gap-3 sm:justify-end" aria-label="Pagination">
            <label className="flex items-center gap-2 text-sm text-slate-500">
              Rows per page
              <select
                className={input}
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <span className="text-sm text-slate-500">
              Page {page}
              {totalPages !== null ? ` of ${totalPages}` : ''}
            </span>
            <button type="button" className={btn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button type="button" className={btn} disabled={!hasNext} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}

// ---- Filter by field -----------------------------------------------------------
/** Columns already covered by the report's own date-range / status filters don't repeat here. */
const coveredByServerFilter = (config: ReportConfig, c: ColumnDef) =>
  (config.filters.includes('dateRange') && /^(created_at|createdAt)$/.test(c.key)) ||
  (config.filters.includes('status') && c.key === 'status');

function FieldFilterGrid({
  config,
  values,
  onChange,
}: {
  config: ReportConfig;
  values: FieldFilters;
  onChange: (key: string, value: string) => void;
}) {
  const cols = config.columns.filter((c) => c.type && !coveredByServerFilter(config, c));
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {cols.map((c) => (
        <div key={c.key} className="flex flex-col gap-1 text-sm">
          <span className="text-slate-500">{c.label}</span>
          {c.type === 'text' && (
            <input
              type={c.server?.numeric ? 'number' : 'text'}
              aria-label={c.label}
              className={input}
              placeholder={c.server?.exact ? (c.server.numeric ? 'Exact number' : 'Exact value') : 'Contains…'}
              value={values[c.key] ?? ''}
              onChange={(e) => onChange(c.key, e.target.value)}
            />
          )}
          {c.type === 'boolean' && (
            <select
              aria-label={c.label}
              className={input}
              value={values[c.key] ?? ''}
              onChange={(e) => onChange(c.key, e.target.value)}
            >
              <option value="">Any</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          )}
          {(c.type === 'number' || c.type === 'date') && (
            <div className="flex gap-2">
              <input
                type={c.type}
                aria-label={`${c.label} ${c.type === 'date' ? 'from' : 'minimum'}`}
                className={`${input} min-w-0 flex-1`}
                placeholder="Min"
                value={values[c.key + MIN] ?? ''}
                onChange={(e) => onChange(c.key + MIN, e.target.value)}
              />
              <input
                type={c.type}
                aria-label={`${c.label} ${c.type === 'date' ? 'to' : 'maximum'}`}
                className={`${input} min-w-0 flex-1`}
                placeholder="Max"
                value={values[c.key + MAX] ?? ''}
                onChange={(e) => onChange(c.key + MAX, e.target.value)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---- Statistics view -----------------------------------------------------------
function RawResponse({ raw }: { raw: unknown }) {
  return (
    <details className="mt-4 text-left">
      <summary className="cursor-pointer text-sm text-slate-600">Show raw server response</summary>
      <pre className="mt-2 max-h-72 overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
        {JSON.stringify(raw, null, 2)}
      </pre>
    </details>
  );
}

function StatsGrid({
  stats,
  raw,
  columns,
}: {
  stats: Row | null;
  raw: unknown;
  columns: { key: string; label: string }[];
}) {
  const found = stats !== null && columns.some((c) => getByPath(stats, c.key) !== undefined);
  return (
    <>
      {!found && (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          The server responded, but none of the selected fields were found in it. Check the raw response below
          against the column names in <code>reports.config.ts</code>.
          <RawResponse raw={raw} />
        </div>
      )}
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {columns.map((c) => {
          const v = getByPath(stats, c.key);
          return (
            <div key={c.key} className="rounded-xl border border-slate-200 bg-white p-4">
              <dt className="mb-1.5 text-sm text-slate-500">{c.label}</dt>
              <dd className="text-3xl font-semibold">
                {typeof v === 'number' ? v.toLocaleString() : formatCell(c.key, v)}
              </dd>
            </div>
          );
        })}
      </dl>
    </>
  );
}