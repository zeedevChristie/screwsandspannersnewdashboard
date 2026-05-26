import { useState } from "react";
import AddPromotionModal from "./addPromotionModal";

export default function PromotionsHeader() {
  const [openModal, setOpenModal] = useState(false);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Promotions</h2>
          <p className="text-sm text-gray-500">
            Manage promotions, subscription plans, and promo codes
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <select className="border rounded-md px-3 py-2 text-sm">
            <option>All Status</option>
            <option>Active</option>
            <option>Scheduled</option>
          </select>

          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="border rounded-md pl-9 pr-3 py-2 text-sm"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">
              🔍
            </span>
          </div>

          <button
            onClick={() => setOpenModal(true)}
            className="bg-black text-white text-sm px-4 py-2 rounded-md hover:bg-gray-800 transition"
          >
            + Add New Promotion
          </button>
        </div>
      </div>

      {/* Modal */}
      <AddPromotionModal
        open={openModal}
        onClose={() => setOpenModal(false)}
      />
    </>
  );
}
