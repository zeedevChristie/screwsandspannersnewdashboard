import { X, Paperclip, User, Mail, Phone, MapPin, CheckCircle, Pause, RotateCcw, Star, XCircle } from "lucide-react";
import { useRef, useState, useEffect } from "react";

export function TicketModal({ ticket, onClose }) {
  const [priority, setPriority] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);

  const fileRef = useRef(null);

  // Sync state when ticket changes
  useEffect(() => {
    if (ticket) {
      setPriority(ticket.priority || "");
      setAssignedTo(ticket.assignedTo || "");
    }
  }, [ticket]);

  if (!ticket) return null;

  const handleAttachClick = () => {
    fileRef.current?.click();
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    console.log("Message:", message);
    console.log("Files:", files);
    setMessage("");
    setFiles([]);
  };

  const initial = ticket.name?.charAt(0)?.toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white flex w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl shadow-lg divide-x">

        {/* LEFT COLUMN */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-lg font-bold">{ticket.id}</h2>
            <span className="bg-[#E2E8F0] text-sm px-2 rounded-lg text-[#153B72]">
              {ticket.category}
            </span>
          </div>

          <p className="text-gray-600 mb-6">{ticket.subject}</p>

          {/* Ticket details */}
          <div className="flex flex-wrap gap-6 text-sm mb-6">
            <div>
              <p className="text-gray-500 font-semibold">Created</p>
              <p>{ticket.time}</p>
            </div>

            <div>
              <p className="text-gray-500 font-semibold">Status</p>
              <p>{ticket.status}</p>
            </div>

            <div>
              <p className="text-gray-500 font-semibold">Assigned To</p>
              <select
                className="border rounded-lg p-1"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option>Unassigned</option>
                <option>Agent A</option>
                <option>Agent B</option>
                <option>Agent C</option>
              </select>
            </div>

            <div>
              <p className="text-gray-500 font-semibold">Priority</p>
              <select
                className="border rounded-lg p-1"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>
          </div>

          {/* Conversation */}
          <div className="border rounded-lg p-4 text-sm mb-6">
            <div>
              <div className="flex gap-4 items-center">
                <p className="font-semibold">{ticket.name}</p>
                <p className="text-gray-500 text-xs">{ticket.time}</p>
              </div>
              <p className="mt-1">{ticket.text}</p>
            </div>
          </div>

          {/* Reply */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your reply here..."
            className="w-full border rounded-lg p-3 text-sm mb-3 resize-none"
            rows={4}
          />

          <div className="flex justify-between items-start flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleAttachClick}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <Paperclip size={16} />
                Attach
              </button>

              <input
                ref={fileRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />

              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded text-xs"
                >
                  {file.name}
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleSend}
              disabled={!message.trim() && files.length === 0}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Send Reply
            </button>
          </div>
        </div>




        {/* RIGHT COLUMN */}
        <div className="p-6 flex-1 relative overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4"
          >
            <X size={18} />
          </button>

          <div className="mb-6">
            <div className="flex items-center gap-2 font-semibold mb-3">
              <User /> Customer Information
            </div>

            <div className="flex border-b pb-4 items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#153B72] flex items-center justify-center text-white font-bold">
                {initial}
              </div>

              <div>
                <p className="font-bold">{ticket.name}</p>
                <p className="text-sm">{ticket.customer}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <div className="flex items-center gap-2">
                  <Mail size={15} /> Email:
                </div>
                <p className="pl-6">{ticket.email}</p>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <Phone size={15} /> Phone:
                </div>
                <p className="pl-6">{ticket.phone}</p>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <MapPin size={15} /> Location:
                </div>
                <p className="pl-6">{ticket.location}</p>
              </div>
            </div>
          </div>

          <div >
            <h3 className="text-lg font-bold mb-3">Ticket Timeline</h3>
            <p className="flex justify-between pb-2"><span>Created:</span> 1/8/2026</p>
            <p className="flex justify-between pb-2"><span>Last Updated:</span> 1/8/2026</p>
            <p className="flex justify-between pb-2"><span>Response Time:</span> 1h 30m</p>
          </div>
          <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">Actions</h3>

      <div className="space-y-3">
        {/* Mark as Resolved */}
        <button className="w-full flex items-center gap-3 
                           border rounded-lg px-4 py-3 
                           hover:bg-gray-50 transition">
          <CheckCircle size={18} className="text-green-600" />
          <span>Mark as Resolved</span>
        </button>

        {/* Pause Ticket */}
        <button className="w-full flex items-center gap-3 
                           border rounded-lg px-4 py-3 
                           hover:bg-gray-50 transition">
          <Pause size={18} className="text-gray-600" />
          <span>Pause Ticket</span>
        </button>

        {/* Reopen Ticket */}
        <button className="w-full flex items-center gap-3 
                           border rounded-lg px-4 py-3 
                           hover:bg-gray-50 transition">
          <RotateCcw size={18} className="text-gray-600" />
          <span>Reopen Ticket</span>
        </button>

        {/* Request Rating */}
        <button className="w-full flex items-center gap-3 
                           border rounded-lg px-4 py-3 
                           hover:bg-gray-50 transition">
          <Star size={18} className="text-gray-600" />
          <span>Request Rating</span>
        </button>

        {/* Close Ticket */}
        <button className="w-full flex items-center gap-3 
                           border rounded-lg px-4 py-3 
                           text-[#7F1D1D] border-[#7F1D1D]
                           hover:bg-[#7F1D1D] hover:text-white
                           transition">
          <XCircle size={18} />
          <span>Close Ticket</span>
        </button>
      </div>
    </div>
        </div>

      </div>
    </div>
  );
}
