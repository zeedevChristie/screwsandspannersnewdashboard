"use client"; // Next.js App Router only

import { useEffect, useRef, useState } from "react";
import { Bell, UserPlus, CreditCard } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

interface NotificationBellProps {
  color: string; // pass animal.primary
}

export default function NotificationBell({ color }: Readonly<NotificationBellProps>) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { items, unread, markAllRead } = useNotifications((n) => {
    // plug in a toast here if you have one, e.g. toast.info(n.message)
  });

  // close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 transition hover:bg-gray-200"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-xl border bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <strong className="text-sm">Notifications</strong>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-medium hover:underline"
                style={{ color }}
              >
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 && (
            <p className="p-4 text-sm text-gray-400">No notifications yet</p>
          )}

          {items.map((n) => (
            <div
              key={n.id}
              className={`flex gap-3 border-b px-4 py-3 last:border-b-0 ${
                n.read ? "bg-white" : "bg-gray-50"
              }`}
            >
              <div className="mt-0.5" style={{ color }}>
                {n.type === "signup" ? <UserPlus size={16} /> : <CreditCard size={16} />}
              </div>
              <div>
                <p className="text-sm text-gray-800">{n.message}</p>
                <small className="text-xs text-gray-400">
                  {new Date(n.at).toLocaleString()}
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}