import { useEffect, useState } from "react";

import { getRevenueSummary, toRevenueRow, RevenueSummary } from "@/lib/revenue";

/* =========================================================
   REVENUE FOR THE DASHBOARD CARD

   Reads every user from the admin all-users API, adds up the
   "amount paid" of their subscriptions and keeps the result for
   a few minutes so moving between pages does not reload it.
========================================================= */

const ALL_USERS_URL = "https://meemaw.sands.com.ng/api/v1/admin/all-users";

const PAGE_SIZE = 100;

const CACHE_MINUTES = 5;

let cache: { at: number; data: RevenueSummary } | null = null;

const getToken = (): string =>
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  localStorage.getItem("token") ||
  localStorage.getItem("access_token") ||
  "";

async function loadRevenue(): Promise<RevenueSummary> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication token was not found.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allUsers: any[] = [];

  let page = 1;

  while (page <= 200) {
    const response = await fetch(`${ALL_USERS_URL}?page=${page}&limit=${PAGE_SIZE}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json?.message || `Request failed with status ${response.status}`);
    }

    const users: unknown[] = json?.data?.users ?? json?.data?.customers ?? json?.users ?? json?.data ?? [];

    if (!Array.isArray(users) || users.length === 0) {
      break;
    }

    allUsers.push(...users);

    const pagination = json?.data?.pagination ?? json?.pagination;
    const total = Number(pagination?.total);
    const limit = Number(pagination?.limit) || PAGE_SIZE;

    if (Number.isFinite(total) && total > 0) {
      if (allUsers.length >= total) {
        break;
      }
    } else if (users.length < limit) {
      break;
    }

    page += 1;
  }

  return getRevenueSummary(allUsers.map(toRevenueRow));
}

export function useRevenue() {
  const [data, setData] = useState<RevenueSummary | null>(cache?.data ?? null);
  const [isLoading, setIsLoading] = useState<boolean>(!cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const cached = cache;

    if (cached && Date.now() - cached.at < CACHE_MINUTES * 60 * 1000) {
      setData(cached.data);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);

    loadRevenue()
      .then((result) => {
        cache = { at: Date.now(), data: result };

        if (!cancelled) {
          setData(result);
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

  return { data, isLoading, error };
}