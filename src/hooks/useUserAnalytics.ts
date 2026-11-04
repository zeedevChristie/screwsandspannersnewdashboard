import { useCallback, useEffect, useState } from "react";

import { loadAllUsers } from "@/lib/allUser";

type DailyRevenuePoint = {
  date: string;
  amount: number;
  orders: number;
  label: string;
  shortDate: string;
  fullLabel: string;
};

type GrowthPoint = {
  label: string;
  fullLabel: string;
  newCustomers: number;
  newProviders: number;
  totalCustomers: number;
  totalProviders: number;
};

type Subscription = {
  amount_paid?: number | string | null;
  amountPaid?: number | string | null;
  amount?: number | string | null;
  status?: string | null;
  valid_from?: string | null;
  validFrom?: string | null;
  transaction?: { amount?: number | string | null; created_at?: string | null } | null;
};

type AnalyticsUser = {
  type?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  subscription?: Subscription | null;
};

const PAID_STATUSES = new Set(["SUCCESSFUL", "SUCCESS", "COMPLETED", "PAID"]);

const localDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const parseAmount = (value: unknown): number => {
  if (value === null || value === undefined || value === "") return 0;
  const amount = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : 0;
};

const parseDate = (value: unknown): Date | null => {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

function buildDailyRevenue(users: AnalyticsUser[], days: number): DailyRevenuePoint[] {
  const totals = new Map<string, number>();
  const orders = new Map<string, number>();
  const today = new Date();

  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    totals.set(localDateKey(date), 0);
    orders.set(localDateKey(date), 0);
  }

  for (const user of users) {
    const subscription = user.subscription;
    if (!subscription) continue;

    const status = String(subscription.status ?? "").trim().toUpperCase();
    if (status && !PAID_STATUSES.has(status)) continue;

    const amount = parseAmount(
      subscription.amount_paid ??
        subscription.amountPaid ??
        subscription.amount ??
        subscription.transaction?.amount,
    );
    if (amount <= 0) continue;

    const paymentDate =
      parseDate(subscription.transaction?.created_at) ??
      parseDate(subscription.valid_from) ??
      parseDate(subscription.validFrom) ??
      parseDate(user.createdAt) ??
      parseDate(user.created_at);
    if (!paymentDate) continue;

    const key = localDateKey(paymentDate);
    if (!totals.has(key)) continue;

    totals.set(key, totals.get(key)! + amount);
    orders.set(key, orders.get(key)! + 1);
  }

  return Array.from(totals, ([date, amount]) => {
    const parsedDate = new Date(`${date}T00:00:00`);
    return {
      date,
      amount,
      orders: orders.get(date) ?? 0,
      label: parsedDate.toLocaleDateString("en-GB", { weekday: "short" }),
      shortDate: parsedDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      fullLabel: parsedDate.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    };
  });
}

function buildGrowth(users: AnalyticsUser[], months: number): GrowthPoint[] {
  const totals = new Map<
    string,
    { date: Date; newCustomers: number; newProviders: number }
  >();
  const currentMonth = new Date();

  for (let offset = months - 1; offset >= 0; offset--) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    totals.set(key, { date, newCustomers: 0, newProviders: 0 });
  }

  let totalCustomers = 0;
  let totalProviders = 0;
  const monthlyCounts = new Map<string, { customers: number; providers: number }>();

  for (const user of users) {
    const createdAt = parseDate(user.createdAt) ?? parseDate(user.created_at);
    if (!createdAt) continue;

    const month = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
    const type = String(user.type ?? "").trim().toUpperCase();
    const isProvider = type === "SP" || type === "SERVICE PROVIDER" || type === "SERVICE_PROVIDER";
    const isCustomer = type === "CUSTOMER";

    if (!isProvider && !isCustomer) continue;

    if (isProvider) totalProviders += 1;
    else totalCustomers += 1;

    if (!totals.has(month)) continue;
    const counts = monthlyCounts.get(month) ?? { customers: 0, providers: 0 };
    if (isProvider) counts.providers += 1;
    else counts.customers += 1;
    monthlyCounts.set(month, counts);
  }

  let cumulativeCustomers =
    totalCustomers -
    Array.from(monthlyCounts.values()).reduce((sum, count) => sum + count.customers, 0);
  let cumulativeProviders =
    totalProviders -
    Array.from(monthlyCounts.values()).reduce((sum, count) => sum + count.providers, 0);

  return Array.from(totals, ([month, point]) => {
    const counts = monthlyCounts.get(month) ?? { customers: 0, providers: 0 };
    cumulativeCustomers += counts.customers;
    cumulativeProviders += counts.providers;
    return {
      label: point.date.toLocaleDateString("en-GB", { month: "short" }),
      fullLabel: point.date.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      newCustomers: counts.customers,
      newProviders: counts.providers,
      totalCustomers: cumulativeCustomers,
      totalProviders: cumulativeProviders,
    };
  });
}

/* Data for the Weekly Revenue and Monthly Growth charts */
export function useUserAnalytics() {
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenuePoint[]>([]);
  const [growth, setGrowth] = useState<GrowthPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((force: boolean) => {
    let cancelled = false;

    setIsLoading(true);

    loadAllUsers(force)
      .then((users) => {
        if (!cancelled) {
          setDailyRevenue(buildDailyRevenue(users, 60));
          setGrowth(buildGrowth(users, 6));
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(false), [load]);

  const reload = useCallback(() => {
    load(true);
  }, [load]);

  return { dailyRevenue, growth, isLoading, error, reload };
}
