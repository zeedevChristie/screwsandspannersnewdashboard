import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * ViewCustomerModal
 * - Backdrop and panel are siblings with explicit z-index.
 * - Panel uses stopPropagation to prevent backdrop clicks from closing modal when interacting inside.
 * - Includes an inline Tabs example so you can see onClick working.
 */
export default function ViewCustomerModal({ customer, onClose }) {
  if (!customer) return null;

  const [activeTab, setActiveTab] = useState('payment');

  const safeDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return String(d);
    }
  };

  const initials = String(customer.name || '')
    .split(' ')
    .filter(Boolean)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  const subscription = (customer.subscription && { ...customer.subscription }) ?? {
    package: customer.packageType ?? customer.package ?? '—',
    amountPaid: customer.amountPaid ?? customer.amount ?? 0,
    validityFrom: customer.validityFrom ?? null,
    validityTo: customer.validityTo ?? null,
    promoCode: customer.promoCode ?? '',
    subscribedAt: customer.dateSubscribed ?? null,
    servicesUsed: customer.details?.servicesUsed ?? 0,
    servicesLimit: customer.details?.servicesLimit ?? 0,
    autoRenew: customer.autoRenew ?? false
  };

  const det = customer.details ?? {
    id: customer.id ?? null,
    phone: customer.phone ?? '—',
    location: customer.location ?? '—',
    joined: customer.joined ?? customer.dateSubscribed ?? null,
    business: customer.business ?? '',
    jobs: customer.jobs ?? []
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'payment', label: 'Payment History' },
    { key: 'usage', label: 'Service Usage' },
    { key: 'activity', label: 'Activity' }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="View customer"
    >
      {/* Backdrop (lower z-index) */}
      <div
        className="absolute inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel (higher z-index) */}
      <div
        className="relative z-50 bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()} // prevent backdrop click when interacting inside
      >
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Header */}
          <div className=" items-center gap-4">
            <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center text-3xl font-semibold text-gray-800">
              {initials}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{customer.name}</h3>
              <p className="text-sm text-gray-500">{det.business || ''}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border">Active</span>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border">Verified</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-2">
            {/* Top details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{customer.email ?? '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium">{det.phone}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Location</span><span className="font-medium">{det.location}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Joined</span><span className="font-medium">{safeDate(det.joined)}</span></div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                <div className="flex justify-between"><span className="text-gray-500">Package</span><span className="font-medium">{subscription.package}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Amount Paid</span><span className="font-medium">₦{Number(subscription.amountPaid || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Validity</span><span className="font-medium">{safeDate(subscription.validityFrom)} — {safeDate(subscription.validityTo)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Promo</span><span className="font-medium">{subscription.promoCode || '—'}</span></div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4">
              <div className="flex gap-4 border-b border-gray-200">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      // debug log to confirm clicks
                      // console.log('tab clicked', t.key);
                      setActiveTab(t.key);
                    }}
                    className={`py-3 text-sm font-medium ${activeTab === t.key ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded p-4 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Subscribed At</span><span>{safeDate(subscription.subscribedAt)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Auto Renewal</span><span>{subscription.autoRenew ? 'Enabled' : 'Disabled'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Services Remaining</span><span>{(subscription.servicesLimit || 0) - (subscription.servicesUsed || 0)}</span></div>
                    </div>

                    <div className="bg-gray-50 rounded p-4 text-sm">
                      <div className="text-sm"><span className="text-gray-500">Customer ID:</span> <span className="font-medium">{det.id ?? customer.id}</span></div>
                      <div className="text-sm mt-2"><span className="text-gray-500">Business:</span> <span className="font-medium">{det.business || '—'}</span></div>
                    </div>
                  </div>
                )}

                {activeTab === 'payment' && (
                  <div className="bg-white rounded shadow divide-y">
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{safeDate(subscription.subscribedAt)}</div>
                        <div className="text-xs text-gray-500">Subscription • {subscription.package}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-semibold">₦{Number(subscription.amountPaid || 0).toLocaleString()}</div>
                        <button onClick={() => alert('Download invoice placeholder')} className="text-sm px-3 py-1 border rounded">Download</button>
                      </div>
                    </div>

                    {Array.isArray(det.jobs) && det.jobs.length > 0 ? det.jobs.map((j) => (
                      <div key={j.id ?? `${j.title}-${j.date}`} className="p-3 flex items-center justify-between text-sm">
                        <div>
                          <div className="font-medium">{j.title}</div>
                          <div className="text-xs text-gray-500">{j.client ? `${j.client} • ` : ''}{safeDate(j.date)}</div>
                        </div>
                        <div className="text-sm font-semibold">₦{Number(j.price || 0).toLocaleString()}</div>
                      </div>
                    )) : (
                      <div className="p-3 text-sm text-gray-500">No payment history available</div>
                    )}
                  </div>
                )}

                {activeTab === 'usage' && (
                  <div className="bg-white rounded shadow divide-y">
                    {Array.isArray(det.jobs) && det.jobs.length > 0 ? det.jobs.map((u, i) => (
                      <div key={i} className="p-3 flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-0">
                        <div className="w-full md:w-1/4 text-sm">{safeDate(u.date)}</div>
                        <div className="w-full md:w-1/3 text-sm">{u.title}</div>
                        <div className="w-full md:w-1/4 text-sm text-gray-600">{u.client || '—'}</div>
                        <div className="w-full md:w-1/6 text-sm font-medium">₦{Number(u.price || 0).toLocaleString()}</div>
                      </div>
                    )) : (
                      <div className="p-3 text-sm text-gray-500">No service usage records</div>
                    )}
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div className="bg-gray-50 rounded p-4">
                    <ul className="space-y-3">
                      {(customer.activity || []).length > 0 ? (customer.activity || []).map((a, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-2 h-2 mt-2 rounded-full bg-indigo-600" />
                          <div>
                            <div className="text-sm">{a.text}</div>
                            <div className="text-xs text-gray-500 mt-1">{a.time}</div>
                          </div>
                        </li>
                      )) : (
                        <li className="text-sm text-gray-500">No activity found</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex justify-end gap-3">
              <button className="px-4 py-2 rounded-md border" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



