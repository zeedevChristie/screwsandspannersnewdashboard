import { ReactNode } from "react";

/* =========================================================
   SHARED PIECES FOR THE DASHBOARD CHARTS
========================================================= */

interface ChartCardProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  accent: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function ChartCard({
  title,
  subtitle,
  icon,
  accent,
  actions,
  children,
}: Readonly<ChartCardProps>) {
  return (
    <section className="min-w-0 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-lg sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: `color-mix(in srgb, ${accent} 14%, white)`,
              color: accent,
            }}
          >
            {icon}
          </div>

          <div className="min-w-0">
            <h3 className="text-lg font-bold leading-tight text-slate-900">{title}</h3>

            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>

        {actions}
      </div>

      {children}
    </section>
  );
}

/* Two or three choices side by side, like "7 days | 30 days" */
interface SegmentedProps<T extends string | number> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: Readonly<SegmentedProps<T>>) {
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            option.value === value
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* Grey placeholder shown while the numbers load */
export function ChartSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-44 rounded-xl bg-slate-100" />

      <div className="h-60 rounded-2xl bg-slate-100 sm:h-72" />
    </div>
  );
}

/* Friendly message for "no data yet" and "something went wrong" */
interface ChartMessageProps {
  emoji: string;
  title: string;
  text: string;
  onRetry?: () => void;
}

export function ChartMessage({ emoji, title, text, onRetry }: Readonly<ChartMessageProps>) {
  return (
    <div className="flex h-60 flex-col items-center justify-center rounded-2xl bg-slate-50 px-6 text-center sm:h-72">
      <div className="mb-2 text-3xl">{emoji}</div>

      <p className="font-semibold text-slate-700">{title}</p>

      <p className="mt-1 max-w-xs text-sm text-slate-500">{text}</p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Try again
        </button>
      )}
    </div>
  );
}