import { ReactNode, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { formatNaira, formatNairaCompact } from "@/lib/revenue";
import ChartCard, { ChartMessage, ChartSkeleton, Segmented } from "./chartCard";

interface DailyRevenuePoint {
  amount: number;
  orders: number;
  label: string;
  shortDate: string;
  fullLabel: string;
}

interface RevenueChartProps {
  daily: DailyRevenuePoint[];
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  onViewDetails?: () => void;
}

const COLOR = "#f43f5e";

/* 40000 -> 40k, 1200000 -> 1.2M */
const shortNumber = (value: number): string =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DailyRevenuePoint }>;
}

function RevenueTooltip({ active, payload }: Readonly<TooltipProps>) {
  const point = active ? payload?.[0]?.payload : undefined;

  if (!point) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xl">
      <p className="text-xs font-medium text-slate-500">{point.fullLabel}</p>

      <p className="mt-1 text-lg font-bold text-slate-900">{formatNaira(point.amount)}</p>

      <p className="text-xs text-slate-500">
        {point.orders} {point.orders === 1 ? "subscription" : "subscriptions"}
      </p>
    </div>
  );
}

export default function RevenueChart({
  daily,
  isLoading,
  error,
  onRetry,
  onViewDetails,
}: Readonly<RevenueChartProps>) {
  const navigate = useNavigate();

  const [range, setRange] = useState<7 | 30>(7);

  const { current, total, orders, change } = useMemo(() => {
    const currentPoints = daily.slice(-range);
    const previousPoints = daily.slice(-range * 2, -range);

    const currentTotal = currentPoints.reduce((sum, p) => sum + p.amount, 0);
    const previousTotal = previousPoints.reduce((sum, p) => sum + p.amount, 0);

    return {
      current: currentPoints,
      total: currentTotal,
      orders: currentPoints.reduce((sum, p) => sum + p.orders, 0),
      change: previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : null,
    };
  }, [daily, range]);

  const chartData = current.map((p) => ({
    ...p,
    axisLabel: range === 7 ? p.label : p.shortDate,
  }));

  const actions = (
    <div className="flex flex-wrap items-center gap-3">
      <Segmented<7 | 30>
        options={[
          { value: 7, label: "7 days" },
          { value: 30, label: "30 days" },
        ]}
        value={range}
        onChange={setRange}
      />

      <button
        type="button"
        onClick={onViewDetails ?? (() => navigate("/reports"))}
        className="inline-flex items-center gap-1 text-sm font-semibold text-rose-500 transition hover:gap-2 hover:text-rose-600"
      >
        View details
        <ArrowRight size={15} />
      </button>
    </div>
  );

  let body: ReactNode;

  if (isLoading) {
    body = <ChartSkeleton />;
  } else if (error) {
    body = (
      <ChartMessage
        emoji="😕"
        title="We could not load the revenue"
        text={error}
        onRetry={onRetry}
      />
    );
  } else if (total === 0) {
    body = (
      <ChartMessage
        emoji="🌱"
        title={`No payments in the last ${range} days yet`}
        text="New subscription payments will show up here as soon as they come in."
      />
    );
  } else {
    body = (
      <>
        <div className="mb-4 flex flex-wrap items-end gap-x-4 gap-y-2">
          <div>
            <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {formatNaira(total)}
            </p>

            <p className="text-sm text-slate-500">
              {orders} {orders === 1 ? "subscription" : "subscriptions"} in the last {range} days
            </p>
          </div>

          {change !== null && (
            <span
              className={`mb-1 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                change >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              }`}
            >
              {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(change).toFixed(1)}% vs previous {range} days
            </span>
          )}
        </div>

        <div className="h-60 w-full sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLOR} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={COLOR} stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#e2e8f0" />

              <XAxis
                dataKey="axisLabel"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                interval="preserveStartEnd"
                minTickGap={range === 7 ? 4 : 28}
                tickMargin={10}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                tickFormatter={shortNumber}
                allowDecimals={false}
                width={48}
              />

              <Tooltip
                content={<RevenueTooltip />}
                cursor={{ stroke: COLOR, strokeDasharray: "4 4", strokeOpacity: 0.4 }}
              />

              <Area
                type="monotone"
                dataKey="amount"
                stroke={COLOR}
                strokeWidth={3}
                fill="url(#revenueFill)"
                dot={range === 7 ? { r: 4, fill: "#fff", stroke: COLOR, strokeWidth: 2 } : false}
                activeDot={{ r: 7, fill: COLOR, stroke: "#fff", strokeWidth: 3 }}
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Highest day: {formatNairaCompact(Math.max(...current.map((p) => p.amount)))}
        </p>
      </>
    );
  }

  return (
    <ChartCard
      title="Revenue overview"
      subtitle="Subscription payments received"
      icon={<Wallet size={22} />}
      accent={COLOR}
      actions={actions}
    >
      {body}
    </ChartCard>
  );
}