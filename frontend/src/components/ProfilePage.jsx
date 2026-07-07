import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../config";

import "./ProfilePage.css";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) navigate("/login");
    else {
      const u = JSON.parse(savedUser);
      setUser(u);
      setForm({ ...form, name: u.name, email: u.email, phone: u.phone || "" });
    }
  }, [navigate]);

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.
        // put("http://127.0.0.1:5000/auth/update", 
        put(`${BASE_URL}/auth/update`,


          form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      setMessage("Profile updated successfully!");
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);
    } catch (err) {
      setMessage(err.response?.data?.error || "Update failed");
    }
  };

  const handleForgotPassword = () => navigate("/forgot-password");

  if (!user) return null;

  return (
    <div className="settings-page">
      <div className="settings-sidebar">
        <div className="profile-card">
          <img src={user.image || "/default-profile.png"} alt={user.name} className="profile-image" />
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
        <div className="sidebar-menu">
          <button onClick={() => navigate("/profile")}>My Profile</button>
          <button onClick={handleForgotPassword}>Forgot Password</button>
        </div>
      </div>

      <div className="settings-main">
        <h1>Account Settings</h1>
        {message && <div className="message">{message}</div>}
        <div className="settings-form">
          <label>Name</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />

          <label>Email</label>
          <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />

          <label>Phone</label>
          <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />

          <label>Current Password</label>
          <input type="password" placeholder="Leave blank if not changing" value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })} />

          <label>New Password</label>
          <input type="password" placeholder="Leave blank if not changing" value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} />

          <button className="btn-update" onClick={handleUpdate}>Update Profile</button>
        </div>
      </div>
    </div>
  );
}