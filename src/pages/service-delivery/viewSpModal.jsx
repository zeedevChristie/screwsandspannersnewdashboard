import React from "react";

export default function ViewSPModal({
  open,
  onClose,
  row,
  isEditing = false,
  onChange,
  onSave,
}) {
  if (!open || !row) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEditing ? "Edit Service Provider Profile" : "Service Provider Profile"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Profile Section */}
        <div className="flex items-center gap-6 mb-6">
          <img
            src={`https://app.api.screwsandspanners.com/${row.avatar_location}`}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-4 border-indigo-200 shadow-md"
          />
          <div>
            <h3 className="text-xl font-semibold text-gray-700">{row.fullName}</h3>
            <p className="text-sm text-gray-500">{row.business_name}</p>
            <div className="flex gap-2 mt-2">
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Active</span>
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">Verified</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">Top Rated</span>
            </div>
          </div>
        </div>

        {/* Metrics */}
        {!isEditing && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <Metric label="Total Revenue" value="₦20,000" />
            <Metric label="Total Jobs" value="42" />
            <Metric label="Active Jobs" value="1" />
            <Metric label="Completion Rate" value="92%" />
            <Metric label="Rating" value="4.8" />
            <Metric label="Disputes" value="1 (2%)" />
          </div>
        )}

        {/* Personal Info */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-gray-700">
          {isEditing ? (
            <>
              <Editable label="Full Name" value={row.fullName} field="fullName" onChange={onChange} />
              <Editable label="Email" value={row.email} field="email" onChange={onChange} />
              <Editable label="Phone" value={row.phone} field="phone" onChange={onChange} />
              <Editable label="Business" value={row.business_name} field="business_name" onChange={onChange} />
              <Editable label="Gender" value={row.gender} field="gender" onChange={onChange} />
              <Editable label="Date of Birth" value={row.dob} field="dob" onChange={onChange} />
              <Editable label="Location" value={row.location} field="location" onChange={onChange} />
              <Editable label="Category" value={row.category} field="category" onChange={onChange} />
            </>
          ) : (
            <>
              <Info label="Full Name" value={row.fullName} />
              <Info label="Email" value={row.email} />
              <Info label="Phone" value={row.phone} />
              <Info label="Gender" value={row.gender || "—"} />
              <Info label="Date of Birth" value={row.dob || "—"} />
              <Info label="Location" value={row.location || "—"} />
              <Info label="Category" value={row.category || "—"} />
              <Info label="Joined" value={row.created_at?.split("T")[0]} />
            </>
          )}
        </div>

        {/* Verification */}
        {!isEditing && (
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-800 mb-2">Verification</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
              <Info label="Submitted" value={row.verification_submitted || "—"} />
              <Info label="Reviewed by" value={row.verification_reviewer || "—"} />
              <Info label="Document" value={row.verification_document || "—"} />
            </div>
          </div>
        )}

        {/* Skills & Categories */}
        {!isEditing && (
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-800 mb-2">Skills & Expertise</h4>
            <div className="flex flex-wrap gap-2">
              {(row.skills || ["Marketing", "Beauty"]).map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Job History */}
        {!isEditing && (
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-4">Job History</h4>
            <div className="space-y-4">
              {(row.jobs || []).map((job, i) => (
                <div key={i} className="border rounded-lg p-4 bg-gray-50">
                  <h5 className="font-semibold text-gray-700">{job.title}</h5>
                  <p className="text-sm text-gray-600 mb-2">{job.description}</p>
                  <div className="text-sm text-gray-500 grid grid-cols-2 gap-2">
                    <Info label="Completed" value={job.date} />
                    <Info label="Reviewed by" value={job.reviewer} />
                    <Info label="Price" value={`₦${job.price}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        {isEditing && (
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition"
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable components
const Metric = ({ label, value }) => (
  <div className="bg-white border rounded-lg p-3 shadow-sm text-center">
    <div className="text-xs text-gray-500">{label}</div>
    <div className="text-lg font-bold text-gray-800">{value}</div>
  </div>
);

const Info = ({ label, value }) => (
  <div>
    <span className="text-gray-500">{label}:</span> {value}
  </div>
);

const Editable = ({ label, value, field, onChange }) => (
  <label className="flex flex-col text-sm text-gray-700">
    <span className="text-gray-500 mb-1">{label}:</span>
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange({ [field]: e.target.value })}
      className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
    />
  </label>
);
