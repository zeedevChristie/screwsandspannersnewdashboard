import React, { useState } from "react";

const empty = {
  name: "",
  username: "",
  businessName: "",
  category: "",
  phone: "", 
  city: "",
  accountStatus: "Active",
  completedOrders: 0,
  verification: "Pending",
  signUpDate: new Date().toISOString().slice(0,10),
  badges: ""
};

export default function AddSpModal({ onClose, onAdd }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  function update(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  function submit(e) {
    e.preventDefault();
    // Basic validation
    if (!form.name || !form.businessName || !form.category || !form.phone) {
      setError("Please fill name, business name, category and phone");
      return;
    }
    onAdd(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 modal-bg">
      <div className="bg-white rounded shadow-lg w-full max-w-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">Add Service Provider</h3>
          <button onClick={onClose} className="text-slate-600">Close</button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-3">
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input placeholder="Full name" value={form.name} onChange={e=>update("name", e.target.value)} className="border rounded px-3 py-2"/>
            <input placeholder="Username (alicesmith)" value={form.username} onChange={e=>update("username", e.target.value)} className="border rounded px-3 py-2"/>
            <input placeholder="Business name" value={form.businessName} onChange={e=>update("businessName", e.target.value)} className="border rounded px-3 py-2"/>
            <input placeholder="Category" value={form.category} onChange={e=>update("category", e.target.value)} className="border rounded px-3 py-2"/>
            <input placeholder="Phone" value={form.phone} onChange={e=>update("phone", e.target.value)} className="border rounded px-3 py-2"/>
            <input placeholder="City" value={form.city} onChange={e=>update("city", e.target.value)} className="border rounded px-3 py-2"/>
            <select value={form.accountStatus} onChange={e=>update("accountStatus", e.target.value)} className="border rounded px-3 py-2">
              <option>Active</option>
              <option>Inactive</option>
              <option>Suspended</option>
            </select>
            <input type="number" min="0" placeholder="Completed Orders" value={form.completedOrders} onChange={e=>update("completedOrders", Number(e.target.value))} className="border rounded px-3 py-2"/>
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
}
