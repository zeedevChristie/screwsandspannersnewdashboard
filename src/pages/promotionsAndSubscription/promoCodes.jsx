import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { api_subscription } from "@/api/client_subscription"; // adjust path to where the file lives

/**
 * Promo tab content for the DSS admin dashboard (React + Tailwind, no extra dependencies).
 *
 *   <PromoCode />
 *
 * Uses your existing `api_subscription` client (client_subscription.ts), which already sends x_api_key.
 * That client's response interceptor returns the response body, and request() then returns body.data,
 * so these calls resolve to the inner `data` of { status, data }. Errors arrive as AxiosError.
 * If your VITE_SUBSCRIPTION_API_BASE_URL already ends in /api/v1, change COUPONS_PATH below.
 *
 *   GET    /                    list coupons
 *   POST   /                    create coupon
 *   PATCH  /{_id}               update description, discountValue, startsAt, endsAt
 *   GET    /{_id}/redemptions   redemption history
 *
 * Light styling only, to match a light dashboard body.
 */

const DAY = 864e5;
const pad = (n) => String(n).padStart(2, "0");
const toLocal = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
    : "";
const discText = (type, v) =>
  type === "PERCENTAGE" ? `${v || 0}% off` : `₦${Number(v || 0).toLocaleString()} off`;
const getStatus = (c) => {
  const n = Date.now();
  if (n < new Date(c.startsAt)) return ["Scheduled", "bg-amber-100 text-amber-800"];
  if (n > new Date(c.endsAt)) return ["Expired", "bg-red-100 text-red-700"];
  return ["Active", "bg-teal-100 text-teal-800"];
};
const emptyForm = () => {
  const s = new Date();
  s.setHours(0, 0, 0, 0);
  const e = new Date(s.getTime() + 30 * DAY);
  e.setHours(23, 59, 59, 0);
  return {
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    startsAt: toLocal(s),
    endsAt: toLocal(e),
    description: "",
  };
};

const COUPONS_PATH = "/promo/coupons"; // adjust to your base URL
const api = {
  list: () => api_subscription.get(`${COUPONS_PATH}/`),
  create: (p) => api_subscription.post(`${COUPONS_PATH}/`, p),
  update: (id, p) => api_subscription.patch(`${COUPONS_PATH}/${id}`, p),
  redemptions: (id) => api_subscription.get(`${COUPONS_PATH}/${id}/redemptions`),
};
const errMsg = (e) =>
  (e && e.response && e.response.data && e.response.data.message) ||
  (e && e.message) ||
  "Something went wrong";

// Response shapes beyond { status, data } aren't documented, so read defensively.
const toArray = (body) => {
  if (Array.isArray(body)) return body;
  const d = body && body.data !== undefined ? body.data : body;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.coupons)) return d.coupons;
  if (d && Array.isArray(d.items)) return d.items;
  if (d && Array.isArray(d.docs)) return d.docs;
  return [];
};

const inputCls =
  "w-full rounded-lg border bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/30 disabled:cursor-not-allowed disabled:opacity-60";
const border = (bad) => (bad ? "border-red-500" : "border-slate-200");
const panel = "rounded-2xl border border-slate-200 bg-white p-6";
const btn =
  "whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:opacity-60";
const btnPri =
  "whitespace-nowrap rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60";
const btnSm =
  "whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600";

const notch =
  "radial-gradient(circle 11px at calc(100% - 92px) 0,#0000 98%,#000) top/100% 51% no-repeat,radial-gradient(circle 11px at calc(100% - 92px) 100%,#0000 98%,#000) bottom/100% 51% no-repeat";

export default function PromoCode() {
  const [tab, setTab] = useState("create");
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [highlight, setHighlight] = useState(null);
  const [dlg, setDlg] = useState(null);
  const timer = useRef();

  const notify = (m) => {
    setToast(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 2800);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setListError("");
    try {
      setCoupons(toArray(await api.list()));
    } catch (e) {
      setListError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (k) => (e) => {
    const v =
      k === "code" ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const payload = useMemo(() => {
    const base = {
      discountValue: Number(form.discountValue) || 0,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : "",
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : "",
      description: form.description.trim(),
    };
    return editing
      ? {
          description: base.description,
          discountValue: base.discountValue,
          startsAt: base.startsAt,
          endsAt: base.endsAt,
        }
      : { code: form.code.trim(), discountType: form.discountType, ...base };
  }, [form, editing]);

  const validate = () => {
    const e = {};
    const v = Number(form.discountValue);
    if (!editing && !/^[A-Z0-9]{4,20}$/.test(form.code))
      e.code = "Use 4–20 letters or numbers, no spaces.";
    if (!(v > 0)) e.discountValue = "Enter a number greater than 0.";
    else if (form.discountType === "PERCENTAGE" && v > 100)
      e.discountValue = "A percentage can’t be more than 100.";
    if (!form.startsAt) e.startsAt = "Choose a start date.";
    if (!form.endsAt || (form.startsAt && new Date(form.endsAt) <= new Date(form.startsAt)))
      e.endsAt = "Choose an end date after the start.";
    if (!form.description.trim()) e.description = "Add a short description.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const reset = () => {
    setEditing(null);
    setForm(emptyForm());
    setErrors({});
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return notify("Fix the highlighted fields");
    setSaving(true);
    try {
      if (editing) {
        await api.update(editing._id, payload);
        notify(`Coupon ${editing.code} updated`);
        setHighlight(editing._id);
      } else {
        const body = await api.create(payload);
        notify(`Coupon ${payload.code} created`);
        setHighlight(body && (body._id || (body.data && body.data._id)));
      }
      reset();
      await load();
      setTab("list");
    } catch (e) {
      notify(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c) => {
    setEditing(c);
    setErrors({});
    setForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      startsAt: toLocal(c.startsAt),
      endsAt: toLocal(c.endsAt),
      description: c.description || "",
    });
    setTab("create");
  };

  const openRedemptions = async (c) => {
    setDlg({ coupon: c, loading: true, rows: [], error: "" });
    try {
      setDlg({ coupon: c, loading: false, rows: toArray(await api.redemptions(c._id)), error: "" });
    } catch (e) {
      setDlg({ coupon: c, loading: false, rows: [], error: errMsg(e) });
    }
  };

  const generate = () => {
    const w = ["SAVE", "PROMO", "DSS", "WELCOME", "BOOST"];
    setForm((f) => ({
      ...f,
      code: w[Math.floor(Math.random() * w.length)] + Math.floor(10 + Math.random() * 90),
    }));
  };

  const copyJson = () =>
    navigator.clipboard
      ? navigator.clipboard
          .writeText(JSON.stringify(payload, null, 2))
          .then(() => notify("JSON copied"))
      : notify("Copy isn’t available here");

  const isPct = form.discountType === "PERCENTAGE";
  const tabCls = (on) =>
    `rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
      on ? "bg-teal-700 text-white" : "text-slate-500"
    }`;

  return (
    <div className="text-slate-900">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Promo codes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create codes subscribers can redeem in the app.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1" role="tablist">
          <button
            role="tab"
            aria-selected={tab === "create"}
            className={tabCls(tab === "create")}
            onClick={() => setTab("create")}
          >
            {editing ? "Edit coupon" : "Create coupon"}
          </button>
          <button
            role="tab"
            aria-selected={tab === "list"}
            className={tabCls(tab === "list")}
            onClick={() => setTab("list")}
          >
            All coupons ({coupons.length})
          </button>
        </div>
      </div>

      {tab === "create" && (
        <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]">
          <form className={panel} onSubmit={submit} noValidate>
            <h2 className="mb-4 text-lg font-bold">
              {editing ? `Edit ${editing.code}` : "New coupon"}
            </h2>

            <Field label="Coupon code" id="pc-code" error={errors.code}>
              <div className="flex gap-2">
                <input
                  id="pc-code"
                  value={form.code}
                  onChange={set("code")}
                  maxLength={20}
                  disabled={!!editing}
                  placeholder="SAVE20"
                  autoComplete="off"
                  className={`${inputCls} ${border(errors.code)} font-bold tracking-wider`}
                />
                {!editing && (
                  <button type="button" className={btn} onClick={generate}>
                    Generate
                  </button>
                )}
              </div>
            </Field>

            <div className="mb-4">
              <span className="mb-1.5 block text-sm font-semibold">Discount type</span>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["PERCENTAGE", "Percentage", "Take a % off the price"],
                  ["AMOUNT", "Fixed amount", "Take a set ₦ amount off"],
                ].map(([val, name, sub]) => (
                  <label key={val} className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="pc-type"
                      value={val}
                      className="peer sr-only"
                      checked={form.discountType === val}
                      disabled={!!editing}
                      onChange={set("discountType")}
                    />
                    <div className="rounded-xl border-2 border-slate-200 p-3 text-sm font-semibold peer-checked:border-teal-600 peer-checked:bg-teal-50 peer-focus-visible:ring-2 peer-focus-visible:ring-teal-600 peer-disabled:cursor-not-allowed peer-disabled:opacity-60">
                      {name}
                      <span className="block text-xs font-normal text-slate-500">{sub}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Field
              label="Discount value"
              id="pc-val"
              error={errors.discountValue}
              hint={
                isPct
                  ? "Enter 100 to make the subscription free."
                  : "Fixed amount in naira, taken off the plan price."
              }
            >
              <div className="relative">
                <input
                  id="pc-val"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  placeholder="20"
                  value={form.discountValue}
                  onChange={set("discountValue")}
                  className={`${inputCls} ${border(errors.discountValue)} pr-9`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-semibold text-slate-400">
                  {isPct ? "%" : "₦"}
                </span>
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Starts" id="pc-start" error={errors.startsAt}>
                <input
                  id="pc-start"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={set("startsAt")}
                  className={`${inputCls} ${border(errors.startsAt)}`}
                />
              </Field>
              <Field label="Ends" id="pc-end" error={errors.endsAt}>
                <input
                  id="pc-end"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={set("endsAt")}
                  className={`${inputCls} ${border(errors.endsAt)}`}
                />
              </Field>
            </div>

            <Field
              label="Description"
              id="pc-desc"
              error={errors.description}
              hint="Times are in your local time and sent to the API as UTC."
            >
              <textarea
                id="pc-desc"
                maxLength={140}
                value={form.description}
                onChange={set("description")}
                placeholder="Launch week offer for new subscribers"
                className={`${inputCls} ${border(errors.description)} min-h-[76px] resize-y`}
              />
            </Field>

            <div className="mt-2 flex justify-end gap-3">
              <button type="button" className={btn} onClick={reset}>
                {editing ? "Cancel" : "Clear"}
              </button>
              <button className={btnPri} disabled={saving}>
                {saving ? "Saving…" : editing ? "Save changes" : "Create coupon"}
              </button>
            </div>
          </form>

          <div className="lg:sticky lg:top-5">
            <h3 className="mb-2.5 text-lg font-bold">Live preview</h3>
            <div
              className="grid min-h-[210px] grid-cols-[1fr_92px] rounded-2xl bg-amber-400 text-amber-950"
              style={{ WebkitMask: notch, mask: notch }}
            >
              <div className="flex flex-col gap-1.5 p-5">
                <div className="text-4xl font-extrabold leading-none tracking-tight sm:text-5xl">
                  {discText(form.discountType, form.discountValue)}
                </div>
                <div className="mt-1 self-start break-all rounded-lg border-2 border-dashed border-current px-3 py-1.5 text-xl font-bold tracking-widest">
                  {form.code || "YOURCODE"}
                </div>
                <div className="text-xs font-semibold">
                  {payload.startsAt && payload.endsAt
                    ? `${fmt(payload.startsAt)} to ${fmt(payload.endsAt)}`
                    : "Pick start and end dates"}
                </div>
                <div className="mt-auto text-sm opacity-85">
                  {form.description || "Your description appears here."}
                </div>
              </div>
              <div className="flex items-center justify-center border-l-2 border-dashed border-amber-950/40">
                <span
                  className="text-xs font-bold tracking-[.14em]"
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                >
                  PROMO CODE
                </span>
              </div>
            </div>

            <div className="mb-2.5 mt-6 flex items-center justify-between">
              <h3 className="text-lg font-bold">Request to the API</h3>
              <button type="button" className={btnSm} onClick={copyJson}>
                Copy JSON
              </button>
            </div>
            <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3.5 font-mono text-xs leading-relaxed text-teal-100">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {tab === "list" && (
        <div className={panel}>
          {listError && (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <span>Couldn’t load coupons: {listError}</span>
              <button className={btnSm} onClick={load}>
                Retry
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500">
                  {["Code", "Discount", "Valid", "Status", "Redeemed", ""].map((h) => (
                    <th key={h} className="border-b border-slate-200 px-3 py-2.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Loading coupons…
                    </td>
                  </tr>
                )}
                {!loading && !coupons.length && !listError && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No coupons yet. Create your first one to get started.
                    </td>
                  </tr>
                )}
                {!loading &&
                  coupons.map((c) => {
                    const [label, cls] = getStatus(c);
                    return (
                      <tr
                        key={c._id}
                        className={`border-b border-slate-200 last:border-0 ${c._id === highlight ? "bg-teal-50" : ""}`}
                      >
                        <td className="px-3 py-3.5">
                          <div className="font-bold tracking-wider">{c.code}</div>
                          <div className="text-xs text-slate-500">{c.description}</div>
                        </td>
                        <td className="px-3 py-3.5">{discText(c.discountType, c.discountValue)}</td>
                        <td className="px-3 py-3.5 text-slate-500">
                          {fmt(c.startsAt)} to {fmt(c.endsAt)}
                        </td>
                        <td className="px-3 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}
                          >
                            {label}
                          </span>
                        </td>
                        <td className="px-3 py-3.5">{c.redemptionCount ?? 0}</td>
                        <td className="px-3 py-3.5">
                          <div className="flex justify-end gap-1.5">
                            <button className={btnSm} onClick={() => openRedemptions(c)}>
                              Redemptions
                            </button>
                            <button className={btnSm} onClick={() => startEdit(c)}>
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {dlg && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4"
          onClick={() => setDlg(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[80vh] w-full max-w-md overflow-auto rounded-2xl border border-slate-200 bg-white p-6"
          >
            <h2 className="mb-3 text-lg font-bold">Redemptions for {dlg.coupon.code}</h2>
            {dlg.loading && <div className="py-6 text-center text-slate-500">Loading…</div>}
            {dlg.error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{dlg.error}</div>
            )}
            {!dlg.loading && !dlg.error && !dlg.rows.length && (
              <div className="py-6 text-center text-slate-500">
                Nobody has redeemed this code yet.
              </div>
            )}
            {dlg.rows.map((r, i) => (
              <div
                key={r._id || i}
                className="flex justify-between gap-3 border-t border-slate-200 py-2 text-sm"
              >
                {/* Field names aren't documented: adjust to the real redemption response. */}
                <span>
                  {r.userId ||
                    (r.user && (r.user.email || r.user._id)) ||
                    r.email ||
                    r.user ||
                    r._id}
                </span>
                <span className="text-slate-500">{fmt(r.redeemedAt || r.createdAt)}</span>
              </div>
            ))}
            <div className="mt-4 flex justify-end">
              <button className={btn} onClick={() => setDlg(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        role="status"
        className={`pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 motion-reduce:transition-none ${toast ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}
      >
        {toast}
      </div>
    </div>
  );
}

function Field({ label, id, error, hint, children }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
