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
 * VITE_SUBSCRIPTION_API_BASE_URL already ends in /api/v1, so COUPONS_PATH starts at /promo/coupons.
 *
 *   GET    /                    list coupons
 *   POST   /                    create coupon (optional: campaign, beneficiaryEntity)
 *   POST   /bulk                create many: { coupons: [ ... ] }
 *   PATCH  /{_id}               update description, discountValue, startsAt, endsAt, campaign, beneficiaryEntity
 *   GET    /{_id}/redemptions   redemption history
 *
 * Coupon cards are drawn as SVG, so the on-screen card, the printout and the PNG download are identical.
 * To save a PDF, use Print and choose "Save as PDF" as the printer.
 */

const DAY = 864e5;
const pad = (n) => String(n).padStart(2, "0");
const toLocal = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "";
const discText = (type, v) =>
  type === "PERCENTAGE" ? `${v || 0}% off` : `₦${Number(v || 0).toLocaleString()} off`;
// Used (redeemed at least once) wins over the dates; otherwise Scheduled / Active / Expired by validity.
const statusOf = (c) => {
  if (c.redemptionCount > 0) return "Used";
  const n = Date.now();
  if (n < new Date(c.startsAt)) return "Scheduled";
  if (n > new Date(c.endsAt)) return "Expired";
  return "Active";
};
const emptyForm = () => {
  const s = new Date();
  s.setHours(0, 0, 0, 0);
  const e = new Date(s.getTime() + 30 * DAY);
  e.setHours(23, 59, 59, 0);
  return {
    code: "", discountType: "PERCENTAGE", discountValue: "", startsAt: toLocal(s), endsAt: toLocal(e),
    description: "", campaign: "", beneficiaryEntity: "",
  };
};
const emptyBulk = () => ({ prefix: "", quantity: "10", length: "16" });
const emptyFilters = () => ({
  code: "", type: "", value: "", startsFrom: "", endsTo: "",
  campaign: "", beneficiary: "", description: "", status: "", redeemed: "",
});
const PAGE_SIZE = 25;
const MASK = "********";
const fmtDT = (iso) =>
  iso ? new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
const has = (v, q) => String(v == null ? "" : v).toLowerCase().includes(q.trim().toLowerCase());
const STATUS_CHIP = {
  Active: "bg-teal-100 text-teal-800",
  Scheduled: "bg-amber-100 text-amber-800",
  Used: "bg-sky-100 text-sky-800",
  Expired: "bg-red-100 text-red-700",
};
const ICON = {
  eye: ["M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z", "M9 12a3 3 0 106 0 3 3 0 00-6 0"],
  eyeOff: ["M3 3l18 18", "M10.6 6.1A10 10 0 0112 6c6.5 0 10 6 10 6a17 17 0 01-3.2 3.9", "M6.6 6.7C3.9 8.5 2 12 2 12s3.5 6 10 6c1.7 0 3.2-.4 4.5-1", "M9.9 9.9a3 3 0 004.2 4.2"],
  ticket: ["M4 6h16a1 1 0 011 1v3a2 2 0 000 4v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3a2 2 0 000-4V7a1 1 0 011-1z", "M14 7v2M14 11v2M14 15v2"],
  user: ["M9 8a3 3 0 106 0 3 3 0 00-6 0", "M4 20c0-3.3 3.6-5 8-5s8 1.7 8 5"],
  edit: ["M4 20h4L19 9l-4-4L4 16v4z", "M13.5 6.5l4 4"],
  print: ["M7 9V4h10v5", "M7 17H5a1 1 0 01-1-1v-5a2 2 0 012-2h12a2 2 0 012 2v5a1 1 0 01-1 1h-2", "M7 14h10v6H7z"],
};
const filterCls =
  "w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-normal text-slate-700 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600/40";

const COUPONS_PATH = "/promo/coupons"; // your base URL already ends in /api/v1
const api = {
  list: () => api_subscription.get(`${COUPONS_PATH}/`),
  create: (p) => api_subscription.post(`${COUPONS_PATH}/`, p),
  bulk: (p) => api_subscription.post(`${COUPONS_PATH}/bulk`, p),
  update: (id, p) => api_subscription.patch(`${COUPONS_PATH}/${id}`, p),
  redemptions: (id) => api_subscription.get(`${COUPONS_PATH}/${id}/redemptions`),
};
const errMsg = (e) => {
  const m = e && e.response && e.response.data && e.response.data.message;
  if (typeof m === "string" && m) return m;
  if (Array.isArray(m) && m.length) return m.join(", ");
  return (e && e.message) || "Something went wrong";
};

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

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid mix-ups
const randChar = () => ALPHA[crypto.getRandomValues(new Uint32Array(1))[0] % ALPHA.length];

/* ---------- Coupon card (SVG) ---------- */
const CARD_W = 780;
const CARD_H = 340;
const CARD_BG = { Active: "#FBBF24", Scheduled: "#FDE68A", Used: "#A7F3D0", Expired: "#CBD5E1" };
const xmlEsc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

function wrapText(text, max, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const out = [];
  let cur = "";
  for (let w of words) {
    if (w.length > max) w = w.slice(0, max - 1) + "…";
    if (cur && (cur + " " + w).length > max) { out.push(cur); cur = w; }
    else cur = cur ? cur + " " + w : w;
  }
  if (cur) out.push(cur);
  if (out.length > maxLines) {
    out.length = maxLines;
    out[maxLines - 1] = out[maxLines - 1].slice(0, max - 1) + "…";
  }
  return out;
}

// card: { code, discountType, discountValue, startsAt, endsAt, description, campaign, beneficiaryEntity, status?, redemptionCount? }
function couponSvg(card) {
  const code = card.code || "YOURCODE";
  const bg = CARD_BG[card.status] || CARD_BG.Active;
  const boxW = Math.min(560, code.length * 21 + 44);
  const dates = card.startsAt && card.endsAt ? `${fmt(card.startsAt)} to ${fmt(card.endsAt)}` : "Pick start and end dates";
  const desc = wrapText(card.description || "Your description appears here.", 56, 2);
  const label = (card.campaign || "Promo code").toUpperCase().slice(0, 44);
  const meta = [
    card.beneficiaryEntity && `Beneficiary: ${card.beneficiaryEntity}`,
    card.status,
  ].filter(Boolean).join("  ·  ").slice(0, 90);
  const SX = CARD_W - 110;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}" font-family="Helvetica, Arial, sans-serif">
<defs><mask id="m"><rect width="${CARD_W}" height="${CARD_H}" fill="#fff"/><circle cx="${SX}" cy="0" r="14" fill="#000"/><circle cx="${SX}" cy="${CARD_H}" r="14" fill="#000"/></mask></defs>
<g mask="url(#m)"><rect width="${CARD_W}" height="${CARD_H}" rx="24" fill="${bg}"/></g>
<g fill="#2B1D00">
<text x="36" y="48" font-size="14" font-weight="700" letter-spacing="2.5" opacity=".75">${xmlEsc(label)}</text>
<text x="34" y="122" font-size="62" font-weight="800" letter-spacing="-1.5">${xmlEsc(discText(card.discountType, card.discountValue))}</text>
<rect x="36" y="142" width="${boxW}" height="48" rx="10" fill="none" stroke="#2B1D00" stroke-width="2.5" stroke-dasharray="7 5"/>
<text x="${36 + boxW / 2}" y="175" text-anchor="middle" font-size="26" font-weight="700" letter-spacing="4">${xmlEsc(code)}</text>
<text x="36" y="226" font-size="16" font-weight="700">Valid: ${xmlEsc(dates)}</text>
${desc.map((l, i) => `<text x="36" y="${254 + i * 22}" font-size="16" opacity=".9">${xmlEsc(l)}</text>`).join("\n")}
<text x="36" y="${CARD_H - 26}" font-size="13.5" opacity=".8">${xmlEsc(meta)}</text>
<line x1="${SX}" y1="24" x2="${SX}" y2="${CARD_H - 24}" stroke="#2B1D00" stroke-width="2" stroke-dasharray="6 6" opacity=".4"/>
<text transform="translate(${SX + 56} ${CARD_H / 2}) rotate(-90)" text-anchor="middle" font-size="15" font-weight="700" letter-spacing="5">PROMO CODE</text>
</g></svg>`;
}
const svgUri = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
const cardUri = (card) => svgUri(couponSvg(card));

function downloadPng(card, scale = 3) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = CARD_W * scale;
      c.height = CARD_H * scale;
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((blob) => {
        if (!blob) return reject(new Error("Couldn’t create the image"));
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `coupon-${card.code || "promo"}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        resolve();
      }, "image/png");
    };
    img.onerror = () => reject(new Error("Couldn’t draw the card"));
    img.src = cardUri(card);
  });
}

function printCards(cards) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Promo coupons</title><style>
@page{margin:12mm}
body{margin:0}
.c{break-inside:avoid;page-break-inside:avoid;margin:0 0 8mm}
img{display:block;width:170mm;max-width:100%;height:auto}
</style></head><body>${cards.map((c) => `<div class="c"><img src="${cardUri(c)}" alt=""></div>`).join("")}</body></html>`;
  const f = document.createElement("iframe");
  f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(f);
  const w = f.contentWindow;
  const d = w.document;
  d.open();
  d.write(html);
  d.close();
  w.onafterprint = () => f.remove();
  setTimeout(() => f.remove(), 120000);
  Promise.all([...d.images].map((i) => (i.decode ? i.decode().catch(() => {}) : Promise.resolve()))).then(() => {
    w.focus();
    w.print();
  });
}

/* ---------- Styles ---------- */
const inputCls =
  "w-full rounded-lg border bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/30 disabled:cursor-not-allowed disabled:opacity-60";
const border = (bad) => (bad ? "border-red-500" : "border-slate-200");
const panel = "rounded-2xl border border-slate-200 bg-white p-6";
const cardBox = "rounded-2xl border border-slate-200 bg-white p-4";
const btn =
  "whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:opacity-60";
const btnPri =
  "whitespace-nowrap rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60";
const btnSm = "whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:cursor-not-allowed disabled:opacity-50";

export default function PromoCode() {
  const [tab, setTab] = useState("create"); // create | bulk | list
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [bulk, setBulk] = useState(emptyBulk);
  const [bulkCodes, setBulkCodes] = useState([]);
  const [errors, setErrors] = useState({});
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [highlight, setHighlight] = useState(null);
  const [dlg, setDlg] = useState(null);
  const [filters, setFilters] = useState(emptyFilters);
  const [selected, setSelected] = useState(() => new Set());
  const [hideMode, setHideMode] = useState(false);
  const [overrides, setOverrides] = useState({});
  const [page, setPage] = useState(0);
  const [preview, setPreview] = useState(null);
  const timer = useRef();
  const bulkMode = tab === "bulk";

  const notify = (m) => {
    setToast(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 3200);
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

  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => {
    const v = k === "code" ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };
  const setB = (k) => (e) => {
    const v = k === "prefix" ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") : e.target.value;
    setBulk((b) => ({ ...b, [k]: v }));
  };

  const fields = useMemo(() => ({
    discountValue: Number(form.discountValue) || 0,
    startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : "",
    endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : "",
    description: form.description.trim(),
  }), [form.discountValue, form.startsAt, form.endsAt, form.description]);

  // Optional fields are only sent when filled in.
  const extras = useMemo(() => {
    const x = {};
    if (form.campaign.trim()) x.campaign = form.campaign.trim();
    if (form.beneficiaryEntity.trim()) x.beneficiaryEntity = form.beneficiaryEntity.trim();
    return x;
  }, [form.campaign, form.beneficiaryEntity]);

  const payload = useMemo(() => {
    if (editing)
      return { description: fields.description, discountValue: fields.discountValue, startsAt: fields.startsAt, endsAt: fields.endsAt, ...extras };
    if (bulkMode)
      return { coupons: bulkCodes.map((code) => ({ code, discountType: form.discountType, ...fields, ...extras })) };
    return { code: form.code.trim(), discountType: form.discountType, ...fields, ...extras };
  }, [editing, bulkMode, bulkCodes, form.code, form.discountType, fields, extras]);

  const previewCard = useMemo(() => ({
    code: bulkMode ? bulkCodes[0] || "" : form.code,
    discountType: form.discountType,
    discountValue: form.discountValue,
    startsAt: fields.startsAt,
    endsAt: fields.endsAt,
    description: form.description.trim(),
    campaign: form.campaign.trim(),
    beneficiaryEntity: form.beneficiaryEntity.trim(),
  }), [bulkMode, bulkCodes, form, fields]);
  const previewUri = useMemo(() => cardUri(previewCard), [previewCard]);

  const validate = () => {
    const e = {};
    const v = Number(form.discountValue);
    if (!editing && !bulkMode && !/^[A-Z0-9]{4,20}$/.test(form.code)) e.code = "Use 4–20 letters or numbers, no spaces.";
    if (bulkMode && !bulkCodes.length) e.bulk = "Generate the codes first.";
    if (!(v > 0)) e.discountValue = "Enter a number greater than 0.";
    else if (form.discountType === "PERCENTAGE" && v > 100) e.discountValue = "A percentage can’t be more than 100.";
    if (!form.startsAt) e.startsAt = "Choose a start date.";
    if (!form.endsAt || (form.startsAt && new Date(form.endsAt) <= new Date(form.startsAt)))
      e.endsAt = "Choose an end date after the start.";
    if (!form.description.trim()) e.description = "Add a short description.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const reset = () => { setEditing(null); setForm(emptyForm()); setBulk(emptyBulk()); setBulkCodes([]); setErrors({}); };

  const goTab = (t) => {
    if (t === "bulk" && editing) reset();
    setErrors({});
    setTab(t);
  };

  const generateBulk = () => {
    const qty = Number(bulk.quantity);
    const len = Number(bulk.length);
    const e = {};
    if (!(Number.isInteger(qty) && qty >= 1 && qty <= 100)) e.quantity = "Choose 1 to 100.";
    if (!(Number.isInteger(len) && len >= 4 && len <= 20)) e.length = "Use 4 to 20.";
    else if (bulk.prefix.length > len - 4) e.prefix = `Max ${len - 4} characters for this length.`;
    setErrors(e);
    if (Object.keys(e).length) return;
    const codes = new Set();
    while (codes.size < qty) {
      let c = bulk.prefix;
      while (c.length < len) c += randChar();
      codes.add(c);
    }
    setBulkCodes([...codes]);
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
      } else if (bulkMode) {
        await api.bulk(payload);
        notify(`${bulkCodes.length} coupons created`);
        setHighlight(null);
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
      code: c.code, discountType: c.discountType, discountValue: String(c.discountValue),
      startsAt: toLocal(c.startsAt), endsAt: toLocal(c.endsAt), description: c.description || "",
      campaign: c.campaign || "", beneficiaryEntity: c.beneficiaryEntity || "",
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
    setForm((f) => ({ ...f, code: Array.from({ length: 16 }, randChar).join("") }));
    setErrors((e) => ({ ...e, code: undefined }));
  };

  const copyJson = () =>
    navigator.clipboard
      ? navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(() => notify("JSON copied"))
      : notify("Copy isn’t available here");

  const doPng = async (card) => {
    try { await downloadPng(card); } catch (e) { notify(errMsg(e)); }
  };
  const doPrint = (cards) => {
    try { printCards(cards); } catch (e) { notify("Couldn’t open the print view"); }
  };
  const listCard = (c) => ({ ...c, status: statusOf(c) });

  /* ----- All coupons table: filters, hide/show, selection ----- */
  const setF = (k) => (e) => { setFilters((f) => ({ ...f, [k]: e.target.value })); setPage(0); };
  const setStatusFilter = (v) => { setFilters((f) => ({ ...f, status: v })); setPage(0); };
  const hasFilters = Object.values(filters).some(Boolean);
  const counts = useMemo(() => {
    const n = { Active: 0, Scheduled: 0, Used: 0, Expired: 0 };
    coupons.forEach((c) => { n[statusOf(c)] += 1; });
    return n;
  }, [coupons]);
  const filtered = useMemo(() => coupons.filter((c) => {
    const f = filters;
    if (f.code && !has(c.code, f.code)) return false;
    if (f.type && c.discountType !== f.type) return false;
    if (f.value && !has(c.discountValue, f.value)) return false;
    if (f.startsFrom && new Date(c.startsAt) < new Date(`${f.startsFrom}T00:00:00`)) return false;
    if (f.endsTo && new Date(c.endsAt) > new Date(`${f.endsTo}T23:59:59`)) return false;
    if (f.campaign && !has(c.campaign, f.campaign)) return false;
    if (f.beneficiary && !has(c.beneficiaryEntity, f.beneficiary)) return false;
    if (f.description && !has(c.description, f.description)) return false;
    if (f.status && statusOf(c) !== f.status) return false;
    if (f.redeemed === "yes" && !(c.redemptionCount > 0)) return false;
    if (f.redeemed === "no" && c.redemptionCount > 0) return false;
    return true;
  }), [coupons, filters]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const curPage = Math.min(page, pages - 1);
  const rows = filtered.slice(curPage * PAGE_SIZE, (curPage + 1) * PAGE_SIZE);

  // A code is hidden when the global toggle is on, unless that row was individually shown (or the reverse).
  const isHidden = (c) => (overrides[c._id] !== undefined ? overrides[c._id] : hideMode);
  const toggleHideAll = () => { setHideMode((h) => !h); setOverrides({}); };
  const toggleRow = (c) => setOverrides((o) => ({ ...o, [c._id]: !isHidden(c) }));

  const allSelected = filtered.length > 0 && filtered.every((c) => selected.has(c._id));
  const toggleSel = (id) => setSelected((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const toggleAllSel = () => setSelected(allSelected ? new Set() : new Set(filtered.map((c) => c._id)));
  const selectedCards = coupons.filter((c) => selected.has(c._id)).map(listCard);

  const previewHidden = preview ? isHidden(preview) : false;
  const previewShown = preview ? { ...listCard(preview), ...(previewHidden ? { code: MASK } : {}) } : null;

  const isPct = form.discountType === "PERCENTAGE";
  const tabCls = (on) =>
    `rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
      on ? "bg-teal-700 text-white" : "text-slate-500"
    }`;
  const showForm = tab === "create" || tab === "bulk";

  return (
    <div className="text-slate-900">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Promo codes</h1>
          <p className="mt-1 text-sm text-slate-500">Create codes subscribers can redeem in the app.</p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1" role="tablist">
          <button role="tab" aria-selected={tab === "create"} className={tabCls(tab === "create")} onClick={() => goTab("create")}>
            {editing ? "Edit coupon" : "Create coupon"}
          </button>
          <button role="tab" aria-selected={bulkMode} className={tabCls(bulkMode)} onClick={() => goTab("bulk")}>
            Bulk create
          </button>
          <button role="tab" aria-selected={tab === "list"} className={tabCls(tab === "list")} onClick={() => goTab("list")}>
            All coupons ({coupons.length})
          </button>
        </div>
      </div>

      {showForm && (
        <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_1fr]">
          <form className={panel} onSubmit={submit} noValidate>
            <h2 className="mb-4 text-lg font-bold">
              {editing ? `Edit ${editing.code}` : bulkMode ? "Bulk create coupons" : "New coupon"}
            </h2>

            {bulkMode ? (
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-x-4 sm:grid-cols-3">
                  <Field label="Prefix (optional)" id="pc-prefix" error={errors.prefix}>
                    <input id="pc-prefix" value={bulk.prefix} onChange={setB("prefix")} maxLength={16} placeholder="BULK"
                      autoComplete="off" className={`${inputCls} ${border(errors.prefix)} font-bold tracking-wider`} />
                  </Field>
                  <Field label="How many" id="pc-qty" error={errors.quantity}>
                    <input id="pc-qty" type="number" min="1" max="100" value={bulk.quantity} onChange={setB("quantity")}
                      className={`${inputCls} ${border(errors.quantity)}`} />
                  </Field>
                  <Field label="Code length" id="pc-len" error={errors.length}>
                    <input id="pc-len" type="number" min="4" max="20" value={bulk.length} onChange={setB("length")}
                      className={`${inputCls} ${border(errors.length)}`} />
                  </Field>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    {bulkCodes.length ? `${bulkCodes.length} codes ready, for example ${bulkCodes[0]}` : "No codes generated yet."}
                  </p>
                  <button type="button" className={btn} onClick={generateBulk}>
                    {bulkCodes.length ? "Regenerate" : "Generate codes"}
                  </button>
                </div>
                {errors.bulk && <p className="mt-2 text-xs text-red-600">{errors.bulk}</p>}
              </div>
            ) : (
              <Field label="Coupon code" id="pc-code" error={errors.code}>
                <div className="flex gap-2">
                  <input id="pc-code" value={form.code} onChange={set("code")} maxLength={20} disabled={!!editing}
                    placeholder="SAVE20" autoComplete="off"
                    className={`${inputCls} ${border(errors.code)} font-bold tracking-wider`} />
                  {!editing && <button type="button" className={btn} onClick={generate}>Generate</button>}
                </div>
              </Field>
            )}

            <div className="mb-4">
              <span className="mb-1.5 block text-sm font-semibold">Discount type</span>
              <div className="grid grid-cols-2 gap-3">
                {[["PERCENTAGE", "Percentage", "Take a % off the price"], ["AMOUNT", "Fixed amount", "Take a set ₦ amount off"]].map(
                  ([val, name, sub]) => (
                    <label key={val} className="relative cursor-pointer">
                      <input type="radio" name="pc-type" value={val} className="peer sr-only"
                        checked={form.discountType === val} disabled={!!editing} onChange={set("discountType")} />
                      <div className="rounded-xl border-2 border-slate-200 p-3 text-sm font-semibold peer-checked:border-teal-600 peer-checked:bg-teal-50 peer-focus-visible:ring-2 peer-focus-visible:ring-teal-600 peer-disabled:cursor-not-allowed peer-disabled:opacity-60">
                        {name}
                        <span className="block text-xs font-normal text-slate-500">{sub}</span>
                      </div>
                    </label>
                  )
                )}
              </div>
            </div>

            <Field label="Discount value" id="pc-val" error={errors.discountValue}
              hint={isPct ? "Enter 100 to make the subscription free." : "Fixed amount in naira, taken off the plan price."}>
              <div className="relative">
                <input id="pc-val" type="number" min="0" step="any" inputMode="decimal" placeholder="20"
                  value={form.discountValue} onChange={set("discountValue")}
                  className={`${inputCls} ${border(errors.discountValue)} pr-9`} />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-semibold text-slate-400">
                  {isPct ? "%" : "₦"}
                </span>
              </div>
            </Field>

            <div className="grid gap-x-4 sm:grid-cols-2">
              <Field label="Starts" id="pc-start" error={errors.startsAt}>
                <input id="pc-start" type="datetime-local" value={form.startsAt} onChange={set("startsAt")}
                  className={`${inputCls} ${border(errors.startsAt)}`} />
              </Field>
              <Field label="Ends" id="pc-end" error={errors.endsAt}>
                <input id="pc-end" type="datetime-local" value={form.endsAt} onChange={set("endsAt")}
                  className={`${inputCls} ${border(errors.endsAt)}`} />
              </Field>
            </div>

            <div className="grid gap-x-4 sm:grid-cols-2">
              <Field label="Campaign (optional)" id="pc-camp">
                <input id="pc-camp" value={form.campaign} onChange={set("campaign")} maxLength={80}
                  placeholder="Diwali Campaign 2026" className={`${inputCls} ${border(false)}`} />
              </Field>
              <Field label="Beneficiary (optional)" id="pc-ben">
                <input id="pc-ben" value={form.beneficiaryEntity} onChange={set("beneficiaryEntity")} maxLength={80}
                  placeholder="Partner organization" className={`${inputCls} ${border(false)}`} />
              </Field>
            </div>

            <Field label="Description" id="pc-desc" error={errors.description}
              hint="Times are in your local time and sent to the API as UTC.">
              <textarea id="pc-desc" maxLength={140} value={form.description} onChange={set("description")}
                placeholder="Launch week offer for new subscribers"
                className={`${inputCls} ${border(errors.description)} min-h-[76px] resize-y`} />
            </Field>

            <div className="mt-2 flex justify-end gap-3">
              <button type="button" className={btn} onClick={reset}>{editing ? "Cancel" : "Clear"}</button>
              <button className={btnPri} disabled={saving}>
                {saving ? "Saving…" : editing ? "Save changes" : bulkMode ? (bulkCodes.length ? `Create ${bulkCodes.length} coupons` : "Create coupons") : "Create coupon"}
              </button>
            </div>
          </form>

          <div className="lg:sticky lg:top-5">
            <h3 className="mb-2.5 text-lg font-bold">Live preview</h3>
            <img src={previewUri} alt={`Coupon card for ${previewCard.code || "your code"}`} className="block h-auto w-full drop-shadow-md" />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={btn} onClick={() => doPrint([previewCard])}>Print card</button>
              <button type="button" className={btn} onClick={() => doPng(previewCard)}>Download PNG</button>
              {bulkMode && bulkCodes.length > 1 && (
                <button type="button" className={btn} onClick={() => doPrint(bulkCodes.map((code) => ({ ...previewCard, code })))}>
                  Print all {bulkCodes.length}
                </button>
              )}
            </div>

            <div className="mb-2.5 mt-6 flex items-center justify-between">
              <h3 className="text-lg font-bold">Request to the API</h3>
              <button type="button" className={btnSm} onClick={copyJson}>Copy JSON</button>
            </div>
            <pre className="max-h-80 overflow-auto rounded-xl bg-slate-900 p-3.5 font-mono text-xs leading-relaxed text-teal-100">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {tab === "list" && (
        <div>
          {listError && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <span>Couldn’t load coupons: {listError}</span>
              <button className={btnSm} onClick={load}>Retry</button>
            </div>
          )}

          <div className={cardBox}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {[["", "All", coupons.length], ["Active", "Active", counts.Active], ["Scheduled", "Scheduled", counts.Scheduled], ["Used", "Used", counts.Used], ["Expired", "Expired", counts.Expired]].map(
                  ([val, label, n]) => (
                    <button key={label} type="button" aria-pressed={filters.status === val} onClick={() => setStatusFilter(val)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
                        filters.status === val ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}>
                      {label} <span className="opacity-70">{n}</span>
                    </button>
                  )
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className={`${btnSm} inline-flex items-center gap-1.5`} onClick={toggleHideAll}>
                  <Icon d={hideMode ? ICON.eyeOff : ICON.eye} size={15} />
                  {hideMode ? "Show codes" : "Hide codes"}
                </button>
                <button className={`${btnSm} inline-flex items-center gap-1.5`} disabled={!selected.size} onClick={() => doPrint(selectedCards)}>
                  <Icon d={ICON.print} size={15} /> Print selected ({selected.size})
                </button>
                <button className={`${btnSm} inline-flex items-center gap-1.5`} disabled={!filtered.length} onClick={() => doPrint(filtered.map(listCard))}>
                  <Icon d={ICON.print} size={15} /> Print filtered ({filtered.length})
                </button>
                <button className={`${btnSm} inline-flex items-center gap-1.5`} disabled={!coupons.length} onClick={() => doPrint(coupons.map(listCard))}>
                  <Icon d={ICON.print} size={15} /> Print all ({coupons.length})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1500px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-500">
                    <th className="w-10 px-3 py-2.5">
                      <input type="checkbox" className="h-4 w-4 accent-teal-700" checked={allSelected} onChange={toggleAllSel}
                        aria-label="Select all filtered coupons" title="Select all filtered coupons" />
                    </th>
                    {["Code", "Type", "Value", "Starts", "Ends", "Campaign", "Beneficiary", "Description", "Status", "Redeemed", "Actions"].map((h) => (
                      <th key={h} className="px-3 py-2.5">{h}</th>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-200 align-top">
                    <th className="px-3 pb-3" />
                    <th className="px-3 pb-3"><input className={filterCls} placeholder="Filter code" value={filters.code} onChange={setF("code")} aria-label="Filter by code" /></th>
                    <th className="px-3 pb-3">
                      <select className={filterCls} value={filters.type} onChange={setF("type")} aria-label="Filter by type">
                        <option value="">All</option><option value="PERCENTAGE">Percentage</option><option value="AMOUNT">Amount</option>
                      </select>
                    </th>
                    <th className="px-3 pb-3"><input className={filterCls} placeholder="e.g. 20" value={filters.value} onChange={setF("value")} aria-label="Filter by value" /></th>
                    <th className="px-3 pb-3"><input type="date" className={filterCls} value={filters.startsFrom} onChange={setF("startsFrom")} title="Starts on or after" aria-label="Starts on or after" /></th>
                    <th className="px-3 pb-3"><input type="date" className={filterCls} value={filters.endsTo} onChange={setF("endsTo")} title="Ends on or before" aria-label="Ends on or before" /></th>
                    <th className="px-3 pb-3"><input className={filterCls} placeholder="Filter campaign" value={filters.campaign} onChange={setF("campaign")} aria-label="Filter by campaign" /></th>
                    <th className="px-3 pb-3"><input className={filterCls} placeholder="Filter beneficiary" value={filters.beneficiary} onChange={setF("beneficiary")} aria-label="Filter by beneficiary" /></th>
                    <th className="px-3 pb-3"><input className={filterCls} placeholder="Filter description" value={filters.description} onChange={setF("description")} aria-label="Filter by description" /></th>
                    <th className="px-3 pb-3">
                      <select className={filterCls} value={filters.status} onChange={setF("status")} aria-label="Filter by status">
                        <option value="">All</option><option value="Active">Active</option><option value="Scheduled">Scheduled</option><option value="Used">Used</option><option value="Expired">Expired</option>
                      </select>
                    </th>
                    <th className="px-3 pb-3">
                      <select className={filterCls} value={filters.redeemed} onChange={setF("redeemed")} aria-label="Filter by redemptions">
                        <option value="">Any</option><option value="yes">Redeemed</option><option value="no">Not redeemed</option>
                      </select>
                    </th>
                    <th className="px-3 pb-3">
                      {hasFilters && (
                        <button type="button" className={btnSm} onClick={() => { setFilters(emptyFilters()); setPage(0); }}>Clear filters</button>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={12} className="py-10 text-center text-slate-500">Loading coupons…</td></tr>}
                  {!loading && !coupons.length && !listError && (
                    <tr><td colSpan={12} className="py-10 text-center text-slate-500">No coupons yet. Create your first one to get started.</td></tr>
                  )}
                  {!loading && !!coupons.length && !filtered.length && (
                    <tr><td colSpan={12} className="py-10 text-center text-slate-500">No coupons match these filters.</td></tr>
                  )}
                  {!loading && rows.map((c) => {
                    const st = statusOf(c);
                    const hidden = isHidden(c);
                    return (
                      <tr key={c._id}
                        className={`border-b border-slate-200 last:border-0 ${c._id === highlight ? "bg-teal-50" : (st === "Expired" || st === "Used") ? "bg-slate-50/70 text-slate-500" : ""}`}>
                        <td className="px-3 py-3">
                          <input type="checkbox" className="h-4 w-4 accent-teal-700" checked={selected.has(c._id)} onChange={() => toggleSel(c._id)}
                            aria-label={`Select coupon ${hidden ? "row" : c.code}`} />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold tracking-wider">{hidden ? MASK : c.code}</span>
                            <button type="button" onClick={() => toggleRow(c)} title={hidden ? "Show code" : "Hide code"}
                              aria-label={hidden ? "Show code" : "Hide code"}
                              className="rounded p-0.5 text-slate-400 hover:text-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
                              <Icon d={hidden ? ICON.eyeOff : ICON.eye} size={16} />
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-3">{c.discountType === "PERCENTAGE" ? "Percentage" : "Amount"}</td>
                        <td className="px-3 py-3 font-semibold">{c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : `₦${Number(c.discountValue).toLocaleString()}`}</td>
                        <td className="whitespace-nowrap px-3 py-3">{fmtDT(c.startsAt)}</td>
                        <td className="whitespace-nowrap px-3 py-3">{fmtDT(c.endsAt)}</td>
                        <td className="px-3 py-3">{c.campaign || <span className="text-slate-300">-</span>}</td>
                        <td className="px-3 py-3">{c.beneficiaryEntity || <span className="text-slate-300">-</span>}</td>
                        <td className="max-w-[220px] truncate px-3 py-3" title={c.description}>{c.description}</td>
                        <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CHIP[st]}`}>{st}</span></td>
                        <td className="px-3 py-3">{c.redemptionCount == null ? 0 : c.redemptionCount}</td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1.5">
                            <IconBtn label="Show card preview" onClick={() => setPreview(c)}><Icon d={ICON.ticket} /></IconBtn>
                            <IconBtn label="View redemptions" onClick={() => openRedemptions(c)}><Icon d={ICON.user} /></IconBtn>
                            <IconBtn label="Edit coupon" onClick={() => startEdit(c)}><Icon d={ICON.edit} /></IconBtn>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span>
                {filtered.length
                  ? `Showing ${curPage * PAGE_SIZE + 1} to ${Math.min((curPage + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length}`
                  : "Nothing to show"}
                {" · "}Printed cards always show the real codes.
              </span>
              <div className="flex items-center gap-2">
                <button className={btnSm} disabled={curPage === 0} onClick={() => setPage(curPage - 1)}>Previous</button>
                <span>Page {curPage + 1} of {pages}</span>
                <button className={btnSm} disabled={curPage >= pages - 1} onClick={() => setPage(curPage + 1)}>Next</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {dlg && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4" onClick={() => setDlg(null)}>
          <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}
            className="max-h-[80vh] w-full max-w-md overflow-auto rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-3 text-lg font-bold">Redemptions for {dlg.coupon.code}</h2>
            {dlg.loading && <div className="py-6 text-center text-slate-500">Loading…</div>}
            {dlg.error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{dlg.error}</div>}
            {!dlg.loading && !dlg.error && !dlg.rows.length && <div className="py-6 text-center text-slate-500">Nobody has redeemed this code yet.</div>}
            {dlg.rows.length > 0 && (
              <div className="flex justify-between gap-3 pb-1 text-xs font-semibold text-slate-500">
                <span>External user ID</span>
                <span>Redeemed</span>
              </div>
            )}
            {dlg.rows.map((r, i) => (
              <div key={r._id || r.externalUserId || i} className="flex justify-between gap-3 border-t border-slate-200 py-2 text-sm">
                <span className="break-all font-medium">
                  {r.externalUserId || r.userId || (r.user && (r.user.email || r.user._id)) || r.email || r._id}
                </span>
                <span className="whitespace-nowrap text-slate-500">{fmtDT(r.redeemedAt || r.createdAt)}</span>
              </div>
            ))}
            <div className="mt-4 flex justify-end"><button className={btn} onClick={() => setDlg(null)}>Close</button></div>
          </div>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4" onClick={() => setPreview(null)}>
          <div role="dialog" aria-modal="true" aria-label="Coupon card preview" onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl border border-slate-200 bg-white p-5">
            <img src={cardUri(previewShown)} alt="Coupon card" className="block h-auto w-full drop-shadow-md" />
            {previewHidden && (
              <p className="mt-3 text-sm text-slate-500">
                This code is hidden. Reveal it to print or download the card.{" "}
                <button type="button" className="font-semibold text-teal-700 underline"
                  onClick={() => setOverrides((o) => ({ ...o, [preview._id]: false }))}>Reveal code</button>
              </p>
            )}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button className={btn} disabled={previewHidden} onClick={() => doPrint([listCard(preview)])}>Print card</button>
              <button className={btn} disabled={previewHidden} onClick={() => doPng(listCard(preview))}>Download PNG</button>
              <button className={btn} onClick={() => setPreview(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div role="status"
        className={`pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 motion-reduce:transition-none ${toast ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}>
        {toast}
      </div>
    </div>
  );
}

function Field({ label, id, error, hint, children }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function Icon({ d, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

function IconBtn({ label, onClick, children }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
      {children}
    </button>
  );
}