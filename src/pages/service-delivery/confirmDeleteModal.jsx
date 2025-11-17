import React from "react";

export default function ConfirmDeleteModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[350px] shadow-lg text-center">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">Confirm Delete</h2>
        <p className="text-sm text-gray-600 mb-5">
          Are you sure you want to delete this Service Provider? This action cannot be undone.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
          >
            Delete
          </button>
        </div> 
      </div>
    </div>
  );
}
