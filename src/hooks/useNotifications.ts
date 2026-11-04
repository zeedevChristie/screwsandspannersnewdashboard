import { useCallback, useEffect, useRef, useState } from "react";

export interface AppNotification {
  id: string;
  type: "signup" | "subscription";
  message: string;
  at: string;
  read: boolean;
}

const POLL_MS = 20000;
const LIMIT = 50;

const API_BASE = import.meta.env.VITE_API_URL ?? "https://meemaw.sands.com.ng";
const USERS_URL = `${API_BASE}/api/v1/admin/all-users`;

const SEEN_KEY = "owleye_seen_users_v3";
const ITEMS_KEY = "owleye_notifications_v3";

// Same token logic your dashboard already uses
const getAuthToken = () => {
  return (
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    ""
  );
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

async function request(page: number, limit: number) {
  const token = getAuthToken();
  if (!token) throw new Error("No auth token found in localStorage");

  const res = await fetch(`${USERS_URL}?page=${page}&limit=${limit}`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(`all-users page ${page} -> HTTP ${res.status}`);
  return res.json();
}

let loggedShape = false;

// Works out how many users exist in total from the "pagination" object
function findTotal(json: any): number | null {
  const p = json?.data?.pagination ?? json?.pagination ?? {};

  if (!loggedShape) {
    loggedShape = true;
    console.log("[notifications] pagination:", p); // just numbers, safe to share
  }

  const entries = Object.entries(p).filter(([, v]) => Number.isFinite(Number(v)));

  // 1. A field like total / totalItems / totalUsers / totalRecords (but not totalPages)
  const totalItems = entries.find(([k]) => /total|count/i.test(k) && !/page/i.test(k));
  if (totalItems && Number(totalItems[1]) > 0) return Number(totalItems[1]);

  // 2. A field like totalPages / pages (works because the probe asks for 1 user per page)
  const totalPages = entries.find(([k]) => /page/i.test(k) && /total|pages$/i.test(k));
  if (totalPages && Number(totalPages[1]) > 0) return Number(totalPages[1]);

  return null;
}

async function fetchUsers(): Promise<Record<string, any>[]> {
  // 1. Small probe to learn how many users exist
  const probe = await request(1, 1);
  const total = findTotal(probe);

  // Couldn't find a total: fall back to page 1
  if (!total) {
    console.warn("[notifications] couldn't read total users, falling back to page 1");
    return (await request(1, LIMIT))?.data?.users ?? [];
  }

  // 2. Fetch the newest page (and the one before it, so nothing slips through)
  const lastPage = Math.max(1, Math.ceil(total / LIMIT));
  const last = (await request(lastPage, LIMIT))?.data?.users ?? [];

  if (last.length < LIMIT && lastPage > 1) {
    const prev = (await request(lastPage - 1, LIMIT))?.data?.users ?? [];
    return [...prev, ...last];
  }
  return last;
}

function describe(u: Record<string, any>) {
  const name = `${u.firstname ?? ""} ${u.lastname ?? ""}`.trim() || u.email || `User #${u.id}`;
  const role = u.type === "SP" ? "service provider" : "customer";
  return { name, role };
}

export function useNotifications(onNew?: (n: AppNotification) => void) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const seen = useRef<Record<string, boolean>>({});
  const hadBaseline = useRef(false);
  const onNewRef = useRef(onNew);
  onNewRef.current = onNew;

  useEffect(() => {
    let active = true;

    seen.current = load<Record<string, boolean>>(SEEN_KEY, {});
    hadBaseline.current = Object.keys(seen.current).length > 0;
    setItems(load<AppNotification[]>(ITEMS_KEY, []));

    const check = async () => {
      if (document.hidden) return;
      try {
        const users = await fetchUsers();
        if (!active) return;

        const isBaseline = !hadBaseline.current;
        const fresh: AppNotification[] = [];

        for (const u of users) {
          const id = String(u.id);
          const subscribed = !!u.subscription;
          const wasSubscribed = seen.current[id];

          if (wasSubscribed === undefined) {
            if (!isBaseline) {
              const { name, role } = describe(u);
              fresh.push({
                id: `signup-${id}`,
                type: "signup",
                message: `New ${role} signed up: ${name}`,
                at: u.created_at ?? new Date().toISOString(),
                read: false,
              });
            }
          } else if (!wasSubscribed && subscribed) {
            const { name } = describe(u);
            const plan =
              u.subscription?.plan_name ?? u.subscription?.plan ?? u.subscription?.name ?? "a plan";
            fresh.push({
              id: `sub-${id}-${Date.now()}`,
              type: "subscription",
              message: `${name} subscribed to ${typeof plan === "string" ? plan : "a plan"}`,
              at: new Date().toISOString(),
              read: false,
            });
          }

          seen.current[id] = subscribed;
        }

        const entries = Object.entries(seen.current);
        if (entries.length > 2000) seen.current = Object.fromEntries(entries.slice(-2000));
        save(SEEN_KEY, seen.current);

        if (isBaseline) {
          hadBaseline.current = true; // first run: remember existing users, no alerts
          return;
        }

        if (fresh.length) {
          setItems((prev) => {
            const next = [...fresh, ...prev].slice(0, 50);
            save(ITEMS_KEY, next);
            return next;
          });
          fresh.forEach((n) => onNewRef.current?.(n));
        }
      } catch (e) {
        console.error("Notification poll failed", e);
      }
    };

    check();
    const timer = setInterval(check, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      save(ITEMS_KEY, next);
      return next;
    });
  }, []);

  const unread = items.filter((n) => !n.read).length;
  return { items, unread, markAllRead };
}