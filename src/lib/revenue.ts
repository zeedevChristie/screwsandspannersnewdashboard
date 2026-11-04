/* =========================================================
   REVENUE FROM SUBSCRIPTIONS

   Revenue = the "amount paid" of each user's subscription.
   Every time the user list is loaded, the amounts are added up,
   so a new subscription is included the next time you refresh.

   Only successful payments are counted. Each user's LATEST
   subscription is used (the API does not send older ones yet).
========================================================= */

export interface RevenueRow {
  subscription?: unknown;
  amountPaid?: unknown;
  paymentStatus?: string;
  packageName?: string;
  validFrom?: string | null;
}

export interface RevenueSummary {
  total: number;
  count: number;
  average: number;
  thisMonth: number;
  notCounted: number;
  packages: { name: string; amount: number; count: number }[];
  months: { key: string; label: string; amount: number; count: number }[];
}

const PAID_STATUSES = ["SUCCESSFUL", "SUCCESS", "COMPLETED", "PAID"];

export const formatNaira = (value: number | string | null | undefined): string =>
  `₦${Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

/* Short form for small spaces such as dashboard cards:
   200       -> ₦200
   9,500     -> ₦9,500
   44,200    -> ₦44.2k
   100,000   -> ₦100k
   1,250,000 -> ₦1.3M
   Amounts below 10,000 are shown in full. */
export const formatNairaCompact = (value: number | string | null | undefined): string => {
  const n = Number(value || 0);

  if (!Number.isFinite(n)) {
    return "₦0";
  }

  const abs = Math.abs(n);

  if (abs < 10000) {
    return formatNaira(n);
  }

  const units = [
    { size: 1e12, suffix: "T" },
    { size: 1e9, suffix: "B" },
    { size: 1e6, suffix: "M" },
    { size: 1e3, suffix: "k" },
  ];

  const roundShort = (scaled: number): number =>
    scaled >= 100 ? Math.round(scaled) : Math.round(scaled * 10) / 10;

  let index = units.findIndex((unit) => abs >= unit.size);
  let rounded = roundShort(abs / units[index].size);

  /* 999,950 rounds up to 1000k, so show it as 1M instead */
  if (rounded >= 1000 && index > 0) {
    index -= 1;
    rounded = roundShort(abs / units[index].size);
  }

  return `${n < 0 ? "-" : ""}₦${rounded}${units[index].suffix}`;
};

const toAmount = (value: unknown): number | null => {
  const n = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

/* A payment counts unless its status says it did not go through.
   If the API sends no status, the payment is counted. */
const isCounted = (row: RevenueRow): boolean => {
  const status = String(row?.paymentStatus ?? "").trim().toUpperCase();
  return !status || status === "N/A" || PAID_STATUSES.includes(status);
};

const monthKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const monthLabel = (key: string): string => {
  if (key === "unknown") {
    return "Date not available";
  }

  const [year, month] = key.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
};

/* Turns a user exactly as the API sends it into the shape used below */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toRevenueRow = (user: any): RevenueRow => {
  const sub = user?.subscription || null;

  return {
    subscription: sub,
    amountPaid: sub?.amount_paid ?? sub?.amountPaid,
    paymentStatus: sub?.status ?? "N/A",
    packageName: sub?.package ?? "N/A",
    validFrom: sub?.valid_from ?? sub?.validFrom ?? null,
  };
};

export function getRevenueSummary(users: RevenueRow[] = []): RevenueSummary {
  let total = 0;
  let count = 0;
  let notCounted = 0;
  let thisMonth = 0;

  const byPackage = new Map<string, { amount: number; count: number }>();
  const byMonth = new Map<string, { amount: number; count: number }>();

  const currentKey = monthKey(new Date());

  users.forEach((user) => {
    if (!user?.subscription) {
      return;
    }

    const amount = toAmount(user?.amountPaid);

    /* "N/A" or 0 (for example a free promo) is not revenue */
    if (amount === null || amount <= 0) {
      return;
    }

    if (!isCounted(user)) {
      notCounted += 1;
      return;
    }

    total += amount;
    count += 1;

    /* by package */
    const packageName =
      user?.packageName && user.packageName !== "N/A" ? String(user.packageName) : "Unknown";

    const pack = byPackage.get(packageName) || { amount: 0, count: 0 };
    pack.amount += amount;
    pack.count += 1;
    byPackage.set(packageName, pack);

    /* by month (month the subscription started) */
    const date = user?.validFrom ? new Date(user.validFrom) : null;
    const key = date && !Number.isNaN(date.getTime()) ? monthKey(date) : "unknown";

    const month = byMonth.get(key) || { amount: 0, count: 0 };
    month.amount += amount;
    month.count += 1;
    byMonth.set(key, month);

    if (key === currentKey) {
      thisMonth += amount;
    }
  });

  const packages = [...byPackage.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.amount - a.amount);

  const months = [...byMonth.entries()]
    .map(([key, value]) => ({ key, label: monthLabel(key), ...value }))
    .sort((a, b) => {
      if (a.key === "unknown") return 1;
      if (b.key === "unknown") return -1;
      return b.key.localeCompare(a.key);
    });

  return {
    total,
    count,
    average: count ? total / count : 0,
    thisMonth,
    notCounted,
    packages,
    months,
  };
}