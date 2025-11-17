import React from 'react';

export default function ConfirmDialog({ open, title = 'Confirm', message, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="text-sm text-gray-600 mb-4">{message}</div>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-3 py-2 rounded border">Cancel</button>
          <button onClick={onConfirm} className="px-3 py-2 rounded bg-red-600 text-white">Delete</button>
        </div>
      </div>
    </div>
  );
}
