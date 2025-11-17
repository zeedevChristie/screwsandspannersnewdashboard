// filter/search/export helpers
export function searchRows(rows, q) {
  if (!q) return rows;
  const query = String(q).trim().toLowerCase();
  return rows.filter((r) =>
    [
      r.name,
      r.email,
      r.packageType,
      r.promoCode,
      r.details?.business,
      r.details?.location
    ].some((f) => String(f || '').toLowerCase().includes(query))
  );
}

export function filterByStatus(rows, status) {
  if (!status) return rows;
  return rows.filter((r) => r.status === status);
}

export function filterByDateRange(rows, from, to) {
  if (!from && !to) return rows;
  const fromTs = from ? new Date(from).getTime() : -Infinity;
  const toTs = to ? new Date(to).getTime() : Infinity;
  return rows.filter((r) => {
    const ts = new Date(r.dateSubscribed).getTime();
    return ts >= fromTs && ts <= toTs;
  });
}

export function filterByPackage(rows, pkg) {
  if (!pkg) return rows;
  return rows.filter((r) => r.packageType === pkg);
}

// simple CSV export
export function exportCSV(rows, filename = 'customers.csv') {
  const headers = ['Customer','Email','Package Type','Amount Paid','Validity From','Validity To','Status','Date Subscribed','Promo Code'];
  const lines = [
    headers.join(',')
  ];
  rows.forEach((r) => {
    const vals = [
      `"${r.name}"`,
      `"${r.email}"`,
      `"${r.packageType}"`,
      r.amountPaid,
      `"${r.validityFrom}"`,
      `"${r.validityTo}"`,
      `"${r.status}"`,
      `"${r.dateSubscribed}"`,
      `"${r.promoCode}"`
    ];
    lines.push(vals.join(','));
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
