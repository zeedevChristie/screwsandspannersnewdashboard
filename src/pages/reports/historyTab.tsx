import { useEffect, useState } from 'react';
import { REPORTS, REPORT_ORDER, type ReportModule } from './reports.config';
import {
  HISTORY_BACKEND,
  historyStore,
  localHistoryStore,
  migrateLocalHistory,
  type HistoryEntry,
} from './Reports.History';
import { describeFilters, errorMessage, runReport } from './Reports.utils';
import { btnSm, btnSmPrimary, input, linkBtn } from './Reports.Ui';

interface Props {
  entries: HistoryEntry[];
  onChanged: () => void | Promise<void>;
  onCopy: (entry: HistoryEntry) => void;
  loadError?: string | null;
}

export default function HistoryTab({ entries, onChanged, onCopy, loadError }: Props) {
  const [moduleFilter, setModuleFilter] = useState<ReportModule | ''>('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reports saved in this browser before history moved to the server
  const [localCount, setLocalCount] = useState(0);
  const [migrating, setMigrating] = useState(false);
  useEffect(() => {
    if (HISTORY_BACKEND === 'server') void localHistoryStore.list().then((l) => setLocalCount(l.length));
  }, []);

  async function moveLocal() {
    setMigrating(true);
    setError(null);
    try {
      await migrateLocalHistory();
      setLocalCount(0);
      await onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setMigrating(false);
    }
  }

  const shown = moduleFilter ? entries.filter((e) => e.module === moduleFilter) : entries;

  async function rerun(e: HistoryEntry) {
    setBusyId(e.id);
    setError(null);
    try {
      const count = await runReport({
        ...e,
        onProgress: (done, total) =>
          setProgress(`Fetching ${done.toLocaleString()}${total ? ` of ${total.toLocaleString()}` : ''}…`),
      });
      await historyStore.touch(e.id, count);
      await onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
      setProgress(null);
    }
  }

  async function remove(e: HistoryEntry) {
    if (!window.confirm('Delete this report from history?')) return;
    await historyStore.remove(e.id);
    await onChanged();
  }

  async function clearAll() {
    if (!window.confirm('Delete ALL saved reports from history? This cannot be undone.')) return;
    await historyStore.clear();
    await onChanged();
  }

  return (
    <section aria-label="Report history">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            Every report you export is saved here. Re-run it to download a fresh file from today’s data,
            or copy it to change the filters first.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {HISTORY_BACKEND === 'server'
              ? 'History is saved to your admin account and follows you across devices.'
              : 'History is saved in this browser only.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            aria-label="Filter history by report"
            className={input}
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value as ReportModule | '')}
          >
            <option value="">All reports</option>
            {REPORT_ORDER.map((m) => (
              <option key={m} value={m}>
                {REPORTS[m].label}
              </option>
            ))}
          </select>
          {entries.length > 0 && (
            <button type="button" className={linkBtn} onClick={clearAll}>
              Clear history
            </button>
          )}
        </div>
      </div>

      {loadError && (
        <p className="mb-3 text-sm text-red-700" role="alert">
          Could not load history. {loadError}
        </p>
      )}
      {localCount > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <span>
            {localCount} report{localCount === 1 ? ' was' : 's were'} saved in this browser before history moved to
            your account.
          </span>
          <button type="button" className={btnSm} disabled={migrating} onClick={moveLocal}>
            {migrating ? 'Moving…' : 'Move to my account'}
          </button>
        </div>
      )}

      {error && (
        <p className="mb-3 text-sm text-red-700" role="alert">
          Could not generate the report. {error}
        </p>
      )}

      {shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center text-slate-500">
          {entries.length === 0
            ? 'No reports yet. Export a report as Excel or PDF and it will be saved here.'
            : 'No saved reports for this module.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Report', 'Filters', 'Records', 'Last run', ''].map((h, i) => (
                  <th key={i} scope="col" className="whitespace-nowrap border-b border-slate-200 px-3.5 py-2.5 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((e) => {
                const chips = describeFilters(e.module, e.filters, e.fieldFilters);
                const busy = busyId === e.id;
                return (
                  <tr key={e.id} className="align-top hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-3.5 py-3">
                      <div className="font-medium">{REPORTS[e.module].label}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {e.format === 'excel' ? 'Excel' : 'PDF'} · {e.columns.length} column
                        {e.columns.length === 1 ? '' : 's'}
                        {e.copiedFrom ? ' · copy' : ''}
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-3.5 py-3">
                      {chips.length === 0 ? (
                        <span className="text-slate-400">No filters</span>
                      ) : (
                        <ul className="space-y-0.5">
                          {chips.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="whitespace-nowrap border-b border-slate-100 px-3.5 py-3">
                      {e.recordCount === null ? '—' : e.recordCount.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap border-b border-slate-100 px-3.5 py-3">
                      <div>
                        {new Date(e.lastRunAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Run {e.runs} time{e.runs === 1 ? '' : 's'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap border-b border-slate-100 px-3.5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className={btnSmPrimary}
                          disabled={busyId !== null}
                          onClick={() => rerun(e)}
                        >
                          {busy ? (progress ?? 'Preparing…') : `Re-run ${e.format === 'excel' ? 'Excel' : 'PDF'}`}
                        </button>
                        <button type="button" className={btnSm} disabled={busyId !== null} onClick={() => onCopy(e)}>
                          Copy &amp; edit
                        </button>
                        <button type="button" className={linkBtn} disabled={busyId !== null} onClick={() => remove(e)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}