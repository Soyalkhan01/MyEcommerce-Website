import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./OwnerProfile.css";

const BASE_URL =
  window.location.hostname === "localhost"
    ? "http://127.0.0.1:5000"
    : import.meta.env.VITE_BASE_URL;

export default function OwnerProfile() {

  const navigate = useNavigate();

  const [profile, setProfile] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [view, setView] = useState("profile");

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {

    axios
      .get(`${BASE_URL}/admin/owner-profile`)
      .then((res) => {
        if (res.data.success) {
          setProfile(res.data.profile);
        }
      })
      .catch(() => console.log("Profile not found"));

  }, []);


  const handleChange = (e) => {

    if (!editMode) return;

    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });

  };

  const handleFileChange = (e) => {

    if (!editMode) return;

    setImageFile(e.target.files[0]);

  };

  const handleSave = async () => {

    try {

      const formData = new FormData();

      Object.keys(profile).forEach((key) => {
        formData.append(key, profile[key]);
      });

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await axios.post(
        `${BASE_URL}/admin/owner-profile`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data.success) {

        alert("Profile Updated Successfully");

        setProfile(res.data.profile);
        setEditMode(false);
        setImageFile(null);

      }

    } catch {

      alert("Network Error");

    }

  };

  const handleLogout = () => {

    localStorage.removeItem("adminLoggedIn");

    navigate("/admin/login");

  };

  const handlePasswordChange = (e) => {

    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });

  };

  const handleUpdatePassword = async () => {

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {

      const res = await axios.post(
        `${BASE_URL}/admin/change-password`,
        passwordData
      );

      if (res.data.success) {

        alert("Password Updated");

        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });

        setView("profile");

      } else {

        alert(res.data.message || "Password update failed");

      }

    } catch {

      alert("Network Error");

    }

  };

  const profileImage =
    imageFile
      ? URL.createObjectURL(imageFile)
      : profile.image
        ? profile.image.startsWith("http")
          ? profile.image
          : "${BASE_URL}${profile.image}"
        : "/default-avatar.png";

  return (

    <div className="owner-profile-wrapper">


      <div className="owner-left">

        <img src={profileImage} alt="avatar" className="owner-avatar" />

        {editMode && (
          <input type="file" onChange={handleFileChange} />
        )}

        <h3 className="owner-name">{profile.name || "Owner Name"}</h3>
        <p className="owner-role">{profile.role || "Admin"}</p>

        <div className="owner-menu">

          <button
            className={view === "profile" ? "active" : ""}
            onClick={() => setView("profile")}
          >
            Personal Information
          </button>

          <button
            className={view === "password" ? "active" : ""}
            onClick={() => setView("password")}
          >
            Password
          </button>

          <button onClick={handleLogout}>
            Log Out
          </button>

        </div>

      </div>

      <div className="owner-right">

        {view === "profile" && (

          <>
            <h2 className="owner-title">Personal Information</h2>

            <div className="owner-form">

              <input name="name" value={profile.name || ""} onChange={handleChange} placeholder="First Name" disabled={!editMode} />

              <input name="role" value={profile.role || ""} onChange={handleChange} placeholder="Last Name" disabled={!editMode} />

              <input className="full" name="email" value={profile.email || ""} onChange={handleChange} placeholder="Email" disabled={!editMode} />

              <input className="full" name="location" value={profile.location || ""} onChange={handleChange} placeholder="Address" disabled={!editMode} />

              <input name="phone" value={profile.phone || ""} onChange={handleChange} placeholder="Phone" disabled={!editMode} />

              <input name="age" value={profile.age || ""} onChange={handleChange} placeholder="Age" disabled={!editMode} />

              <input name="rating" value={profile.rating || ""} onChange={handleChange} placeholder="Rating" disabled={!editMode} />

              <input name="reviews" value={profile.reviews || ""} onChange={handleChange} placeholder="Reviews" disabled={!editMode} />

            </div>

            {editMode ? (

              <div className="owner-buttons">

                <button
                  className="discard-btn"
                  onClick={() => setEditMode(false)}
                >
                  Discard Changes
                </button>

                <button
                  className="save-btn"
                  onClick={handleSave}
                >
                  Save Changes
                </button>

              </div>

            ) : (

              <div className="owner-buttons">

                <button
                  className="save-btn"
                  onClick={() => setEditMode(true)}
                >
                  Edit Profile
                </button>

              </div>

            )}

          </>
        )}

        {view === "password" && (

          <>
            <h2 className="owner-title">Change Password</h2>

            <div className="owner-form">

              <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} placeholder="Current Password" className="full" />

              <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} placeholder="New Password" className="full" />

              <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} placeholder="Confirm Password" className="full" />

            </div>

            <div className="owner-buttons">

              <button
                className="save-btn"
                onClick={handleUpdatePassword}
              >
                Update Password
              </button>

            </div>

          </>
        )}

      </div>

    </div>

  );
}