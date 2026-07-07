import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminAuth.css";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  // Login handler
  const handleLogin = (e) => {
    e.preventDefault();

    const admins = JSON.parse(localStorage.getItem("admins")) || [];
    const user = admins.find(
      (a) => a.email === email.trim() && a.password === password.trim()
    );

    if (user) {
      localStorage.setItem("adminLoggedIn", JSON.stringify(user));
      navigate("/admin/dashboard");
    } else {
      alert("Invalid email or password!");
    }
  };

  const handlePasswordReset = (e) => {
    e.preventDefault();
    if (!resetEmail.trim() || !newPassword.trim()) {
      alert("Please fill both fields");
      return;
    }
    const admins = JSON.parse(localStorage.getItem("admins")) || [];
    const adminIndex = admins.findIndex((a) => a.email === resetEmail.trim());

    if (adminIndex === -1) {
      alert("Email not found!");
      return;
    }

    admins[adminIndex].password = newPassword.trim();
    localStorage.setItem("admins", JSON.stringify(admins));

    alert("Password reset successful! Please login with new password.");
    setShowReset(false);
    setResetEmail("");
    setNewPassword("");
  };

  return (
    <div className="admin-auth">
      {!showReset ? (
        <>
          <h2>Admin Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Login</button>
          </form>
          <p>
            Don't have an account? <a href="/admin/signup">Sign Up</a>
          </p>
          <p style={{ marginTop: "15px" }}>
            <button
              className="link-btn"
              onClick={() => setShowReset(true)}
              type="button"
            >
              Forgot Password?
            </button>
          </p>
        </>
      ) : (
        <>
          <h2>Reset Password</h2>
          <form onSubmit={handlePasswordReset}>
            <input
              type="email"
              placeholder="Enter your registered email"
              value={resetEmail}
              required
              onChange={(e) => setResetEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              required
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button type="submit">Reset Password</button>
          </form>
          <p style={{ marginTop: "15px" }}>
            <button
              className="link-btn"
              onClick={() => setShowReset(false)}
              type="button"
            >
              Back to Login
            </button>
          </p>
        </>
      )}
    </div>
  );
}

export default AdminLogin;
