import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { fetchOrgUsers, addOrgUser, removeOrgUser } from "../services/quantiforeApi";
import { formatStockName } from "../utils/utility";


const SettingsPage: React.FC = () => {
  const userRole = sessionStorage.getItem("role");

  return (
    <div className="min-h-screen bg-teal-50 text-gray-800">
      <Navbar />
      {userRole === "admin" ? <AdminSettings /> : <UserSettings />}
    </div>
  );
};

const LicenseSection: React.FC = () => (
  <div className="bg-white rounded-lg shadow-md p-6 border">
    <h2 className="text-xl font-bold text-teal-700 mb-2">License Info</h2>
    <div className="text-gray-600">
      <p><strong>Type:</strong> Professional</p>
      <p><strong>Expires On:</strong> December 31, 2025</p>
      <p><strong>Status:</strong> <span className="text-green-600">Active</span></p>
    </div>
  </div>
);

const UserSettings: React.FC = () => (
  <div className="max-w-4xl mx-auto p-6 mt-10 space-y-10">
    <LicenseSection />
    <div className="bg-white rounded-lg shadow-md p-6 border">
      <h2 className="text-xl font-bold text-teal-700 mb-2">Shared Favorite Stocks</h2>
      <ul className="list-disc ml-6 text-gray-700 space-y-1">
        <li>Apple (AAPL) - shared with: john@org.com</li>
        <li>Google (GOOGL) - shared with: lisa@org.com</li>
        <li>Amazon (AMZN) - shared with: david@org.com</li>
      </ul>
    </div>
    <div className="bg-white rounded-lg shadow-md p-6 border">
      <h2 className="text-xl font-bold text-teal-700 mb-2">Shared Models</h2>
      <ul className="list-disc ml-6 text-gray-700 space-y-1">
        <li>Apple (AAPL) - shared with: john@org.com</li>
        <li>Google (GOOGL) - shared with: lisa@org.com</li>
        <li>Amazon (AMZN) - shared with: david@org.com</li>
      </ul>
    </div>
  </div>
);

const AdminSettings: React.FC = () => {
  const [orgUsers, setOrgUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [adding, setAdding] = useState(false);

  const organizationName = sessionStorage.getItem("organization_name") || "Organization";

  useEffect(() => {
    const controller = new AbortController();
    const loadUsers = async () => {
      try {
        const users = await fetchOrgUsers(controller.signal);
        setOrgUsers(users);
      } catch (err) {
        console.error("Failed to load organization users:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
    return () => controller.abort();
  }, []);

  const handleRemoveUser = async (userId: string) => {
    const confirmRemove = window.confirm("Are you sure you want to remove this user?");
    if (!confirmRemove) return;
  
    try {
      await removeOrgUser(userId);
      setOrgUsers((prev) => prev.filter((u) => u.user_id !== userId));
    } catch (err) {
      console.error("Error removing user:", err);
    }
  };
  

  const handleAddUser = async () => {
    if (!newUserName || !newUserEmail) return alert("Both name and email are required.");
  
    setAdding(true);
    try {
      const newUser = await addOrgUser(newUserName, newUserEmail);
      setOrgUsers((prev) => [...prev, newUser]);
      setNewUserName("");
      setNewUserEmail("");
    } catch (err) {
      console.error("Error adding user:", err);
      alert("Failed to add user.");
    } finally {
      setAdding(false);
    }
  };
  

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10 space-y-10">
    {/* Organization Title */}
    <div className="text-center mb-2">
      <h1 className="text-3xl font-extrabold text-teal-700 tracking-tight">
        {formatStockName(organizationName)}
      </h1>
    </div>
      <LicenseSection />

      <div className="bg-white rounded-lg shadow-md p-6 border">
        <h2 className="text-xl font-bold text-teal-700 mb-4">Organization Users</h2>

        {/* Add New User UI */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            placeholder="Full name"
            className="border px-3 py-2 rounded text-sm w-full sm:w-1/3"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email address"
            className="border px-3 py-2 rounded text-sm w-full sm:w-1/3"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
          />
          <button
            onClick={handleAddUser}
            disabled={adding}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded text-sm"
          >
            {adding ? "Adding..." : "Add User"}
          </button>
        </div>

        {/* User List */}
        {loading ? (
          <p className="text-gray-500">Loading users...</p>
        ) : orgUsers.length > 0 ? (
          orgUsers.map((user) => (
            <div key={user.user_id} className="flex justify-between items-center border-b py-2">
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={() => handleRemoveUser(user.user_id)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No users found.</p>
        )}
      </div>
    </div>
  );
};


export default SettingsPage;
