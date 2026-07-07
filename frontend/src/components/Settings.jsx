import { useState, useEffect } from "react";
import "./Settings.css";

export default function Settings() {
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    profileImage: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    password: "",
    theme: "light",
    notifications: { email: true, sms: false },
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser({
        ...user,
        ...parsed,
        notifications: parsed.notifications || { email: true, sms: false },
        theme: parsed.theme || "light",
      });
    }

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) document.body.setAttribute("data-theme", savedTheme);
  }, []);

  // Handle profile image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setUser({ ...user, profileImage: reader.result });
    };
    reader.readAsDataURL(file);
  };

  // Toggle light/dark theme
  const toggleTheme = () => {
    const newTheme = user.theme === "light" ? "dark" : "light";
    setUser({ ...user, theme: newTheme });
    document.body.setAttribute("data-theme", newTheme);
  };

  // Save all settings
  const handleSave = () => {
    if (newPassword && newPassword !== confirmPassword) {
      setMessage("Passwords do not match!");
      return;
    }

    const updatedUser = { ...user };
    if (newPassword) updatedUser.password = newPassword;

    localStorage.setItem("user", JSON.stringify(updatedUser));
    localStorage.setItem("theme", updatedUser.theme);
    document.body.setAttribute("data-theme", updatedUser.theme);

    setMessage("Settings saved successfully!");
  };

  const emailNotif = user.notifications?.email ?? true;
  const smsNotif = user.notifications?.sms ?? false;

  return (
    <div className="settings-container">
      <h2>User Settings</h2>
      {message && <p className="message">{message}</p>}

      {/* Personal Information */}
      <section>
        <h3>Personal Information</h3>
        <div className="form-group">
          <label>Profile Image:</label>
          <input type="file" onChange={handleImageChange} />
          {user.profileImage && (
            <img src={user.profileImage} alt="Profile" className="profile-preview" />
          )}
        </div>

        <div className="form-group">
          <label>First Name:</label>
          <input
            type="text"
            value={user.firstName || ""}
            onChange={(e) => setUser({ ...user, firstName: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Last Name:</label>
          <input
            type="text"
            value={user.lastName || ""}
            onChange={(e) => setUser({ ...user, lastName: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={user.email || ""}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Phone:</label>
          <input
            type="tel"
            value={user.phone || ""}
            onChange={(e) => setUser({ ...user, phone: e.target.value })}
          />
        </div>
      </section>

      {/* Address Information */}
      <section>
        <h3>Address Information</h3>
        <div className="form-group">
          <label>Street / Address:</label>
          <input
            type="text"
            value={user.address || ""}
            onChange={(e) => setUser({ ...user, address: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>City:</label>
          <input
            type="text"
            value={user.city || ""}
            onChange={(e) => setUser({ ...user, city: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>State:</label>
          <input
            type="text"
            value={user.state || ""}
            onChange={(e) => setUser({ ...user, state: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Postal Code:</label>
          <input
            type="text"
            value={user.postalCode || ""}
            onChange={(e) => setUser({ ...user, postalCode: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Country:</label>
          <input
            type="text"
            value={user.country || ""}
            onChange={(e) => setUser({ ...user, country: e.target.value })}
          />
        </div>
      </section>

      {/* Security Settings */}
      <section>
        <h3>Security Settings</h3>
        <div className="form-group">
          <label>New Password:</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Confirm Password:</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </section>

      {/* Preferences */}
      <section>
        <h3>Preferences</h3>
        <div className="form-group">
          <label>Email Notifications:</label>
          <input
            type="checkbox"
            checked={emailNotif}
            onChange={(e) =>
              setUser({
                ...user,
                notifications: { ...user.notifications, email: e.target.checked },
              })
            }
          />
        </div>

        <div className="form-group">
          <label>SMS Notifications:</label>
          <input
            type="checkbox"
            checked={smsNotif}
            onChange={(e) =>
              setUser({
                ...user,
                notifications: { ...user.notifications, sms: e.target.checked },
              })
            }
          />
        </div>

        <div className="form-group">
          <label>Theme:</label>
          <button onClick={toggleTheme}>
            Switch to {user.theme === "light" ? "Dark" : "Light"} Theme
          </button>
        </div>
      </section>

      {/* Save Button */}
      <section>
        <button className="save-btn" onClick={handleSave}>
          Save Changes
        </button>
      </section>
    </div>
  );
}