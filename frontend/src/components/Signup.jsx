import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../config";
import "./Auth.css";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      alert("All fields are required");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      await axios.post(`${BASE_URL}/auth/signup`, {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      alert("Signup successful!");
      navigate("/login");
    } catch (err) {
      alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Signup failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!form.email) {
      alert("Enter your email first");
      return;
    }

    try {
      await axios.post(`${BASE_URL}/auth/forgot-password`, {
        email: form.email,
      });
      alert("Reset link sent to your email");
    } catch (err) {
      alert(err.response?.data?.message || "Error sending reset link");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Signup"}
          </button>
        </form>

        <div className="auth-links">
          <span onClick={() => navigate("/login")}>Already have account? Login</span>
        </div>

        <div className="auth-links">
          <span onClick={handleForgotPassword}>Forgot Password?</span>
        </div>
      </div>
    </div>
  );
}