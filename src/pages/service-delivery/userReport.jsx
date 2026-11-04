import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { X, Download } from "lucide-react";
import { getRevenueSummary, formatNaira } from "@/lib/revenue";

/* =========================================================
   USERS AND DOWNLOADS REPORT

   Uses the same user rows as the Customer table.
   Store downloads are typed in by hand (they are not in the API).
========================================================= */

const STORAGE_KEY = "sns_store_downloads";

const NOT_PROVIDED = "Not provided";

const titleCase = (text) => text.replace(/\b\w/g, (c) => c.toUpperCase());

/* State of a user:
   1) first address that has a state (user_address)
   2) otherwise the business state
   "Lagos", "lagos" and "Lagos State" are counted as one state. */
const getUserState = (user) => {
  const fromAddress = Array.isArray(user?.addressList)
    ? user.addressList.find((item) => item?.state)?.state
    : "";

  const raw = String(fromAddress || user?.business?.state || "").trim();

  if (!raw) {
    return NOT_PROVIDED;
  }

  const key = raw.toLowerCase().replace(/\s+state$/, "").trim();

  return titleCase(key) || NOT_PROVIDED;
};

const toNumber = (value) => {
  const n = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const formatNumber = (n) => Number(n || 0).toLocaleString("en-NG");

const loadDownloads = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      android: saved.android || "",
      ios: saved.ios || "",
      asOf: saved.asOf || "",
    };
  } catch {
    return { android: "", ios: "", asOf: "" };
  }
};

function StatCard({ label, value, note }) {
  return (
    <Box
      sx={{
        border: "1px solid #e5e7eb",
        borderRadius: 2,
        p: 2,
        backgroundColor: "#fff",
      }}
    >
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>
        {label}
      </Typography>

      <Typography sx={{ fontSize: 30, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
        {value}
      </Typography>

      {note && (
        <Typography sx={{ fontSize: 12, color: "#6b7280", mt: 0.5 }}>{note}</Typography>
      )}
    </Box>
  );
}

function SectionTitle({ number, children }) {
  return (
    <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827", mt: 4, mb: 1.5 }}>
      {number}. {children}
    </Typography>
  );
}

export default function UserReport({ open, onClose, users = [] }) {
  const [downloads, setDownloads] = useState(loadDownloads);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(downloads));
    } catch {
      /* storage not available, ignore */
    }
  }, [downloads]);

  /* =======================================================
     NUMBERS FROM THE USER LIST
  ======================================================= */

  const stats = useMemo(() => {
    const total = users.length;

    let active = 0;
    let expired = 0;
    let none = 0;

    const byType = new Map();
    const byState = new Map();

    users.forEach((user) => {
      /* 1) subscribers */
      if (!user?.subscription) {
        none += 1;
      } else if (user?.subscriptionStatus === "active") {
        active += 1;
      } else {
        expired += 1;
      }

      /* 2) type */
      const type = String(user?.type || "Unknown").trim() || "Unknown";
      byType.set(type, (byType.get(type) || 0) + 1);

      /* 3) state */
      const state = getUserState(user);
      byState.set(state, (byState.get(state) || 0) + 1);
    });

    const types = [...byType.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    const states = [...byState.entries()]
      .map(([state, count]) => ({
        state,
        count,
        pct: total ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => {
        if (a.state === NOT_PROVIDED) return 1;
        if (b.state === NOT_PROVIDED) return -1;
        return b.count - a.count;
      });

    return { total, active, expired, none, types, states };
  }, [users]);

  const revenue = useMemo(() => getRevenueSummary(users), [users]);

  const androidCount = toNumber(downloads.android);
  const iosCount = toNumber(downloads.ios);
  const totalDownloads = androidCount + iosCount;

  /* =======================================================
     DOWNLOAD REPORT AS CSV
  ======================================================= */

  const handleExport = () => {
    const escape = (value) => {
      const text = value === null || value === undefined ? "" : String(value);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };

    const lines = [];
    const add = (...cells) => lines.push(cells.map(escape).join(","));

    add("Users and Downloads Report");
    add("Generated on", new Date().toLocaleString("en-GB"));
    add();

    add("1. CURRENT SUBSCRIBERS");
    add("Current subscribers (active)", stats.active);
    add("Expired subscriptions", stats.expired);
    add("Never subscribed", stats.none);
    add();

    add("2. COUNT OF USERS");
    add("Total users", stats.total);
    stats.types.forEach((t) => add(`Type: ${t.type}`, t.count));
    add();

    add("3. SPREAD OF USERS BY STATE");
    add("State", "Users", "Share of all users (%)");
    stats.states.forEach((s) => add(s.state, s.count, s.pct.toFixed(1)));
    add();

    add("4. STORE DOWNLOADS");
    add("Android (Google Play)", androidCount);
    add("Apple (App Store)", iosCount);
    add("Total downloads", totalDownloads);
    add("Figures as of", downloads.asOf || "Not stated");
    add();

    add("5. REVENUE FROM SUBSCRIPTIONS");
    add("Total revenue (NGN)", revenue.total);
    add("Paying subscribers", revenue.count);
    add("Average per subscriber (NGN)", Math.round(revenue.average));
    add("Revenue this month (NGN)", revenue.thisMonth);
    add("Payments not counted (not successful)", revenue.notCounted);
    add();
    add("Package", "Subscribers", "Revenue (NGN)");
    revenue.packages.forEach((p) => add(p.name, p.count, p.amount));
    add();
    add("Month started", "Subscribers", "Revenue (NGN)");
    revenue.months.forEach((m) => add(m.label, m.count, m.amount));

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = "users-and-downloads-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography fontWeight={700} sx={{ fontSize: 20 }}>
            Users and Downloads Report
          </Typography>

          <Typography variant="body2" color="#6b7280" sx={{ mt: 0.5 }}>
            Generated on {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button variant="contained" size="small" startIcon={<Download size={16} />} onClick={handleExport}>
            Download CSV
          </Button>

          <IconButton onClick={onClose}>
            <X size={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* ===============================================
            1. CURRENT SUBSCRIBERS
        =============================================== */}

        <SectionTitle number={1}>Count of current subscribers</SectionTitle>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 2 }}>
          <StatCard
            label="Current subscribers"
            value={formatNumber(stats.active)}
            note="Subscription that has not expired"
          />
          <StatCard label="Expired" value={formatNumber(stats.expired)} note="Subscription date has passed" />
          <StatCard label="Never subscribed" value={formatNumber(stats.none)} note="No subscription on record" />
        </Box>

        {/* ===============================================
            2. COUNT OF USERS
        =============================================== */}

        <SectionTitle number={2}>Count of users</SectionTitle>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 2 }}>
          <StatCard label="Total users" value={formatNumber(stats.total)} note="All user types" />

          {stats.types.map((t) => (
            <StatCard
              key={t.type}
              label={t.type}
              value={formatNumber(t.count)}
              note={`${stats.total ? ((t.count / stats.total) * 100).toFixed(1) : 0}% of all users`}
            />
          ))}
        </Box>

        {/* ===============================================
            3. SPREAD BY STATE
        =============================================== */}

        <SectionTitle number={3}>Spread of users across the states</SectionTitle>

        <Typography variant="body2" color="#6b7280" sx={{ mb: 1.5 }}>
          Each user is counted once, using the state of their first saved address (or their business
          state if they have no address).
        </Typography>

        <Box
          sx={{
            border: "1px solid #e5e7eb",
            borderRadius: 2,
            maxHeight: 380,
            overflowY: "auto",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "180px 90px 80px 1fr",
              gap: 1,
              px: 2,
              py: 1,
              position: "sticky",
              top: 0,
              backgroundColor: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
              fontSize: 12,
              fontWeight: 700,
              color: "#6b7280",
              textTransform: "uppercase",
            }}
          >
            <span>State</span>
            <span>Users</span>
            <span>Share</span>
            <span />
          </Box>

          {stats.states.map((row) => (
            <Box
              key={row.state}
              sx={{
                display: "grid",
                gridTemplateColumns: "180px 90px 80px 1fr",
                gap: 1,
                px: 2,
                py: 1,
                alignItems: "center",
                borderBottom: "1px solid #f3f4f6",
                fontSize: 14,
                color: row.state === NOT_PROVIDED ? "#9ca3af" : "#374151",
              }}
            >
              <span>{row.state}</span>
              <span style={{ fontWeight: 600 }}>{formatNumber(row.count)}</span>
              <span>{row.pct.toFixed(1)}%</span>

              <Box sx={{ height: 8, borderRadius: 4, backgroundColor: "#e5e7eb" }}>
                <Box
                  sx={{
                    height: "100%",
                    width: `${Math.max(row.pct, 0.5)}%`,
                    borderRadius: 4,
                    backgroundColor: row.state === NOT_PROVIDED ? "#9ca3af" : "#2563eb",
                  }}
                />
              </Box>
            </Box>
          ))}

          {!stats.states.length && (
            <Typography sx={{ p: 2, color: "#6b7280" }}>No users loaded yet.</Typography>
          )}
        </Box>

        {/* ===============================================
            4. STORE DOWNLOADS
        =============================================== */}

        <SectionTitle number={4}>Number of downloads on the stores</SectionTitle>

        <Typography variant="body2" color="#6b7280" sx={{ mb: 1.5 }}>
          Download numbers are not part of the user data, so type them in from Google Play Console
          (Statistics, Installs) and App Store Connect (Analytics, App Units). They are remembered on
          this computer and included in the CSV.
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 2 }}>
          <TextField
            size="small"
            type="number"
            label="Android (Google Play)"
            value={downloads.android}
            inputProps={{ min: 0 }}
            onChange={(e) => setDownloads((d) => ({ ...d, android: e.target.value }))}
          />

          <TextField
            size="small"
            type="number"
            label="Apple (App Store)"
            value={downloads.ios}
            inputProps={{ min: 0 }}
            onChange={(e) => setDownloads((d) => ({ ...d, ios: e.target.value }))}
          />

          <TextField
            size="small"
            type="date"
            label="Figures as of"
            InputLabelProps={{ shrink: true }}
            value={downloads.asOf}
            onChange={(e) => setDownloads((d) => ({ ...d, asOf: e.target.value }))}
          />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 2, mt: 2 }}>
          <StatCard label="Android" value={formatNumber(androidCount)} />
          <StatCard label="Apple" value={formatNumber(iosCount)} />
          <StatCard label="Total downloads" value={formatNumber(totalDownloads)} />
        </Box>

        {/* ===============================================
            5. REVENUE
        =============================================== */}

        <SectionTitle number={5}>Revenue from subscriptions</SectionTitle>

        <Typography variant="body2" color="#6b7280" sx={{ mb: 1.5 }}>
          Revenue is the "amount paid" on each user's subscription, counting successful payments only.
          It updates every time the page loads. Each user's latest subscription is used, so earlier
          renewals are not included until the API sends subscription history.
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 2 }}>
          <StatCard
            label="Total revenue"
            value={formatNaira(revenue.total)}
            note={`From ${formatNumber(revenue.count)} paying subscribers`}
          />
          <StatCard
            label="This month"
            value={formatNaira(revenue.thisMonth)}
            note="Subscriptions started this month"
          />
          <StatCard label="Average per subscriber" value={formatNaira(revenue.average)} />
        </Box>

        {revenue.notCounted > 0 && (
          <Typography variant="body2" color="#b45309" sx={{ mt: 1.5 }}>
            {formatNumber(revenue.notCounted)} payment(s) were not counted because their status is not
            successful.
          </Typography>
        )}

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 2, mt: 2 }}>
          {/* by package */}
          <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ px: 2, py: 1, backgroundColor: "#f9fafb", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>
              By package
            </Box>

            {revenue.packages.map((p) => (
              <Box
                key={p.name}
                sx={{ display: "flex", justifyContent: "space-between", px: 2, py: 1, borderTop: "1px solid #f3f4f6", fontSize: 14 }}
              >
                <span>
                  {p.name} <span style={{ color: "#9ca3af" }}>({formatNumber(p.count)})</span>
                </span>
                <span style={{ fontWeight: 600 }}>{formatNaira(p.amount)}</span>
              </Box>
            ))}

            {!revenue.packages.length && (
              <Typography sx={{ p: 2, color: "#6b7280" }}>No paid subscriptions yet.</Typography>
            )}
          </Box>

          {/* by month */}
          <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 2, maxHeight: 280, overflowY: "auto" }}>
            <Box sx={{ px: 2, py: 1, backgroundColor: "#f9fafb", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", position: "sticky", top: 0 }}>
              By month started
            </Box>

            {revenue.months.map((m) => {
              const max = Math.max(...revenue.months.map((item) => item.amount), 1);

              return (
                <Box key={m.key} sx={{ px: 2, py: 1, borderTop: "1px solid #f3f4f6", fontSize: 14 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <span>
                      {m.label} <span style={{ color: "#9ca3af" }}>({formatNumber(m.count)})</span>
                    </span>
                    <span style={{ fontWeight: 600 }}>{formatNaira(m.amount)}</span>
                  </Box>

                  <Box sx={{ height: 6, borderRadius: 3, backgroundColor: "#e5e7eb", mt: 0.75 }}>
                    <Box sx={{ height: "100%", width: `${(m.amount / max) * 100}%`, borderRadius: 3, backgroundColor: "#0d9488" }} />
                  </Box>
                </Box>
              );
            })}

            {!revenue.months.length && (
              <Typography sx={{ p: 2, color: "#6b7280" }}>No paid subscriptions yet.</Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}