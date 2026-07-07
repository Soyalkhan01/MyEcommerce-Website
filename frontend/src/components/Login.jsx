import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../config";
import "./Auth.css";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser && storedUser !== "undefined") {
        const savedUser = JSON.parse(storedUser);

        if (savedUser?._id) {
          navigate("/profile");
        }
      }
    } catch (error) {
      console.log("Invalid user data in localStorage");
      localStorage.removeItem("user");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      alert("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${BASE_URL}/auth/login`, form);

      console.log("Login response:", res.data);

      const userData = {
        _id: res.data.user._id,
        name: res.data.user.name,
        email: res.data.user.email,
        profilePic: res.data.user.profilePic || "",
      };

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("userId", res.data.user._id);

      alert("Login successful!");
      navigate("/profile");
    } catch (err) {
      alert(
        "Login failed: " +
        (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!form.email) {
      alert("Please enter your email first");
      return;
    }

    try {
      await axios.post(`${BASE_URL}/auth/forgot-password`, {
        email: form.email,
      });

      alert("Password reset link sent to your email");
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>

        <form onSubmit={handleSubmit}>
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

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="forgot-password">
          <span
            style={{ cursor: "pointer" }}
            onClick={handleForgotPassword}
          >
            Forgot Password?
          </span>
        </div>

        <div className="auth-link">
          New user?{" "}
          <span
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/signup")}
          >
            Create account
          </span>
        </div>
      </div>
    </div>
  );
}