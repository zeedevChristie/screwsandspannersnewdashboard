import { useState, useEffect } from "react";
import { Filter, Search, Plus, MoreVertical } from "lucide-react";
import AddNewUserModal from "./addNewUserModal";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    setUsers([
      {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        phone: "08123456789",
        role: "Super Admin, Verification Admin",
        created: "2025-11-01",
        status: "Active",
      },
      {
        id: 2,
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "08124567890",
        role: "Supplier Admin",
        created: "2025-11-03",
        status: "Suspended",
      },
      {
        id: 3,
        name: "Mark Adams",
        email: "mark@example.com",
        phone: "08127894567",
        role: "Customer Admin",
        created: "2025-11-04",
        status: "Inactive",
      },
    ]);
  }, []);

  const handleSave = (payload) => {
    if (editData) {
      setUsers((prev) =>
        prev.map((u) => (u.id === editData.id ? { ...u, ...payload } : u))
      );
    } else {
      const newUser = {
        id: users.length + 1,
        ...payload,
        created: new Date().toISOString().split("T")[0],
        status: "Active",
      };
      setUsers((prev) => [...prev, newUser]);
    }
    setIsModalOpen(false);
    setEditData(null);
  };

  const handleAction = (type, user) => {
    setOpenMenu(null);
    if (type === "edit") {
      setEditData(user);
      setIsModalOpen(true);
    } else if (type === "status") {
      const newStatus = prompt(
        `Change status for ${user.name} (Active, Suspended, Deactivated, Inactive):`,
        user.status
      );
      if (["Active", "Suspended", "Deactivated", "Inactive"].includes(newStatus)) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, status: newStatus } : u
          )
        );
      } else if (newStatus) {
        alert("Invalid status value!");
      }
    } else if (type === "remove") {
      if (window.confirm(`Are you sure you want to remove ${user.name}?`)) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const createdDate = new Date(u.created);
    const matchFrom = fromDate ? createdDate >= new Date(fromDate) : true;
    const matchTo = toDate ? createdDate <= new Date(toDate) : true;
    return matchSearch && matchFrom && matchTo;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div>
          <h2 className="text-xl font-semibold">Admin Users</h2>
          <p className="text-gray-500 text-sm">
            Manage administrator accounts and access levels
          </p>
        </div>

        <div className="flex flex-wrap  justify-end items-center gap-28">
          <div className="flex items-center bg-white border rounded-lg px-3 py-2">
            <Search size={16} className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none text-sm w-40"
            />
          </div>

          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
            <Filter size={16} className="text-gray-500 mr-1" />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="outline-none text-sm"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="outline-none text-sm"
              />
            </div>
          </div>

          <button
            onClick={() => {
              setEditData(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            <Plus size={16} />
            Add New User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="py-3 px-4 border-b">Name</th>
              <th className="py-3 px-4 border-b">Email</th>
              <th className="py-3 px-4 border-b">Phone</th>
              <th className="py-3 px-4 border-b">Roles</th>
              <th className="py-3 px-4 border-b">Status</th>
              <th className="py-3 px-4 border-b">Created</th>
              <th className="py-3 px-4 border-b text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b hover:bg-gray-50 relative transition"
                >
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.phone}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        user.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : user.status === "Suspended"
                          ? "bg-yellow-100 text-yellow-700"
                          : user.status === "Deactivated"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{user.created}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() =>
                        setOpenMenu(openMenu === user.id ? null : user.id)
                      }
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenu === user.id && (
                      <div className="absolute right-6 mt-1 bg-white border rounded shadow-md text-left w-36 z-10">
                        <button
                          onClick={() => handleAction("edit", user)}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleAction("status", user)}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                        >
                          Change Status
                        </button>
                        <button
                          onClick={() => handleAction("remove", user)}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="text-center text-gray-500 py-6 italic"
                >
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AddNewUserModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditData(null);
        }}
        onSave={handleSave}
        editData={editData}
      />
    </div>
  );
}
