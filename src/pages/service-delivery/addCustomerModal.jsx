import React, { useState } from 'react';

export default function AddCustomerModal({ open, onClose, onAdd }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    packageType: 'Premium Monthly',
    amountPaid: 12000,
    validityFrom: '',
    validityTo: '',
    promoCode: ''
  });

  if (!open) return null;

  function update(k, v) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function submit(e) {
    e.preventDefault();
    // minimal validation
    if (!form.name || !form.email) return alert('Name and email required');
    onAdd && onAdd({ ...form, id: Date.now().toString(), status: 'Active', dateSubscribed: form.validityFrom, details: { id: `CUST-${Date.now()}` } });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form onSubmit={submit} className="relative bg-white rounded-lg shadow-lg w-full max-w-lg mx-4 p-6">
        <h3 className="text-lg font-semibold mb-3">Add Customer</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Full name" className="border rounded px-3 py-2" />
          <input value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="Email" className="border rounded px-3 py-2" />
          <input value={form.packageType} onChange={(e) => update('packageType', e.target.value)} placeholder="Package" className="border rounded px-3 py-2" />
          <input value={form.amountPaid} onChange={(e) => update('amountPaid', Number(e.target.value))} placeholder="Amount" className="border rounded px-3 py-2" />
          <input type="date" value={form.validityFrom} onChange={(e) => update('validityFrom', e.target.value)} className="border rounded px-3 py-2" />
          <input type="date" value={form.validityTo} onChange={(e) => update('validityTo', e.target.value)} className="border rounded px-3 py-2" />
          <input value={form.promoCode} onChange={(e) => update('promoCode', e.target.value)} placeholder="Promo code" className="border rounded px-3 py-2" />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white">Add</button>
        </div>
      </form>
    </div>
  );
}
