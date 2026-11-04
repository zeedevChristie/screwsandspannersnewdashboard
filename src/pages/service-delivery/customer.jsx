import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
} from "@mui/x-data-grid";

import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

import {
  Search,
  X,
  RefreshCw,
  Eye,
  CreditCard,
  Award,
  UserX,
  Download,
  ChevronLeft,
  ChevronRight,
  Wallet,
} from "lucide-react";

// SP BADGE (new file: spBadge.jsx, same folder as this file)
import { useSpBadge, SpBadgeToolbar, SpBadgeDialogs, isSP, isBadged } from "./spBadge";

// REPORT (new file: userReport.jsx, same folder as this file)
import UserReport from "./userReport";

// REVENUE (new file: src/lib/revenue.ts)
import { getRevenueSummary, formatNaira } from "@/lib/revenue";

/* =========================================================
   API CONFIGURATION
========================================================= */

const API_URL = "https://meemaw.sands.com.ng/api/v1/admin/all-users";

const API_BASE_URL = "https://meemaw.sands.com.ng";



/* =========================================================
   AUTH TOKEN
========================================================= */

const getAuthToken = () => {
  return (
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    ""
  );
};

/* =========================================================
   USER NAME
========================================================= */

const getUserName = (user) => {
  const firstname = user?.firstname || user?.first_name || user?.firstName || "";

  const lastname = user?.lastname || user?.last_name || user?.lastName || "";

  return `${firstname} ${lastname}`.trim() || "N/A";
};

/* =========================================================
   UNIQUE USER ID
========================================================= */

const getUserId = (user, index) => {
  return String(user?.id || user?.user_id || user?.userId || user?._id || `user-${index}`);
};

/* =========================================================
   DATE FORMAT
========================================================= */

const formatDate = (value) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* =========================================================
   CURRENCY
========================================================= */

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "" || value === "N/A") {
    return "N/A";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return `₦${number.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/* =========================================================
   IMAGE URL
========================================================= */

const getImageUrl = (avatar) => {
  if (!avatar) {
    return null;
  }

  const value = String(avatar).trim();

  if (!value) {
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `${API_BASE_URL}/${value.replace(/^\/+/, "")}`;
};

/* =========================================================
   SUBSCRIPTION
========================================================= */

const getSubscription = (user) => {
  const subscription = user?.subscription;

  if (subscription && typeof subscription === "object" && !Array.isArray(subscription)) {
    return subscription;
  }

  return null;
};

/* =========================================================
   PLAN NAME
========================================================= */

const getPlanName = (subscription) => {
  if (!subscription) {
    return "N/A";
  }

  const plan = subscription?.plan;

  if (typeof plan === "string") {
    return plan;
  }

  if (plan && typeof plan === "object") {
    return (
      plan?.name ||
      plan?.plan_name ||
      plan?.planName ||
      plan?.title ||
      plan?.package_name ||
      plan?.packageName ||
      plan?.type ||
      "N/A"
    );
  }

  return (
    subscription?.plan_name ||
    subscription?.planName ||
    subscription?.package_name ||
    subscription?.packageName ||
    subscription?.package ||
    subscription?.name ||
    subscription?.title ||
    "N/A"
  );
};

/* =========================================================
   TRANSACTION AMOUNT
   REQUIRED:
   amount paid = transaction.amount
========================================================= */

const getTransactionAmount = (transaction) => {
  if (!transaction) {
    return null;
  }

  return (
    transaction?.amount ??
    transaction?.amount_paid ??
    transaction?.amountPaid ??
    transaction?.paid_amount ??
    transaction?.paidAmount ??
    transaction?.total_amount ??
    transaction?.totalAmount ??
    null
  );
};

/* =========================================================
   TRANSACTION DATE
   REQUIRED:
   valid from = transaction date
========================================================= */

const getTransactionDate = (transaction) => {
  if (!transaction) {
    return null;
  }

  return (
    transaction?.created_at ||
    transaction?.createdAt ||
    transaction?.transaction_date ||
    transaction?.transactionDate ||
    transaction?.payment_date ||
    transaction?.paymentDate ||
    transaction?.paid_at ||
    transaction?.paidAt ||
    transaction?.date ||
    null
  );
};

/* =========================================================
   CHECK IF OBJECT LOOKS LIKE TRANSACTION
========================================================= */

const looksLikeTransaction = (object) => {
  if (!object || typeof object !== "object" || Array.isArray(object)) {
    return false;
  }

  const amount = getTransactionAmount(object);

  const date = getTransactionDate(object);

  return amount !== null && amount !== undefined && date !== null && date !== undefined;
};

/* =========================================================
   FIND TRANSACTION
========================================================= */

const findTransaction = (object, depth = 0) => {
  if (!object || typeof object !== "object" || depth > 8) {
    return null;
  }

  /* ---------------------------------------------
     ARRAY
  --------------------------------------------- */

  if (Array.isArray(object)) {
    const transactions = object.filter((item) => looksLikeTransaction(item));

    if (transactions.length > 0) {
      return [...transactions].sort((a, b) => {
        const dateA = new Date(getTransactionDate(a)).getTime();

        const dateB = new Date(getTransactionDate(b)).getTime();

        return dateB - dateA;
      })[0];
    }

    for (const item of object) {
      const found = findTransaction(item, depth + 1);

      if (found) {
        return found;
      }
    }

    return null;
  }

  /* ---------------------------------------------
     DIRECT TRANSACTION OBJECTS
  --------------------------------------------- */

  const directKeys = [
    "transaction",
    "latestTransaction",
    "latest_transaction",
    "payment",
    "latestPayment",
    "latest_payment",
    "transactionInfo",
    "transaction_info",
    "paymentInfo",
    "payment_info",
  ];

  for (const key of directKeys) {
    if (object[key] && typeof object[key] === "object") {
      if (looksLikeTransaction(object[key])) {
        return object[key];
      }

      const found = findTransaction(object[key], depth + 1);

      if (found) {
        return found;
      }
    }
  }

  /* ---------------------------------------------
     TRANSACTION ARRAYS
  --------------------------------------------- */

  const arrayKeys = [
    "transactions",
    "payments",
    "transactionHistory",
    "transaction_history",
    "paymentHistory",
    "payment_history",
    "paymentTransactions",
    "payment_transactions",
  ];

  for (const key of arrayKeys) {
    if (Array.isArray(object[key])) {
      const found = findTransaction(object[key], depth + 1);

      if (found) {
        return found;
      }
    }
  }

  /* ---------------------------------------------
     SEARCH NESTED OBJECTS
  --------------------------------------------- */

  for (const key of Object.keys(object)) {
    const value = object[key];

    if (value && typeof value === "object") {
      const found = findTransaction(value, depth + 1);

      if (found) {
        return found;
      }
    }
  }

  return null;
};

/* =========================================================
   EXPIRY DATE
========================================================= */

const getExpiryDate = (subscription) => {
  if (!subscription) {
    return null;
  }

  return (
    subscription?.expiryDate ||
    subscription?.expiry_date ||
    subscription?.expiresAt ||
    subscription?.expires_at ||
    subscription?.endDate ||
    subscription?.end_date ||
    null
  );
};

/* =========================================================
   SUBSCRIPTION STATUS

   If expiry date has not passed:
   ACTIVE

   If expiry date has passed:
   EXPIRED
========================================================= */

const getSubscriptionStatus = (subscription) => {
  if (!subscription) {
    return "none";
  }

  const expiryDate = getExpiryDate(subscription);

  if (!expiryDate) {
    return Boolean(subscription?.isActive) ? "active" : "expired";
  }

  const expiry = new Date(expiryDate);

  if (Number.isNaN(expiry.getTime())) {
    return Boolean(subscription?.isActive) ? "active" : "expired";
  }

  return expiry.getTime() >= Date.now() ? "active" : "expired";
};

/* =========================================================
   MAP API USER TO DATAGRID ROW
========================================================= */

const getTradeNames = (user) => {
  if (!Array.isArray(user?.trades)) {
    return [];
  }

  return user.trades
    .map((trade) => {
      if (typeof trade === "string") {
        return trade.trim();
      }

      if (!trade || typeof trade !== "object") {
        return "";
      }

      return (
        trade?.name ||
        trade?.trade_name ||
        trade?.tradeName ||
        trade?.title ||
        trade?.label ||
        trade?.value ||
        ""
      );
    })
    .filter(Boolean);
};

/* =========================================================
   ADDRESSES
   The API sends the addresses as an ARRAY (addressInfo).
   This pulls out every address, not only the first one.
========================================================= */

const getAddresses = (user) => {
  const source =
    user?.user_address ??
    user?.addressInfo ??
    user?.address_info ??
    user?.addresses ??
    user?.address;

  const list = Array.isArray(source) ? source : source ? [source] : [];

  return list
    .map((item) => {
      if (typeof item === "string") {
        return {
          address: item.trim(),
          area: "",
          landmark: "",
          state: "",
          lga: "",
          latitude: null,
          longitude: null,
        };
      }

      if (!item || typeof item !== "object") {
        return null;
      }

      return {
        address: String(item?.address || item?.full_address || item?.street || "").trim(),
        area: item?.area || "",
        landmark: item?.landmark || "",
        state: item?.state || "",
        lga: item?.lga || "",
        latitude: item?.latitude ?? item?.lat ?? null,
        longitude: item?.longitude ?? item?.lng ?? null,
      };
    })
    .filter((item) => item && item.address);
};

/* One line per address: "address, area, lga, state" */
const formatAddress = (item) =>
  [item?.address, item?.area, item?.lga, item?.state].filter(Boolean).join(", ");

/* All values of one address field, joined (used for sorting and CSV export) */
const joinAddressField = (row, key) =>
  (Array.isArray(row?.addressList) ? row.addressList : [])
    .map((item) => item?.[key])
    .filter(Boolean)
    .join(" | ") || "N/A";

/* One table column for one address field.
   A user with several addresses shows one line per address. */
const makeAddressColumn = (field, headerName, width, key) => ({
  field,
  headerName,
  width,
  sortable: true,
  filterable: true,

  valueGetter: (value, row) => joinAddressField(row, key),

  renderCell: (params) => {
    const list = Array.isArray(params?.row?.addressList) ? params.row.addressList : [];

    if (!list.length) {
      return "N/A";
    }

    return (
      <Box
        sx={{
          width: "100%",
          maxHeight: 60,
          overflowY: "auto",
          py: 0.5,
          lineHeight: 1.3,
        }}
      >
        {list.map((item, index) => (
          <Typography key={`${field}-${index}`} sx={{ fontSize: 13 }}>
            {list.length > 1 ? `${index + 1}. ` : ""}
            {item?.[key] || "N/A"}
          </Typography>
        ))}
      </Box>
    );
  },
});

const addressColumns = [
  makeAddressColumn("userAddress", "Address", 260, "address"),
  makeAddressColumn("userArea", "Area", 160, "area"),
  makeAddressColumn("userLandmark", "Landmark", 180, "landmark"),
  makeAddressColumn("userLga", "LGA", 150, "lga"),
  makeAddressColumn("userState", "State", 150, "state"),
];

/* Promo amount: "10" with type PERCENTAGE shows as "10%" */
const formatPromoAmount = (row) => {
  const amount = row?.promoAmount;

  if (amount === null || amount === undefined || amount === "" || amount === "N/A") {
    return "N/A";
  }

  return String(row?.promoType || "").toUpperCase() === "PERCENTAGE"
    ? `${amount}%`
    : String(amount);
};

/* A plain text column. Shows N/A when the value is empty. */
const makeTextColumn = (field, headerName, width, getter) => ({
  field,
  headerName,
  width,
  sortable: true,
  filterable: true,

  valueGetter: (value, row) => {
    const result = getter(row);

    return result === null || result === undefined || result === "" ? "N/A" : String(result);
  },
});

/* Business fields that were not in the table before */
const businessExtraColumns = [
  makeTextColumn("businessArea", "Business Area", 160, (r) => r?.business?.area),
  makeTextColumn("businessState", "Business State", 150, (r) => r?.business?.state),
  makeTextColumn("businessLga", "Business LGA", 150, (r) => r?.business?.lga),
  makeTextColumn("businessLandmark", "Business Landmark", 180, (r) => r?.business?.landmark),
  makeTextColumn("associationId", "Association ID", 160, (r) => r?.business?.association_id),
  makeTextColumn(
    "stateResidencyId",
    "State Residency ID",
    180,
    (r) => r?.business?.state_residency_id,
  ),
];

/* Subscription fields that were not in the table before */
const subscriptionExtraColumns = [
  makeTextColumn("packageName", "Package", 130, (r) => (r?.subscription ? r.packageName : null)),

  {
    field: "paymentStatus",
    headerName: "Payment Status",
    width: 150,
    sortable: true,
    filterable: true,

    valueGetter: (value, row) => (row?.subscription ? row?.paymentStatus || "N/A" : "N/A"),

    renderCell: (params) => {
      if (!params?.row?.subscription) {
        return "N/A";
      }

      const success = String(params?.value || "").toUpperCase() === "SUCCESSFUL";

      return (
        <Chip
          label={params?.value || "N/A"}
          size="small"
          sx={{
            backgroundColor: success ? "#ecfdf5" : "#fef2f2",
            color: success ? "#047857" : "#b91c1c",
            fontWeight: 600,
          }}
        />
      );
    },
  },

  makeTextColumn("transactionRef", "Transaction Ref", 290, (r) =>
    r?.subscription ? r.transactionRef : null,
  ),
  makeTextColumn("promoApplied", "Promo Applied", 140, (r) =>
    r?.subscription ? r.promoApplied : null,
  ),
  makeTextColumn("promoType", "Promo Type", 140, (r) => (r?.subscription ? r.promoType : null)),
  makeTextColumn("promoAmount", "Promo Amount", 140, (r) =>
    r?.subscription ? formatPromoAmount(r) : null,
  ),
  makeTextColumn("promoDescription", "Promo Description", 260, (r) =>
    r?.subscription ? r.promoDescription : null,
  ),
];

const mapUserToRow = (user, index) => {
  const subscription = getSubscription(user);

  const tradeNames = getTradeNames(user);

  /*
   * First try to find transaction
   * inside subscription.
   */
  let transaction = findTransaction(subscription);

  /*
   * If not there, search the
   * complete user object.
   */
  if (!transaction) {
    transaction = findTransaction(user);
  }

  /*
   * SIGNUP DATE
   */
  const signupDate = user?.created_at || user?.createdAt || null;

  /*
   * VALID FROM
   * = TRANSACTION DATE
   */
  const validFrom =
    subscription?.valid_from || subscription?.validFrom || getTransactionDate(transaction);

  /*
   * VALID TO
   * = SUBSCRIPTION EXPIRY DATE
   */
  const validTo = getExpiryDate(subscription);

  /*
   * BASE AMOUNT
   * = subscription.amount
   */
  const baseAmount =
    subscription?.base_amount ?? subscription?.baseAmount ?? subscription?.amount ?? "N/A";

  /*
   * AMOUNT PAID
   * = transaction.amount
   */
  const amountPaid =
    subscription?.amount_paid ??
    subscription?.amountPaid ??
    getTransactionAmount(transaction) ??
    "N/A";

  /*
   * SUBSCRIPTION STATUS
   */
  /*
   * Use the status the API sends (subscription_status: "ACTIVE" ...).
   * Only when it is missing, work it out from the expiry date.
   */
  const apiSubscriptionStatus = String(
    subscription?.subscription_status ?? subscription?.subscriptionStatus ?? "",
  )
    .trim()
    .toUpperCase();

  const subscriptionStatus = !subscription
    ? "none"
    : apiSubscriptionStatus
      ? apiSubscriptionStatus === "ACTIVE"
        ? "active"
        : "expired"
      : getSubscriptionStatus(subscription);

  return {
    ...user,

    /*
     * DataGrid unique ID
     */
    id: getUserId(user, index),

    /*
     * Name
     */
    name: getUserName(user),

    /*
     * Trades
     */
    trades: tradeNames,
    tradeDisplay: tradeNames.join(", ") || "N/A",

    /*
     * Dates
     */
    signupDate,
    validFrom,
    validTo,

    /*
     * Subscription
     */
    subscription,

    subscriptionType: getPlanName(subscription),

    hasSubscription: subscription !== null,

    /*
     * Amounts
     */
    baseAmount,
    amountPaid,

    /*
     * Transaction
     */
    transaction,

    /*
     * Status
     */
    subscriptionStatus,

    /*
     * Subscription details from the API
     */
    packageName: subscription?.package ?? "N/A",
    paymentStatus: subscription?.status ?? "N/A",
    transactionRef:
      subscription?.subscription_transaction ?? subscription?.subscriptionTransaction ?? "N/A",
    promoApplied: subscription?.promo?.applied ?? "N/A",
    promoType: subscription?.promo?.type ?? "N/A",
    promoAmount: subscription?.promo?.amount ?? "N/A",
    promoDescription: subscription?.promo?.description ?? "N/A",

    /*
     * ADDRESSES (all of them)
     */
    addressList: getAddresses(user),
    addressDisplay:
      getAddresses(user)
        .map((item) => formatAddress(item))
        .join(" | ") || "N/A",

    /*
     * SP BADGE
     * "1" = badged, "0" = not badged
     * (comes from business.badge)
     */
    badge: String(user?.business?.badge ?? "0"),

    /*
     * Keep complete original
     * API response available.
     */
    raw: user,
  };
};

/* =========================================================
   EXTRACT USERS FROM API RESPONSE
========================================================= */

const extractUsers = (json) => {
  if (Array.isArray(json?.data?.users)) {
    return json.data.users;
  }

  if (Array.isArray(json?.data?.customers)) {
    return json.data.customers;
  }

  if (Array.isArray(json?.users)) {
    return json.users;
  }

  if (Array.isArray(json?.customers)) {
    return json.customers;
  }

  if (Array.isArray(json?.data)) {
    return json.data;
  }

  if (Array.isArray(json)) {
    return json;
  }

  return [];
};

/* =========================================================
   EXTRACT PAGINATION
========================================================= */

const getPagination = (json) => {
  return json?.data?.pagination || json?.pagination || json?.data?.meta || json?.meta || null;
};

/* =========================================================
   GET TOTAL PAGES
========================================================= */

const getTotalPages = (json, pagination, usersLength, pageSize) => {
  const direct =
    pagination?.total_pages ??
    pagination?.totalPages ??
    pagination?.last_page ??
    pagination?.lastPage ??
    json?.data?.total_pages ??
    json?.data?.totalPages ??
    json?.total_pages ??
    json?.totalPages;

  if (direct !== null && direct !== undefined) {
    const pages = Number(direct);

    if (Number.isFinite(pages) && pages > 0) {
      return pages;
    }
  }

  const total = Number(
    pagination?.total ??
      pagination?.total_count ??
      pagination?.totalCount ??
      json?.data?.total ??
      json?.total ??
      0,
  );

  if (total > 0 && pageSize > 0) {
    return Math.ceil(total / pageSize);
  }

  /*
   * If current page returned
   * fewer users than page size,
   * assume it is the last page.
   */
  return usersLength < pageSize ? 1 : null;
};

/* Columns hidden in the "Essential" view.
   They are still one click away: use "All columns" or the Columns button. */
const HIDDEN_BY_DEFAULT = [
  "uniq_id",
  "tradeDisplay",
  "businessEmail",
  "businessPhone",
  "businessAddress",
  "businessArea",
  "businessState",
  "businessLga",
  "businessLandmark",
  "associationId",
  "stateResidencyId",
  "userAddress",
  "userArea",
  "userLandmark",
  "userLga",
  "baseAmount",
  "amountPaid",
  "packageName",
  "paymentStatus",
  "transactionRef",
  "promoApplied",
  "promoType",
  "promoAmount",
  "promoDescription",
];

const ESSENTIAL_COLUMNS = Object.fromEntries(HIDDEN_BY_DEFAULT.map((field) => [field, false]));

/* Colour strip on top of each column header, so a wide table is easy to navigate */
const COLUMN_GROUPS = {
  badge: {
    label: "SP badge",
    color: "#d97706",
    fields: ["spBadge", "spBadgeSuspended", "spBadgeExpiry"],
  },
  subscription: {
    label: "Subscription",
    color: "#059669",
    fields: [
      "subscriptionDisplay",
      "baseAmount",
      "amountPaid",
      "validFrom",
      "validTo",
      "subscriptionStatus",
      "packageName",
      "paymentStatus",
      "transactionRef",
      "promoApplied",
      "promoType",
      "promoAmount",
      "promoDescription",
    ],
  },
  business: {
    label: "Business",
    color: "#7c3aed",
    fields: [
      "businessName",
      "businessEmail",
      "businessPhone",
      "businessAddress",
      "businessArea",
      "businessState",
      "businessLga",
      "businessLandmark",
      "associationId",
      "stateResidencyId",
      "businessVerified",
    ],
  },
  address: {
    label: "Address",
    color: "#0ea5e9",
    fields: ["userAddress", "userArea", "userLandmark", "userLga", "userState"],
  },
};

const GROUP_OF_FIELD = {};

Object.entries(COLUMN_GROUPS).forEach(([key, group]) => {
  group.fields.forEach((field) => {
    GROUP_OF_FIELD[field] = key;
  });
});

const withGroupStyle = (column) => ({
  ...column,
  headerClassName: `col-group-${GROUP_OF_FIELD[column.field] || "user"}`,
});

/* =========================================================
   DATAGRID TOOLBAR
========================================================= */

function CustomToolbar({ onExportAll, onExportFiltered, columnView, onColumnViewChange }) {
  return (
    <GridToolbarContainer
      sx={{
        padding: "12px 16px",
        borderBottom: "1px solid #e2e8f0",
        gap: 1,
        flexWrap: "wrap",
        justifyContent: "space-between",
      }}
    >
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={columnView}
          onChange={(event, value) => value && onColumnViewChange(value)}
        >
          <ToggleButton value="essential">Essential columns</ToggleButton>
          <ToggleButton value="all">All columns</ToggleButton>
        </ToggleButtonGroup>

        <GridToolbarColumnsButton />

        <GridToolbarFilterButton />

        <GridToolbarDensitySelector />
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Download size={15} />}
          onClick={onExportAll}
        >
          Export all
        </Button>

        <Button
          variant="contained"
          size="small"
          startIcon={<Download size={15} />}
          onClick={onExportFiltered}
        >
          Export filtered
        </Button>
      </Box>
    </GridToolbarContainer>
  );
}

/* =========================================================
   SUMMARY TILE (click it to filter the table)
========================================================= */

function StatTile({ icon, label, value, valueText, note, color, active, onClick }) {
  return (
    <Box
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onClick?.();
        }
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 2,
        borderRadius: 3,
        cursor: "pointer",
        backgroundColor: "#fff",
        border: active ? `2px solid ${color}` : "2px solid #e2e8f0",
        boxShadow: active ? `0 6px 18px ${color}22` : "0 1px 2px rgba(15, 23, 42, 0.04)",
        transition: "all 0.15s ease",
        "&:hover": { borderColor: color, transform: "translateY(-1px)" },
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color,
          backgroundColor: `${color}1a`,
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>{label}</Typography>

        <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
          {valueText ?? Number(value || 0).toLocaleString("en-NG")}
        </Typography>

        {note && <Typography sx={{ fontSize: 12, color: "#64748b" }}>{note}</Typography>}
      </Box>
    </Box>
  );
}

/* =========================================================
   EMPTY TABLE MESSAGE
========================================================= */

function NoRowsOverlay({ onClear }) {
  return (
    <Box sx={{ py: 8, textAlign: "center" }}>
      <Typography sx={{ fontWeight: 700, color: "#0f172a" }}>No users found</Typography>

      <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5, mb: 2 }}>
        Try a different search, or clear the filters.
      </Typography>

      <Button variant="outlined" size="small" onClick={onClear}>
        Clear filters
      </Button>
    </Box>
  );
}

/* =========================================================
   CUSTOMER COMPONENT
========================================================= */

export default function Customer() {
  /* -------------------------------------------------------
     ALL USERS FROM ALL API PAGES
  ------------------------------------------------------- */

  const [allUsers, setAllUsers] = useState([]);

  /* -------------------------------------------------------
     LOADING
  ------------------------------------------------------- */

  const [loading, setLoading] = useState(true);

  /* -------------------------------------------------------
     ERROR
  ------------------------------------------------------- */

  const [error, setError] = useState("");

  /* -------------------------------------------------------
     SEARCH INPUT
  ------------------------------------------------------- */

  const [searchInput, setSearchInput] = useState("");

  /* -------------------------------------------------------
     ACTUAL SEARCH
  ------------------------------------------------------- */

  const [search, setSearch] = useState("");

  /* -------------------------------------------------------
     SUBSCRIPTION FILTER

     all
     subscribed
     none
  ------------------------------------------------------- */

  const [subscriptionFilter, setSubscriptionFilter] = useState("all");

  /* -------------------------------------------------------
     TABLE SORT

     Default: newest signup first.
     When "Subscribed" is chosen: latest subscriber first
     (by Valid From, which is the transaction date).
     The admin can still click any column to change it.
  ------------------------------------------------------- */

  const DEFAULT_SORT = [{ field: "signupDate", sort: "desc" }];

  const SUBSCRIBER_SORT = [{ field: "validFrom", sort: "desc" }];

  const [sortModel, setSortModel] = useState(DEFAULT_SORT);

  /* -------------------------------------------------------
     VISIBLE COLUMNS
     "Essential" hides the detail columns so the table is easy to read.
  ------------------------------------------------------- */

  const [columnVisibility, setColumnVisibility] = useState({});

  const columnView = HIDDEN_BY_DEFAULT.some((field) => columnVisibility[field] === false)
    ? "essential"
    : "all";

  const handleColumnViewChange = (view) => {
    setColumnVisibility(view === "essential" ? ESSENTIAL_COLUMNS : {});
  };

  /* -------------------------------------------------------
     TABLE SCROLLING
     The left and right arrow buttons move the table sideways.
  ------------------------------------------------------- */

  const tableWrapRef = useRef(null);

  const scrollTable = (direction) => {
    const scroller = tableWrapRef.current?.querySelector(".MuiDataGrid-virtualScroller");

    scroller?.scrollBy({ left: direction * 600, behavior: "smooth" });
  };

  /* -------------------------------------------------------
     SELECTED USER
  ------------------------------------------------------- */

  const [selectedUser, setSelectedUser] = useState(null);

  /* -------------------------------------------------------
     REPORT DIALOG
  ------------------------------------------------------- */

  const [reportOpen, setReportOpen] = useState(false);

  /* =======================================================
     FETCH ALL USERS FROM ALL API PAGES
  ======================================================= */

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getAuthToken();

      if (!token) {
        throw new Error("Authentication token was not found. Please login again.");
      }

      const collectedUsers = [];

      /*
       * Request a large page size.
       * The API can still return its own
       * configured page size.
       */
      const apiPageSize = 100;

      let page = 1;

      const MAX_PAGES = 1000;

      while (page <= MAX_PAGES) {
        const params = new URLSearchParams();

        params.set("page", String(page));

        params.set("limit", String(apiPageSize));

        const requestUrl = `${API_URL}?${params.toString()}`;

        const response = await fetch(requestUrl, {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,

            Accept: "application/json",

            "Content-Type": "application/json",
          },
        });

        console.log(`Users API response page ${page}:`, response);

        const json = await response.json();

        console.log(`Users API page ${page}:`, json);

        if (!response.ok) {
          throw new Error(
            json?.message || json?.error || `Request failed with status ${response.status}`,
          );
        }

        const users = extractUsers(json);

        collectedUsers.push(...users);

        const pagination = getPagination(json);

        const totalPages = getTotalPages(json, pagination, users.length, apiPageSize);

        let hasNext = false;

        /*
         * API explicitly says whether
         * there is a next page.
         */
        if (pagination?.has_next !== undefined) {
          hasNext = Boolean(pagination.has_next);
        } else if (pagination?.hasNext !== undefined) {
          hasNext = Boolean(pagination.hasNext);
        } else if (pagination?.has_next_page !== undefined) {
          hasNext = Boolean(pagination.has_next_page);
        } else if (pagination?.hasNextPage !== undefined) {
          hasNext = Boolean(pagination.hasNextPage);
        } else if (totalPages !== null) {

        /*
         * Otherwise use total pages.
         */
          hasNext = page < totalPages;
        } else {

        /*
         * Last fallback:
         * if API returns a full page,
         * keep requesting.
         */
          hasNext = users.length >= apiPageSize;
        }

        if (!hasNext) {
          break;
        }

        page += 1;
      }

      /*
       * Convert every API user
       * into a DataGrid row.
       */
      const mappedUsers = collectedUsers.map((user, index) => mapUserToRow(user, index));

      console.log("ALL USERS:", mappedUsers);

      console.log("TOTAL USERS:", mappedUsers.length);

      /*
       * SP BADGE CHECK
       * Look at these in the console to confirm:
       * 1) what "type" looks like for SPs
       * 2) that business.badge is coming from the API
       */
      console.log(
        "USER TYPES FOUND:",
        [...new Set(mappedUsers.map((u) => u?.type))],
      );
      console.log(
        "FIRST SP (check business.badge):",
        mappedUsers.find((u) => isSP(u)),
      );

      setAllUsers(mappedUsers);
    } catch (err) {
      console.error("Failed to load users:", err);

      setError(err?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     INITIAL FETCH
  ======================================================= */

  useEffect(() => {
    fetchAllUsers();
  }, []);

  /* =======================================================
     SP BADGE (switch, filter, bulk, CSV import)
     Must stay after fetchAllUsers and before filteredUsers.
  ======================================================= */

  const badge = useSpBadge(setAllUsers, fetchAllUsers, allUsers);

  /* =======================================================
     REVENUE
     Added up from the "amount paid" of every subscription.
  ======================================================= */

  const revenue = useMemo(() => getRevenueSummary(allUsers), [allUsers]);

  /* =======================================================
     FILTER ALL USERS

     IMPORTANT:
     This happens BEFORE DataGrid.

     Therefore:

     1430 API USERS
          ↓
     NAME FILTER
          ↓
     SUBSCRIPTION FILTER
          ↓
     SP BADGE FILTER
          ↓
     DATAGRID
          ↓
     PAGINATION
======================================================= */

  const filteredUsers = useMemo(() => {
    let result = [...allUsers];

    /* ---------------------------------------------------
         NAME SEARCH
      --------------------------------------------------- */

    if (search.trim()) {
      const value = search.trim().toLowerCase();

      result = result.filter((user) => {
        const firstname = String(user?.firstname || "").toLowerCase();

        const lastname = String(user?.lastname || "").toLowerCase();

        const fullName = `${firstname} ${lastname}`;

        return firstname.includes(value) || lastname.includes(value) || fullName.includes(value);
      });
    }

    /* ---------------------------------------------------
         SUBSCRIBED
      --------------------------------------------------- */

    if (subscriptionFilter === "subscribed") {
      result = result.filter(
        (user) => user?.subscription !== null && user?.subscription !== undefined,
      );
    }

    /* ---------------------------------------------------
         NO SUBSCRIPTION
      --------------------------------------------------- */

    if (subscriptionFilter === "none") {
      result = result.filter(
        (user) => user?.subscription === null || user?.subscription === undefined,
      );
    }

    /* ---------------------------------------------------
         SP BADGE FILTER
         All users / All SP / Badged SP / Non-badged SP
      --------------------------------------------------- */

    result = badge.applyFilter(result);

    return result;
  }, [allUsers, search, subscriptionFilter, badge.applyFilter]);

  /* =======================================================
     SEARCH
======================================================= */

  const handleSearch = () => {
    setSearch(searchInput.trim());
  };

  /* =======================================================
     CLEAR FILTERS
======================================================= */

  const handleClear = () => {
    setSearchInput("");
    setSearch("");
    setSubscriptionFilter("all");
    setSortModel(DEFAULT_SORT);
    badge.setFilter("all");
  };

  /* =======================================================
     SUBSCRIPTION FILTER CHANGE
     "Subscribed" loads with the latest subscriber on top.
======================================================= */

  const handleSubscriptionFilterChange = (value) => {
    setSubscriptionFilter(value);

    setSortModel(value === "subscribed" ? SUBSCRIBER_SORT : DEFAULT_SORT);
  };

  /* =======================================================
     EXPORT CSV
  ======================================================= */

  const exportCsv = (rows, filename) => {
    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "Type",
      "Trade",
      "Business",
      "Business Email",
      "Business Phone",
      "Business Address",
      "Business Area",
      "Business State",
      "Business LGA",
      "Business Landmark",
      "Association ID",
      "State Residency ID",
      "Address",
      "Area",
      "Landmark",
      "LGA",
      "State",
      "Subscription",
      "Signup Date",
      "Valid From",
      "Valid To",
      "Amount Paid",
      "Base Amount",
      "Subscription Status",
      "Package",
      "Payment Status",
      "Transaction Ref",
      "Promo Applied",
      "Promo Type",
      "Promo Amount",
      "Promo Description",
      "Account Status",
      "Business Verified",
      "SP Badge",
    ];

    const escapeCsv = (value) => {
      const text = value === null || value === undefined ? "" : String(value);

      if (text.includes(",") || text.includes('"') || text.includes("\n")) {
        return `"${text.replace(/"/g, '""')}"`;
      }

      return text;
    };

    const csvRows = [
      headers.join(","),
      ...rows.map((row) => {
        const tradeValue = Array.isArray(row?.trades) ? row.trades.join("; ") : row?.tradeDisplay || "N/A";

        const values = [
          escapeCsv(row?.id || "N/A"),
          escapeCsv(getUserName(row)),
          escapeCsv(row?.email || "N/A"),
          escapeCsv(
            row?.phone ? `${row?.phone_code || ""} ${row.phone}`.trim() : "N/A",
          ),
          escapeCsv(row?.type || "N/A"),
          escapeCsv(tradeValue || "N/A"),
          escapeCsv(row?.business?.business_name || "N/A"),
          escapeCsv(row?.business?.business_email || "N/A"),
          escapeCsv(row?.business?.business_phone || "N/A"),
          escapeCsv(row?.business?.business_address || "N/A"),
          escapeCsv(row?.business?.area || "N/A"),
          escapeCsv(row?.business?.state || "N/A"),
          escapeCsv(row?.business?.lga || "N/A"),
          escapeCsv(row?.business?.landmark || "N/A"),
          escapeCsv(row?.business?.association_id || "N/A"),
          escapeCsv(row?.business?.state_residency_id || "N/A"),
          escapeCsv(joinAddressField(row, "address")),
          escapeCsv(joinAddressField(row, "area")),
          escapeCsv(joinAddressField(row, "landmark")),
          escapeCsv(joinAddressField(row, "lga")),
          escapeCsv(joinAddressField(row, "state")),
          escapeCsv(row?.subscription ? `Subscribed ${row?.subscriptionType || ""}` : "No Subscription"),
          escapeCsv(row?.signupDate || "N/A"),
          escapeCsv(row?.validFrom || "N/A"),
          escapeCsv(row?.validTo || "N/A"),
          escapeCsv(row?.amountPaid || "N/A"),
          escapeCsv(row?.baseAmount || "N/A"),
          escapeCsv(row?.subscriptionStatus || "N/A"),
          escapeCsv(row?.subscription ? row?.packageName : "N/A"),
          escapeCsv(row?.subscription ? row?.paymentStatus : "N/A"),
          escapeCsv(row?.subscription ? row?.transactionRef : "N/A"),
          escapeCsv(row?.subscription ? row?.promoApplied : "N/A"),
          escapeCsv(row?.subscription ? row?.promoType : "N/A"),
          escapeCsv(row?.subscription ? formatPromoAmount(row) : "N/A"),
          escapeCsv(row?.subscription ? row?.promoDescription : "N/A"),
          escapeCsv(Number(row?.active) === 1 ? "Active" : "Inactive"),
          escapeCsv(Number(row?.business?.verified) === 1 ? "Verified" : "Not Verified"),
          escapeCsv(isSP(row) ? (isBadged(row) ? "Badged" : "Not Badged") : "N/A"),
        ];

        return values.join(",");
      }),
    ];

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    exportCsv(allUsers, "all-users.csv");
  };

  const handleExportFiltered = () => {
    exportCsv(filteredUsers, "filtered-users.csv");
  };

  /* =======================================================
     MUI DATAGRID COLUMNS

     IMPORTANT:
     MUI X CURRENT API:

     valueGetter: (value, row) => ...

     NOT:

     valueGetter: (params) => ...
======================================================= */

  const columns = useMemo(
    () => [
      /* ===================================================
         ID
      =================================================== */

      {
        field: "id",
        headerName: "ID",
        width: 120,
        sortable: true,
        filterable: true,
      },

      /* ===================================================
         USER
      =================================================== */

      {
        field: "name",
        headerName: "User",
        width: 280,
        sortable: true,
        filterable: true,

        renderCell: (params) => {
          const imageUrl = getImageUrl(params?.row?.avatar_location);

          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                width: "100%",
                overflow: "hidden",
              }}
            >
              <Avatar
                src={imageUrl || undefined}
                alt={params?.value || "User"}
                sx={{
                  width: 38,
                  height: 38,
                  flexShrink: 0,
                }}
              >
                {params?.row?.firstname?.charAt(0)?.toUpperCase()}
              </Avatar>

              <Box
                sx={{
                  minWidth: 0,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {params?.value || "N/A"}
                </Typography>

                <Typography
                  sx={{
                    fontSize: 12,
                    color: "#6b7280",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {params?.row?.email || "N/A"}
                </Typography>
              </Box>
            </Box>
          );
        },
      },

      /* ===================================================
         SP BADGE (icon + on/off switch, SP users only)
      =================================================== */

      ...badge.columns,

      /* ===================================================
         UNIQUE ID
      =================================================== */

      {
        field: "uniq_id",
        headerName: "Unique ID",
        width: 130,
        sortable: true,
        filterable: true,
      },

      /* ===================================================
         TYPE
      =================================================== */

      {
        field: "type",
        headerName: "Type",
        width: 100,
        sortable: true,
        filterable: true,

        renderCell: (params) => (
          <Chip
            label={params?.value || "N/A"}
            size="small"
            sx={{
              backgroundColor: "#eff6ff",
              color: "#1d4ed8",
              fontWeight: 600,
            }}
          />
        ),
      },

      /* ===================================================
         TRADES
      =================================================== */

      {
        field: "tradeDisplay",
        headerName: "Trade",
        width: 320,
        sortable: true,
        filterable: true,

        valueGetter: (value, row) => row?.tradeDisplay || "N/A",

        renderCell: (params) => {
          const trades = Array.isArray(params?.row?.trades) ? params.row.trades : [];

          if (!trades.length) {
            return "N/A";
          }

          return (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 0.5,
                alignItems: "center",
                width: "100%",
                maxHeight: 72,
                overflowY: "auto",
                py: 0.5,
                pr: 0.5,
                boxSizing: "border-box",
              }}
            >
              {trades.map((trade, index) => (
                <Chip
                  key={`${trade}-${index}`}
                  label={trade}
                  size="small"
                  sx={{
                    backgroundColor: "#eff6ff",
                    color: "#1d4ed8",
                    fontWeight: 600,
                    maxWidth: "100%",
                  }}
                />
              ))}
            </Box>
          );
        },
      },

      /* ===================================================
         SIGNUP DATE

         user.created_at
      =================================================== */

      {
        field: "signupDate",
        headerName: "Signup Date",
        width: 155,
        sortable: true,
        filterable: true,
        type: "date",

        valueGetter: (value, row) => {
          if (!row?.signupDate) {
            return null;
          }

          const date = new Date(row.signupDate);

          return Number.isNaN(date.getTime()) ? null : date;
        },

        renderCell: (params) => formatDate(params?.value),
      },

      /* ===================================================
         PHONE
      =================================================== */

      {
        field: "phone",
        headerName: "Phone",
        width: 170,
        sortable: true,
        filterable: true,

        valueGetter: (value, row) => {
          if (!row?.phone) {
            return "N/A";
          }

          return `${row?.phone_code || ""} ${row.phone}`.trim();
        },
      },

      /* ===================================================
         ACCOUNT STATUS
      =================================================== */

      {
        field: "active",
        headerName: "Account Status",
        width: 145,
        sortable: true,
        filterable: true,

        renderCell: (params) => {
          const active = Number(params?.value) === 1;

          return (
            <Chip
              label={active ? "Active" : "Inactive"}
              size="small"
              sx={{
                backgroundColor: active ? "#ecfdf5" : "#fef2f2",

                color: active ? "#047857" : "#b91c1c",

                fontWeight: 600,
              }}
            />
          );
        },
      },

      /* ===================================================
         BUSINESS NAME
      =================================================== */

      {
        field: "businessName",
        headerName: "Business",
        width: 220,
        sortable: true,
        filterable: true,

        valueGetter: (value, row) => row?.business?.business_name || "N/A",
      },

      /* ===================================================
         BUSINESS EMAIL
      =================================================== */

      {
        field: "businessEmail",
        headerName: "Business Email",
        width: 240,
        sortable: true,
        filterable: true,

        valueGetter: (value, row) => row?.business?.business_email || "N/A",
      },

      /* ===================================================
         BUSINESS PHONE
      =================================================== */

      {
        field: "businessPhone",
        headerName: "Business Phone",
        width: 170,
        sortable: true,
        filterable: true,

        valueGetter: (value, row) => row?.business?.business_phone || "N/A",
      },

      /* ===================================================
         BUSINESS ADDRESS
      =================================================== */

      {
        field: "businessAddress",
        headerName: "Business Address",
        width: 320,
        sortable: true,
        filterable: true,

        valueGetter: (value, row) => row?.business?.business_address || "N/A",
      },

      /* ===================================================
         BUSINESS EXTRA FIELDS (area, state, LGA, landmark, IDs)
      =================================================== */

      ...businessExtraColumns,

      /* ===================================================
         SUBSCRIPTION
      =================================================== */

      {
        field: "subscriptionDisplay",
        headerName: "Subscription",
        width: 210,
        sortable: true,
        filterable: true,

        valueGetter: (value, row) =>
          row?.subscription ? `Subscribed ${row?.subscriptionType || ""}` : "No Subscription",

        renderCell: (params) => {
          if (!params?.row?.subscription) {
            return (
              <Chip
                label="No Subscription"
                size="small"
                sx={{
                  backgroundColor: "#f3f4f6",
                  color: "#6b7280",
                  fontWeight: 600,
                }}
              />
            );
          }

          return (
            <Box>
              <Chip
                label="Subscribed"
                size="small"
                sx={{
                  backgroundColor: "#eff6ff",
                  color: "#2563eb",
                  fontWeight: 600,
                }}
              />

              <Typography
                sx={{
                  fontSize: 11,
                  color: "#6b7280",
                  mt: 0.3,
                }}
              >
                {params?.row?.subscriptionType || "N/A"}
              </Typography>
            </Box>
          );
        },
      },

      /* ===================================================
         BASE AMOUNT

         subscription.amount
      =================================================== */

      {
        field: "baseAmount",
        headerName: "Base Amount",
        width: 150,
        sortable: true,
        filterable: true,
        type: "number",

        valueGetter: (value, row) => {
          if (!row?.subscription) {
            return null;
          }

          const amount = Number(row?.baseAmount);

          return Number.isNaN(amount) ? null : amount;
        },

        renderCell: (params) => {
          if (!params?.row?.subscription) {
            return "N/A";
          }

          return formatCurrency(params?.value);
        },
      },

      /* ===================================================
         AMOUNT PAID

         transaction.amount
      =================================================== */

      {
        field: "amountPaid",
        headerName: "Amount Paid",
        width: 150,
        sortable: true,
        filterable: true,
        type: "number",

        valueGetter: (value, row) => {
          if (!row?.subscription) {
            return null;
          }

          const amount = Number(row?.amountPaid);

          return Number.isNaN(amount) ? null : amount;
        },

        renderCell: (params) => {
          if (!params?.row?.subscription) {
            return "N/A";
          }

          return formatCurrency(params?.value);
        },
      },

      /* ===================================================
         VALID FROM

         transaction date
      =================================================== */

      {
        field: "validFrom",
        headerName: "Valid From",
        width: 155,
        sortable: true,
        filterable: true,
        type: "date",

        valueGetter: (value, row) => {
          if (!row?.subscription || !row?.validFrom) {
            return null;
          }

          const date = new Date(row.validFrom);

          return Number.isNaN(date.getTime()) ? null : date;
        },

        renderCell: (params) => {
          if (!params?.row?.subscription) {
            return "N/A";
          }

          return formatDate(params?.value);
        },
      },

      /* ===================================================
         VALID TO

         subscription expiry date
      =================================================== */

      {
        field: "validTo",
        headerName: "Valid To",
        width: 155,
        sortable: true,
        filterable: true,
        type: "date",

        valueGetter: (value, row) => {
          if (!row?.subscription || !row?.validTo) {
            return null;
          }

          const date = new Date(row.validTo);

          return Number.isNaN(date.getTime()) ? null : date;
        },

        renderCell: (params) => {
          if (!params?.row?.subscription) {
            return "N/A";
          }

          return formatDate(params?.value);
        },
      },

      /* ===================================================
         SUBSCRIPTION STATUS
      =================================================== */

      {
        field: "subscriptionStatus",
        headerName: "Subscription Status",
        width: 180,
        sortable: true,
        filterable: true,

        renderCell: (params) => {
          if (!params?.row?.subscription) {
            return (
              <Chip
                label="N/A"
                size="small"
                sx={{
                  backgroundColor: "#f3f4f6",
                  color: "#6b7280",
                }}
              />
            );
          }

          const active = params?.value === "active";

          return (
            <Chip
              label={active ? "Active" : "Expired"}
              size="small"
              sx={{
                backgroundColor: active ? "#ecfdf5" : "#fef2f2",

                color: active ? "#047857" : "#b91c1c",

                fontWeight: 600,
              }}
            />
          );
        },
      },

      /* ===================================================
         SUBSCRIPTION EXTRA FIELDS (package, payment status,
         transaction ref, promo)
      =================================================== */

      ...subscriptionExtraColumns,

      /* ===================================================
         VERIFICATION
      =================================================== */

      {
        field: "businessVerified",
        headerName: "Business Verified",
        width: 165,
        sortable: true,
        filterable: true,

        valueGetter: (value, row) =>
          Number(row?.business?.verified) === 1 ? "Verified" : "Not Verified",

        renderCell: (params) => {
          const verified = params?.value === "Verified";

          return (
            <Chip
              label={verified ? "Verified" : "Not Verified"}
              size="small"
              sx={{
                backgroundColor: verified ? "#ecfdf5" : "#fef2f2",

                color: verified ? "#047857" : "#b91c1c",

                fontWeight: 600,
              }}
            />
          );
        },
      },

      /* ===================================================
         ADDRESS (one column per field: address, area, landmark, LGA, state)
      =================================================== */

      ...addressColumns,

      /* ===================================================
         ACTIONS
      =================================================== */

      {
        field: "actions",
        headerName: "Actions",
        width: 100,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,

        renderCell: (params) => (
          <Tooltip title="View user">
            <IconButton
              size="small"
              onClick={() => setSelectedUser(params.row)}
              sx={{
                color: "#2563eb",
              }}
            >
              <Eye size={18} />
            </IconButton>
          </Tooltip>
        ),
      },
    ].map(withGroupStyle),
    [badge.columns],
  );

  /* =======================================================
     LOADING STATE
======================================================= */

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 450,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <RefreshCw size={34} className="animate-spin" />

        <Typography
          sx={{
            mt: 2,
            fontWeight: 600,
          }}
        >
          Loading users...
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "#6b7280",
            mt: 0.5,
          }}
        >
          Fetching users from all API pages
        </Typography>
      </Box>
    );
  }

  /* =======================================================
     ERROR STATE
======================================================= */

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            padding: 3,
            borderRadius: 2,
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
          }}
        >
          <Typography fontWeight={700} color="error">
            Failed to load users
          </Typography>

          <Typography
            sx={{
              mt: 1,
              color: "#dc2626",
            }}
          >
            {error}
          </Typography>

          <Button
            variant="contained"
            sx={{
              mt: 2,
            }}
            onClick={fetchAllUsers}
          >
            Try Again
          </Button>
        </Box>
      </Box>
    );
  }

  /* =======================================================
     MAIN UI
======================================================= */

  const hasActiveFilters = Boolean(
    search || searchInput || subscriptionFilter !== "all" || badge.filter !== "all",
  );

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
      }}
    >
      {/* ===================================================
          HEADER
      =================================================== */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          mb: 3,
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}
          >
            Users
          </Typography>

          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            Manage users, subscriptions and SP badges
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="contained" onClick={() => setReportOpen(true)}>
            View report
          </Button>

          <Button variant="outlined" startIcon={<RefreshCw size={16} />} onClick={fetchAllUsers}>
            Refresh
          </Button>
        </Box>
      </Box>

      {/* ===================================================
          SUMMARY TILES (click one to filter the table)
      =================================================== */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 2,
          mb: 3,
        }}
      >
        <StatTile
          icon={<CreditCard size={22} />}
          label="Subscribed"
          value={allUsers.filter((user) => Boolean(user?.subscription)).length}
          note={`${allUsers.filter((user) => user?.subscription && user?.subscriptionStatus === "active").length.toLocaleString("en-NG")} active`}
          color="#059669"
          active={subscriptionFilter === "subscribed"}
          onClick={() => handleSubscriptionFilterChange("subscribed")}
        />

        <StatTile
          icon={<UserX size={22} />}
          label="No subscription"
          value={allUsers.filter((user) => !user?.subscription).length}
          color="#64748b"
          active={subscriptionFilter === "none"}
          onClick={() => handleSubscriptionFilterChange("none")}
        />

        <StatTile
          icon={<Award size={22} />}
          label="SP badged"
          value={allUsers.filter((user) => isSP(user) && isBadged(user)).length}
          note={`${allUsers.filter((user) => isSP(user)).length.toLocaleString("en-NG")} SPs in total`}
          color="#d97706"
          active={badge.filter === "badged"}
          onClick={() => badge.setFilter("badged")}
        />

        <StatTile
          icon={<Wallet size={22} />}
          label="Revenue"
          valueText={formatNaira(revenue.total)}
          note={`From ${revenue.count.toLocaleString("en-NG")} paying subscribers`}
          color="#0d9488"
          active={false}
          onClick={() => handleSubscriptionFilterChange("subscribed")}
        />
      </Box>

      {/* ===================================================
          SEARCH AND FILTERS
      =================================================== */}

      <Box
        sx={{
          backgroundColor: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 3,
          padding: 2,
          mb: 2,
          display: "flex",
          gap: 1.5,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <TextField
          size="small"
          placeholder="Search by name..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSearch();
            }
          }}
          sx={{ flex: 1, minWidth: 260 }}
          InputProps={{
            startAdornment: (
              <Search
                size={18}
                style={{
                  marginRight: 8,
                  color: "#94a3b8",
                }}
              />
            ),
          }}
        />

        <Button variant="contained" onClick={handleSearch} sx={{ minWidth: 95 }}>
          Search
        </Button>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Subscription</InputLabel>

          <Select
            label="Subscription"
            value={subscriptionFilter}
            onChange={(event) => handleSubscriptionFilterChange(event.target.value)}
          >
            <MenuItem value="all">All users</MenuItem>

            <MenuItem value="subscribed">Subscribed (latest first)</MenuItem>

            <MenuItem value="none">No subscription</MenuItem>
          </Select>
        </FormControl>

        {hasActiveFilters && (
          <Button variant="text" startIcon={<X size={16} />} onClick={handleClear}>
            Clear filters
          </Button>
        )}
      </Box>

      {/* ===================================================
          SP BADGE: filter, bulk buttons, CSV import
      =================================================== */}

      <SpBadgeToolbar badge={badge} />

      {/* ===================================================
          DATAGRID
      =================================================== */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          mb: 1,
        }}
      >
        <Typography variant="body2" sx={{ color: "#64748b" }}>
          Showing {filteredUsers.length.toLocaleString("en-NG")} of{" "}
          {allUsers.length.toLocaleString("en-NG")} users
        </Typography>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          {[
            { label: "User", color: "#2563eb" },
            ...Object.values(COLUMN_GROUPS).map((group) => ({
              label: group.label,
              color: group.color,
            })),
          ].map((item) => (
            <Box
              key={item.label}
              sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 12, color: "#64748b" }}
            >
              <Box
                sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: item.color }}
              />
              {item.label}
            </Box>
          ))}

          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
            Scroll sideways or use the arrows on the table edges
          </Typography>
        </Box>
      </Box>

      <Box
        ref={tableWrapRef}
        sx={{
          position: "relative",
          width: "100%",
          height: "calc(100vh - 150px)",
          minHeight: 560,
          backgroundColor: "#fff",
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
          "&:hover .scroll-btn": { opacity: 0.95 },
        }}
      >
        <IconButton
          className="scroll-btn"
          aria-label="Scroll table left"
          onClick={() => scrollTable(-1)}
          sx={{
            position: "absolute",
            left: 8,
            top: "50%",
            zIndex: 5,
            opacity: 0,
            transition: "opacity 0.2s",
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)",
            "&:hover": { backgroundColor: "#eff6ff" },
          }}
        >
          <ChevronLeft size={20} />
        </IconButton>

        <IconButton
          className="scroll-btn"
          aria-label="Scroll table right"
          onClick={() => scrollTable(1)}
          sx={{
            position: "absolute",
            right: 8,
            top: "50%",
            zIndex: 5,
            opacity: 0,
            transition: "opacity 0.2s",
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)",
            "&:hover": { backgroundColor: "#eff6ff" },
          }}
        >
          <ChevronRight size={20} />
        </IconButton>

        <DataGrid
          rows={filteredUsers}
          columns={columns}
          /*
           * DataGrid handles pagination.
           *
           * The rows have ALREADY been filtered
           * against ALL 1430+ API users.
           */
          pagination
          rowHeight={64}
          initialState={{
            pagination: {
              paginationModel: {
                page: 0,
                pageSize: 25,
              },
            },
          }}
          sortModel={sortModel}
          onSortModelChange={(model) => setSortModel(model)}
          columnVisibilityModel={columnVisibility}
          onColumnVisibilityModelChange={(model) => setColumnVisibility(model)}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          /* SP BADGE: only SP rows can be ticked */
          checkboxSelection
          isRowSelectable={(params) => isSP(params.row)}
          onRowSelectionModelChange={badge.setSelection}
          slots={{
            toolbar: CustomToolbar,
            noRowsOverlay: NoRowsOverlay,
          }}
          slotProps={{
            toolbar: {
              onExportAll: handleExportAll,
              onExportFiltered: handleExportFiltered,
              columnView,
              onColumnViewChange: handleColumnViewChange,
            },
            noRowsOverlay: { onClear: handleClear },
          }}
          sx={{
            border: 0,
            fontFamily: "inherit",

            /* SCROLLBARS: bigger and easier to grab */

            scrollbarColor: "#94a3b8 #f1f5f9",

            "& .MuiDataGrid-virtualScroller::-webkit-scrollbar": {
              height: 14,
              width: 14,
            },

            "& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track": {
              background: "#f1f5f9",
            },

            "& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb": {
              background: "#94a3b8",
              borderRadius: 8,
              border: "3px solid #f1f5f9",
            },

            "& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb:hover": {
              background: "#64748b",
            },

            /* COLOUR STRIP ON TOP OF EACH COLUMN GROUP */

            "& .col-group-user": { boxShadow: "inset 0 3px 0 #2563eb" },
            "& .col-group-badge": { boxShadow: "inset 0 3px 0 #d97706" },
            "& .col-group-subscription": { boxShadow: "inset 0 3px 0 #059669" },
            "& .col-group-business": { boxShadow: "inset 0 3px 0 #7c3aed" },
            "& .col-group-address": { boxShadow: "inset 0 3px 0 #0ea5e9" },

            /* HEADER */

            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
            },

            "& .MuiDataGrid-columnHeader": {
              backgroundColor: "#f8fafc",
            },

            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 700,
              fontSize: "11.5px",
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            },

            "& .MuiDataGrid-columnSeparator": {
              display: "none",
            },

            /* CELLS */

            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              fontSize: "14px",
              color: "#334155",
            },

            /* ROWS */

            "& .MuiDataGrid-row": {
              minHeight: "64px !important",
            },

            "& .MuiDataGrid-row:nth-of-type(even)": {
              backgroundColor: "#fcfcfd",
            },

            "& .MuiDataGrid-row:hover": {
              backgroundColor: "#eff6ff",
            },

            "& .MuiDataGrid-row.Mui-selected": {
              backgroundColor: "#dbeafe",
            },

            "& .MuiDataGrid-row.Mui-selected:hover": {
              backgroundColor: "#bfdbfe",
            },

            /* FOOTER */

            "& .MuiDataGrid-footerContainer": {
              borderTop: "1px solid #e2e8f0",
            },

            /* REMOVE FOCUS OUTLINE */

            "& .MuiDataGrid-cell:focus": {
              outline: "none",
            },

            "& .MuiDataGrid-cell:focus-within": {
              outline: "none",
            },

            "& .MuiDataGrid-columnHeader:focus": {
              outline: "none",
            },

            "& .MuiDataGrid-columnHeader:focus-within": {
              outline: "none",
            },
          }}
        />
      </Box>

      {/* ===================================================
          SP BADGE: "Are you sure?" dialogs
      =================================================== */}

      <SpBadgeDialogs badge={badge} />

      {/* REPORT: subscribers, users, spread by state, store downloads */}

      <UserReport open={reportOpen} onClose={() => setReportOpen(false)} users={allUsers} />

      {/* ===================================================
          USER DETAILS MODAL
      =================================================== */}

      <Dialog
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography fontWeight={700}>User Details</Typography>

            <Typography
              variant="body2"
              color="#6b7280"
              sx={{
                mt: 0.5,
              }}
            >
              Complete user and subscription information
            </Typography>
          </Box>

          <IconButton onClick={() => setSelectedUser(null)}>
            <X size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {selectedUser && (
            <Box>
              {/* =========================================
                  USER IMAGE
              ========================================= */}

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 4,
                }}
              >
                <Avatar
                  src={getImageUrl(selectedUser?.avatar_location) || undefined}
                  sx={{
                    width: 72,
                    height: 72,
                  }}
                >
                  {selectedUser?.firstname?.charAt(0)?.toUpperCase()}
                </Avatar>

                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {selectedUser.name}
                  </Typography>

                  <Typography variant="body2" color="#6b7280">
                    {selectedUser.email || "N/A"}
                  </Typography>
                </Box>
              </Box>

              {/* =========================================
                  DETAILS
              ========================================= */}

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 3,
                }}
              >
                {/* USER */}

                <Detail label="ID" value={selectedUser.id} />

                <Detail label="Name" value={selectedUser.name} />

                <Detail label="Unique ID" value={selectedUser.uniq_id} />

                <Detail label="Type" value={selectedUser.type} />

                <Detail
                  label="Trade"
                  value={Array.isArray(selectedUser.trades) ? selectedUser.trades.join(", ") : selectedUser.tradeDisplay}
                />

                <Detail label="Email" value={selectedUser.email} />

                <Detail
                  label="Phone"
                  value={
                    selectedUser.phone
                      ? `${selectedUser.phone_code || ""} ${selectedUser.phone}`
                      : "N/A"
                  }
                />

                <Detail label="Signup Date" value={formatDateTime(selectedUser.signupDate)} />

                <Detail
                  label="Account Status"
                  value={Number(selectedUser.active) === 1 ? "Active" : "Inactive"}
                />

                {/* SP BADGE (SP users only) */}

                {isSP(selectedUser) && (
                  <>
                    <Detail
                      label="SP Badge"
                      value={isBadged(selectedUser) ? "Badged" : "Not badged"}
                    />
                    <Detail
                      label="Badge Suspension"
                      value={
                        ["1", "true"].includes(
                          String(selectedUser.badge_suspended ?? selectedUser.business?.badge_suspended ?? "0").toLowerCase()
                        )
                          ? "Suspended"
                          : "Not suspended"
                      }
                    />
                    <Detail
                      label="Badge Start Date"
                      value={formatDateTime(selectedUser.badge_start_date ?? selectedUser.business?.badge_start_date)}
                    />
                    <Detail
                      label="Badge Expires"
                      value={formatDateTime(selectedUser.badge_expiry_date ?? selectedUser.business?.badge_expiry_date)}
                    />
                  </>
                )}

                {/* BUSINESS */}

                <Detail label="Business Name" value={selectedUser?.business?.business_name} />

                <Detail label="Business Email" value={selectedUser?.business?.business_email} />

                <Detail label="Business Phone" value={selectedUser?.business?.business_phone} />

                <Detail label="Business Address" value={selectedUser?.business?.business_address} />

                <Detail label="Business Area" value={selectedUser?.business?.area} />

                <Detail label="Business State" value={selectedUser?.business?.state} />

                <Detail label="Business LGA" value={selectedUser?.business?.lga} />

                <Detail label="Business Landmark" value={selectedUser?.business?.landmark} />

                <Detail label="Association ID" value={selectedUser?.business?.association_id} />

                <Detail
                  label="State Residency ID"
                  value={selectedUser?.business?.state_residency_id}
                />

                <Detail
                  label="Business Verified"
                  value={
                    Number(selectedUser?.business?.verified) === 1 ? "Verified" : "Not Verified"
                  }
                />

                {/* SUBSCRIPTION */}

                <Detail
                  label="Subscription"
                  value={selectedUser?.subscription ? "Subscribed" : "No Subscription"}
                />

                <Detail label="Plan" value={selectedUser?.subscriptionType} />

                <Detail
                  label="Base Amount"
                  value={
                    selectedUser?.subscription ? formatCurrency(selectedUser?.baseAmount) : "N/A"
                  }
                />

                <Detail
                  label="Amount Paid"
                  value={
                    selectedUser?.subscription ? formatCurrency(selectedUser?.amountPaid) : "N/A"
                  }
                />

                <Detail
                  label="Valid From"
                  value={
                    selectedUser?.subscription ? formatDateTime(selectedUser?.validFrom) : "N/A"
                  }
                />

                <Detail
                  label="Valid To"
                  value={selectedUser?.subscription ? formatDateTime(selectedUser?.validTo) : "N/A"}
                />

                <Detail
                  label="Subscription Status"
                  value={
                    selectedUser?.subscription
                      ? selectedUser?.subscriptionStatus === "active"
                        ? "Active"
                        : "Expired"
                      : "N/A"
                  }
                />

                <Detail
                  label="Package"
                  value={selectedUser?.subscription ? selectedUser?.packageName : "N/A"}
                />

                <Detail
                  label="Payment Status"
                  value={selectedUser?.subscription ? selectedUser?.paymentStatus : "N/A"}
                />

                <Detail
                  label="Transaction Reference"
                  value={selectedUser?.subscription ? selectedUser?.transactionRef : "N/A"}
                />

                <Detail
                  label="Promo Applied"
                  value={selectedUser?.subscription ? selectedUser?.promoApplied : "N/A"}
                />

                <Detail
                  label="Promo Type"
                  value={selectedUser?.subscription ? selectedUser?.promoType : "N/A"}
                />

                <Detail
                  label="Promo Amount"
                  value={selectedUser?.subscription ? formatPromoAmount(selectedUser) : "N/A"}
                />

                <Detail
                  label="Promo Description"
                  value={selectedUser?.subscription ? selectedUser?.promoDescription : "N/A"}
                />

                {/* ADDRESS */}

                {selectedUser?.addressList?.length ? (
                  selectedUser.addressList.map((item, index) => {
                    const suffix =
                      selectedUser.addressList.length > 1 ? ` ${index + 1}` : "";

                    return (
                      <React.Fragment key={`${item.address}-${index}`}>
                        <Detail label={`Address${suffix}`} value={item.address} />

                        <Detail label={`Area${suffix}`} value={item.area} />

                        <Detail label={`Landmark${suffix}`} value={item.landmark} />

                        <Detail label={`LGA${suffix}`} value={item.lga} />

                        <Detail label={`State${suffix}`} value={item.state} />

                        {item.latitude !== null && item.latitude !== undefined && (
                          <Detail label={`Latitude${suffix}`} value={item.latitude} />
                        )}

                        {item.longitude !== null && item.longitude !== undefined && (
                          <Detail label={`Longitude${suffix}`} value={item.longitude} />
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <Detail label="Address" value="N/A" />
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

/* =========================================================
   DETAIL COMPONENT
========================================================= */

function Detail({ label, value }) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          color: "#9ca3af",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          mb: 0.5,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontSize: 14,
          fontWeight: 500,
          color: "#374151",
          wordBreak: "break-word",
        }}
      >
        {value === null || value === undefined || value === "" ? "N/A" : String(value)}
      </Typography>
    </Box>
  );
}