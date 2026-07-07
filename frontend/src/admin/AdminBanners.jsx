import React, { useEffect, useState } from "react";
import BASE_URL from "../config"; 
import "./AdminBanners.css";

const emptyForm = {
  title: "",
  subtitle: "",
  image: "",
  buttonText: "",
  buttonLink: "",
  bgColor: "#ffffff"
};

function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadBanners = () => {
    fetch(`${BASE_URL}/admin/banners`)
      .then(res => res.json())
      .then(setBanners)
      .catch(err => console.error("Failed to load banners:", err));
  };

  useEffect(loadBanners, []);

  const submitBanner = () => {
    const url = editingId
      ? `${BASE_URL}/admin/banners/${editingId}`
      : `${BASE_URL}/admin/banners`;

    fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(() => {
        setForm(emptyForm);
        setEditingId(null);
        loadBanners();
      })
      .catch(err => console.error("Submit failed:", err));
  };

  const editBanner = (banner) => {
    setForm(banner);
    setEditingId(banner.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteBanner = async (id) => {
    if (!window.confirm("Delete this banner permanently?")) return;

    await fetch(`${BASE_URL}/admin/banners/${id}`, { method: "DELETE" })
      .then(() => loadBanners())
      .catch(err => console.error("Delete failed:", err));
  };

  const uploadImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);

    fetch(`${BASE_URL}/upload`, {
      method: "POST",
      body: fd
    })
      .then(res => res.json())
      .then(data => {
        if (data.filename) {
          setForm(prev => ({
            ...prev,
            image: `${BASE_URL}/images/${data.filename}`
          }));
        }
      })
      .finally(() => setUploading(false));
  };

  const handleWebImage = (e) => {
    setForm(prev => ({ ...prev, image: e.target.value }));
  };

  return (
    <div className="admin-banner-page">
      <h2>Homepage Banner Manager</h2>

      <div className="admin-card">
        <input
          placeholder="Title"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
        />
        <input
          placeholder="Subtitle"
          value={form.subtitle}
          onChange={e => setForm({ ...form, subtitle: e.target.value })}
        />

        <label>Upload Image</label>
        <input type="file" accept="image/*" onChange={uploadImage} />
        {uploading && <small>Uploading...</small>}

        <label>Or Web Image URL</label>
        <input
          placeholder="https://example.com/banner.jpg"
          value={form.image.startsWith("http") ? form.image : ""}
          onChange={handleWebImage}
        />

        {form.image && (
          <img src={form.image} alt="preview" className="preview-img" />
        )}

        <input
          placeholder="Button Text"
          value={form.buttonText}
          onChange={e => setForm({ ...form, buttonText: e.target.value })}
        />
        <input
          placeholder="Button Link"
          value={form.buttonLink}
          onChange={e => setForm({ ...form, buttonLink: e.target.value })}
        />

        <label>Background Color</label>
        <input
          type="color"
          value={form.bgColor}
          onChange={e => setForm({ ...form, bgColor: e.target.value })}
        />

        <button onClick={submitBanner}>
          {editingId ? "Update Banner" : "Add Banner"}
        </button>
      </div>

      {banners.map(banner => (
        <div
          key={banner.id}
          className="slider-banner admin-preview"
          style={{ backgroundColor: banner.bgColor || "#fff" }}
        >
          <div className="slider-content">
            <h1>{banner.title}</h1>
            <p>{banner.subtitle}</p>
            {banner.buttonText && (
              <span className="slider-btn">{banner.buttonText}</span>
            )}
          </div>

          {banner.image && (
            <div className="slider-image">
              <img src={banner.image} alt={banner.title} />
            </div>
          )}

          <div className="admin-actions">
            <button className="edit" onClick={() => editBanner(banner)}>
              Edit
            </button>
            <button className="delete" onClick={() => deleteBanner(banner.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminBanners;