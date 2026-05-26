import { useState } from "react";
import { X } from "lucide-react";

export function AddTicketModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState({
    phone: "",
    name: "",
    category: "",
    priority: "",
    subject: "",
    description: "",
    location: "",
    assignTo: "",
  });

  if (!open) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (!form.name || !form.subject) return;

    onCreate({
      name: form.name,
      subject: form.subject,
      priority: form.priority || "Medium",
      category: form.category || "General",
      text: form.description,
      location: form.location,
      phone: form.phone,
      agent: form.assignTo,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4 py-6">
      
      {/* Modal Container */}
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl 
                      max-h-[95vh] overflow-y-auto p-5 sm:p-6 relative">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <h2 className="text-lg sm:text-xl font-semibold text-center">
          Create New Support Ticket
        </h2>
        <p className="text-center text-gray-500 text-sm mb-6">
          Manually log a support ticket from phone call, walk-in, or other channels
        </p>

        <div className="space-y-4">

          {/* Phone */}
          <div>
            <label className="block text-sm mb-1">Phone Number</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter phone"
              className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base
                         focus:ring-2 focus:ring-gray-300 outline-none"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm mb-1">Customer Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base
                         focus:ring-2 focus:ring-gray-300 outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm mb-1">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base
                         focus:ring-2 focus:ring-gray-300 outline-none"
            >
              <option value="">Select options</option>
              <option value="Authentication">Authentication</option>
              <option value="Billing">Billing</option>
              <option value="Service Request">Service Request</option>
              <option value="General">General</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm mb-1">Priority</label>
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base
                         focus:ring-2 focus:ring-gray-300 outline-none"
            >
              <option value="">Select options</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm mb-1">Subject</label>
            <input
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Brief title of the issue"
              className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base
                         focus:ring-2 focus:ring-gray-300 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm mb-1">Description</label>
            <textarea
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              placeholder="Detailed description of the issue..."
              className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base
                         focus:ring-2 focus:ring-gray-300 outline-none"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm mb-1">Location</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Customer's location"
              className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base
                         focus:ring-2 focus:ring-gray-300 outline-none"
            />
          </div>

          {/* Assign */}
          <div>
            <label className="block text-sm mb-1">Assign To</label>
            <select
              name="assignTo"
              value={form.assignTo}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base
                         focus:ring-2 focus:ring-gray-300 outline-none"
            >
              <option value="">Select admin</option>
              <option value="Agent">Agent</option>
              <option value="Support Lead">Support Lead</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-black text-white px-4 py-2 rounded-lg hover:opacity-90 w-full sm:w-auto"
          >
            Create Ticket
          </button>
        </div>
      </div>
    </div>
  );
}