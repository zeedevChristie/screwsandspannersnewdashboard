import { useEffect, useRef, useState } from "react";
import PromotionsFormInput from "./promotionsFormInput";
import PromotionsCategoryDrawer from "./PromotionsCategoryDrawer";

export default function AddPromotionModal({ open, onClose }) {
  const [showDrawer, setShowDrawer] = useState(false);
  const modalRef = useRef(null);

  // ESC KEY CLOSE
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (open) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  // LOCK BACKGROUND SCROLL
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* BACKDROP */}
      <div
        className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
        onMouseDown={onClose}
      >
        {/* MODAL */}
        <div
          ref={modalRef}
          onMouseDown={(e) => e.stopPropagation()}
          className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        >
          {/* HEADER */}
          <div className="p-6 border-b flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold">Add Promotion</h2>
              <p className="text-sm text-gray-500">
                Set up a new promotional offer with discount details and time frame
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>

          {/* SCROLLABLE CONTENT */}
          <div className="p-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PromotionsFormInput label="Promotion Name" placeholder="Enter preferred name" />
              <PromotionsFormInput label="Limit (optional)" placeholder="0" />

              <div className="md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe what this is about"
                  className="w-full border rounded-lg px-4 py-2 text-sm"
                />
              </div>

              <PromotionsFormInput label="Discount Type" placeholder="Select type" />
              <PromotionsFormInput label="Value" placeholder="0" />

              <PromotionsFormInput label="Start Date" type="date" />
              <PromotionsFormInput label="End Date" type="date" />
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Applicable for</p>
                <button
                  onClick={() => setShowDrawer(true)}
                  className="border px-4 py-2 rounded-lg text-sm w-full text-left hover:bg-gray-50"
                >
                  Select categories
                </button>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Locations</p>
                <button className="border px-4 py-2 rounded-lg text-sm w-full text-left">
                  Select locations
                </button>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Subscription Plans</p>
                <button className="border px-4 py-2 rounded-lg text-sm w-full text-left">
                  Select plans
                </button>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="p-6 border-t flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border"
            >
              Cancel
            </button>
            <button className="px-4 py-2 rounded-lg bg-gray-900 text-white">
              Add Promotion
            </button>
          </div>
        </div>
      </div>

      <PromotionsCategoryDrawer
        open={showDrawer}
        onClose={() => setShowDrawer(false)}
      />
    </>
  );
}
