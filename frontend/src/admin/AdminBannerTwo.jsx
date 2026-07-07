import { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../config"; 

import "./AdminBannerTwo.css";

export default function AdminBannerTwo() {
  const [banners, setBanners] = useState([]);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    image: "",
    offer: "",
    active: true
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await axios.
      // get("http://127.0.0.1:5000/banners-two");
          get(`${BASE_URL}/banners-two`)

      setBanners(res.data);
    } catch (err) {
      console.error("Error fetching banners:", err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const saveBanner = async () => {
    if (!form.image) {
      alert("Image URL required");
      return;
    }

    try {
      if (editId) {
        // UPDATE
        await axios.
        // put(`http://127.0.0.1:5000/banners-two/${editId}`, form);
            put(`${BASE_URL}/banner-two/${editId}`,form);

      } else {
        await axios.
        // post("http://127.0.0.1:5000/banners-two", form);
            post(`${BASE_URL}/banner-two`,form);

      }

      resetForm();
      fetchBanners();
    } catch (err) {
      console.error("Error saving banner:", err);
      alert("Failed to save banner.");
    }
  };

  const editBanner = (b) => {
    setEditId(b.id);
    setForm({
      title: b.title,
      subtitle: b.subtitle,
      image: b.image,
      offer: b.offer,
      active: b.active
    });
  };

  const deleteBanner = async (id) => {
    if (!window.confirm("Delete banner permanently?")) return;

    try {
      await axios.
      // delete(`http://127.0.0.1:5000/banners-two/${id}`);
          delete(`${BASE_URL}/banner-two/${id}`);

      fetchBanners();
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  const resetForm = () => {
    setEditId(null);
    setForm({
      title: "",
      subtitle: "",
      image: "",
      offer: "",
      active: true
    });
  };

  return (
    <div className="abt-container">
      <h2>{editId ? "Edit Banner" : "Add Banner"}</h2>

      <input
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Title"
      />

      <input
        name="subtitle"
        value={form.subtitle}
        onChange={handleChange}
        placeholder="Subtitle"
      />

      <input
        name="offer"
        value={form.offer}
        onChange={handleChange}
        placeholder="Offer"
      />

      <input
        name="image"
        value={form.image}
        onChange={handleChange}
        placeholder="Image URL"
      />

      <button onClick={saveBanner}>
        {editId ? "Update" : "Add"}
      </button>

      {editId && <button onClick={resetForm}>Cancel</button>}

      <hr />

      <ul className="abt-list">
        {banners.map((b) => (
          <li key={b.id}>
            <img src={b.image} alt="" />
            <div>
              <strong>{b.title}</strong>
              <p>{b.subtitle}</p>
              <small>{b.offer}</small>
            </div>
            <div className="btn-group">
              <button onClick={() => editBanner(b)}>Edit</button>
              <button onClick={() => deleteBanner(b.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}