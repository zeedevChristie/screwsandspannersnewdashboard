import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export default function AddNewUserModal({ open, onClose, onSave, editData }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); // or username
  const [phone, setPhone] = useState("");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (open && editData) {
      setName(editData.name || "");
      setEmail(editData.email || editData.username || "");
      setPhone(editData.phone || "");
      setSelectedRoles(editData.role ? editData.role.split(", ").filter(Boolean) : []);
    }
    if (!open && !editData) {
      // clear when closed (optional)
      setName("");
      setEmail("");
      setPhone("");
      setSelectedRoles([]);
    }
  }, [open, editData]);

  // Close on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Click outside to close
  useEffect(() => {
    function handleClick(e) {
      if (open && modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  const toggleRole = (r) =>
    setSelectedRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      alert("Please fill required fields.");
      return;
    }
    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role: selectedRoles.join(", "),
    };
    onSave(payload);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      {/* modal box */}
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative"
        // prevent clicks inside from closing (we already handle outside clicks via ref)
        onClick={(e) => e.stopPropagation()}
      >
        {/* top-right X */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-semibold mb-4">{editData ? "Edit User" : "Add New User"}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-700 block mb-1">Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </div>

          <div>
            <label className="text-sm text-gray-700 block mb-1">Email / Username</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </div>

          <div>
            <label className="text-sm text-gray-700 block mb-1">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </div>

          {/* roles simplified for brevity */}
          <div>
            <label className="text-sm text-gray-700 block mb-1">Roles (select multiple)</label>
            <div className="flex gap-2 flex-wrap">
              {["Super Admin", "Supplier Admin", "Verification Admin", "Customer Admin"].map((r) => (
                <label key={r} className="flex items-center gap-2 px-2 py-1 border rounded cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(r)}
                    onChange={() => toggleRole(r)}
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            {/* IMPORTANT: Cancel must be type="button" */}
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
              Cancel
            </button>

            <button type="submit" className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
              {editData ? "Save changes" : "Add New User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
