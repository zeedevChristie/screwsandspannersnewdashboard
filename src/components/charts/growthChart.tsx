import { ReactNode, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Users } from "lucide-react";

import ChartCard, { ChartMessage, ChartSkeleton, Segmented } from "./chartCard";

interface GrowthPoint {
  label: string;
  fullLabel: string;
  newCustomers: number;
  newProviders: number;
  totalCustomers: number;
  totalProviders: number;
}

interface GrowthChartProps {
  growth: GrowthPoint[];
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}

type Mode = "new" | "total";

const CUSTOMER_COLOR = "#3b82f6";
const PROVIDER_COLOR = "#22c55e";

const formatCount = (value: number): string => value.toLocaleString("en-NG");

interface Row {
  label: string;
  fullLabel: string;
  customers: number;
  providers: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: Row }>;
  mode: Mode;
}

function GrowthTooltip({ active, payload, mode }: Readonly<TooltipProps>) {
  const row = active ? payload?.[0]?.payload : undefined;

  if (!row) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xl">
      <p className="text-xs font-medium text-slate-500">
        {row.fullLabel} &middot; {mode === "new" ? "new sign-ups" : "total users"}
      </p>

      <div className="mt-2 space-y-1">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: CUSTOMER_COLOR }} />
          Customers
          <span className="ml-auto pl-4">{formatCount(row.customers)}</span>
        </p>

        <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: PROVIDER_COLOR }} />
          Service providers
          <span className="ml-auto pl-4">{formatCount(row.providers)}</span>
        </p>
      </div>
    </div>
  );
}

export default function GrowthChart({
  growth,
  isLoading,
  error,
  onRetry,
}: Readonly<GrowthChartProps>) {
  const [mode, setMode] = useState<Mode>("new");

  const rows: Row[] = growth.map((point) => ({
    label: point.label,
    fullLabel: point.fullLabel,
    customers: mode === "new" ? point.newCustomers : point.totalCustomers,
    providers: mode === "new" ? point.newProviders : point.totalProviders,
  }));

  const last = growth[growth.length - 1];

  const customerSummary =
    mode === "new"
      ? growth.reduce((sum, p) => sum + p.newCustomers, 0)
      : (last?.totalCustomers ?? 0);

  const providerSummary =
    mode === "new"
      ? growth.reduce((sum, p) => sum + p.newProviders, 0)
      : (last?.totalProviders ?? 0);

  const hasData = growth.some(
    (p) => p.newCustomers > 0 || p.newProviders > 0 || p.totalCustomers > 0 || p.totalProviders > 0
  );

  const actions = (
    <Segmented<Mode>
      options={[
        { value: "new", label: "New sign-ups" },
        { value: "total", label: "Total users" },
      ]}
      value={mode}
      onChange={setMode}
    />
  );

  let body: ReactNode;

  if (isLoading) {
    body = <ChartSkeleton />;
  } else if (error) {
    body = (
      <ChartMessage
        emoji="😕"
        title="We could not load the sign-ups"
        text={error}
        onRetry={onRetry}
      />
    );
  } else if (!hasData) {
    body = (
      <ChartMessage
        emoji="🌱"
        title="No sign-ups to show yet"
        text="Customers and service providers will appear here as they join."
      />
    );
  } else {
    body = (
      <>
        <div className="mb-4 flex flex-wrap gap-3">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold"
            style={{
              background: `color-mix(in srgb, ${CUSTOMER_COLOR} 12%, white)`,
              color: CUSTOMER_COLOR,
            }}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: CUSTOMER_COLOR }} />
            Customers
            <span className="font-bold">
              {mode === "new" ? "+" : ""}
              {formatCount(customerSummary)}
            </span>
          </span>

          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold"
            style={{
              background: `color-mix(in srgb, ${PROVIDER_COLOR} 12%, white)`,
              color: "#16a34a",
            }}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: PROVIDER_COLOR }} />
            Service providers
            <span className="font-bold">
              {mode === "new" ? "+" : ""}
              {formatCount(providerSummary)}
            </span>
          </span>

          <span className="self-center text-xs text-slate-400">
            {mode === "new" ? "over the last 6 months" : "as of this month"}
          </span>
        </div>

        <div className="h-60 w-full sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#e2e8f0" />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                tickMargin={10}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                allowDecimals={false}
                width={44}
              />

              <Tooltip
                content={<GrowthTooltip mode={mode} />}
                cursor={{ stroke: "#94a3b8", strokeDasharray: "4 4", strokeOpacity: 0.5 }}
              />

              <Line
                type="monotone"
                dataKey="customers"
                stroke={CUSTOMER_COLOR}
                strokeWidth={3}
                dot={{ r: 4, fill: "#fff", stroke: CUSTOMER_COLOR, strokeWidth: 2 }}
                activeDot={{ r: 7, fill: CUSTOMER_COLOR, stroke: "#fff", strokeWidth: 3 }}
                animationDuration={900}
              />

              <Line
                type="monotone"
                dataKey="providers"
                stroke={PROVIDER_COLOR}
                strokeWidth={3}
                dot={{ r: 4, fill: "#fff", stroke: PROVIDER_COLOR, strokeWidth: 2 }}
                activeDot={{ r: 7, fill: PROVIDER_COLOR, stroke: "#fff", strokeWidth: 3 }}
                animationDuration={900}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </>
    );
  }

  return (
    <ChartCard
      title="Monthly growth"
      subtitle="Customers and service providers joining each month"
      icon={<Users size={22} />}
      accent={CUSTOMER_COLOR}
      actions={actions}
    >
      {body}
    </ChartCard>
  );
}