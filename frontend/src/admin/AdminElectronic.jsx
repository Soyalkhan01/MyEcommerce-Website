import React, { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../config";
import "./AdminElectronic.css";

export default function AdminElectronic() {
  const [electronics, setElectronics] = useState([]);
  const [form, setForm] = useState({
    name: "",
    price: "",
    oldPrice: "",
    stock: "",
    images: [],
    offer: "", // e.g., "30% OFF"
    rating: "",
    reviews: "",
    shortDesc: "",
    brand: "",
    model: "",
    material: "",
    warranty: "",
    colors: "",
    sizes: "",
    highlights: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [webImage, setWebImage] = useState("");

  const fetchElectronics = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/admin/electronics`);
      setElectronics(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setElectronics([]);
    }
  };

  useEffect(() => {
    fetchElectronics();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      let updated = { ...prev, [name]: value };

      if (name === "oldPrice" || name === "offer") {
        const oldPriceNum = Number(updated.oldPrice) || 0;

        let offerNum = 0;
        if (updated.offer) {
          const match = updated.offer.match(/\d+/);
          offerNum = match ? Number(match[0]) : 0;
        }

        if (oldPriceNum) {
          const finalPrice = oldPriceNum * (1 - offerNum / 100);
          updated.price = Math.round(finalPrice * 100) / 100;
        }
      }

      return updated;
    });
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    const uploaded = [];
    for (let file of files) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await axios.post(`${BASE_URL}/upload`, fd);
        if (res.data.filename) uploaded.push(res.data.filename);
      } catch (err) {
        console.error(err);
      }
    }
    setForm((prev) => ({ ...prev, images: [...prev.images, ...uploaded] }));
    setUploading(false);
  };

  const handleAddWebImage = () => {
    if (!webImage) return;
    setForm((prev) => ({ ...prev, images: [...prev.images, webImage] }));
    setWebImage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      price: Number(form.price) || 0,
      oldPrice: form.oldPrice ? Number(form.oldPrice) : undefined,
      stock: Number(form.stock) || 0,
      colors: form.colors ? form.colors.split(",").map((c) => c.trim()) : [],
      sizes: form.sizes ? form.sizes.split(",").map((s) => s.trim()) : [],
      highlights: form.highlights ? form.highlights.split(",").map((h) => h.trim()) : [],
      specifications: {
        Brand: form.brand,
        Model: form.model,
        Material: form.material,
        Warranty: form.warranty,
      },
    };

    try {
      if (editingId) {
        await axios.put(`${BASE_URL}/admin/electronics/${editingId}`, payload);
        setMessage("Product updated!");
      } else {
        const res = await axios.post(`${BASE_URL}/admin/electronics`, payload);
        setElectronics((prev) => [res.data, ...prev]);
        setMessage("Product added!");
      }

      resetForm();
      setTimeout(() => setMessage(null), 3000);
      fetchElectronics();
    } catch (err) {
      console.error(err);
      setMessage("Operation failed!");
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      price: "",
      oldPrice: "",
      stock: "",
      images: [],
      offer: "",
      rating: "",
      reviews: "",
      shortDesc: "",
      brand: "",
      model: "",
      material: "",
      warranty: "",
      colors: "",
      sizes: "",
      highlights: "",
    });
    setEditingId(null);
  };

  const handleEdit = (item) => {
    setForm({
      name: item.name || "",
      price: item.price || "",
      oldPrice: item.oldPrice || "",
      stock: item.stock || "",
      images: item.images || [],
      offer: item.offer || "",
      rating: item.rating || "",
      reviews: item.reviews || "",
      shortDesc: item.shortDesc || "",
      brand: item.specifications?.Brand || "",
      model: item.specifications?.Model || "",
      material: item.specifications?.Material || "",
      warranty: item.specifications?.Warranty || "",
      colors: item.colors?.join(", ") || "",
      sizes: item.sizes?.join(", ") || "",
      highlights: item.highlights?.join(", ") || "",
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`${BASE_URL}/admin/electronics/${id}`);
    setMessage("Product deleted!");
    fetchElectronics();
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRecover = async (id) => {
    await axios.post(`${BASE_URL}/admin/electronics/${id}/recover`);
    setMessage("Product recovered!");
    fetchElectronics();
    setTimeout(() => setMessage(null), 3000);
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm("Are you sure to permanently delete?")) return;
    await axios.delete(`${BASE_URL}/admin/electronics/${id}/permanent`);
    setMessage("Product permanently deleted!");
    fetchElectronics();
    setTimeout(() => setMessage(null), 3000);
  };

  // ================= FILTER & SORT =================
  const filteredElectronics = electronics
    .filter((e) => e.name && e.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.id - a.id);

  return (
    <div className="ae-page">
      <h2>Manage Electronics</h2>

      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="ae-search"
      />

      {message && <div className="ae-message">{message}</div>}

      <form onSubmit={handleSubmit} className="ae-form">
        <input type="text" name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        <input type="text" name="shortDesc" placeholder="Short Description" value={form.shortDesc} onChange={handleChange} />

        {/* OLD PRICE */}
        <input
          type="number"
          name="oldPrice"
          placeholder="Old Price"
          value={form.oldPrice}
          onChange={handleChange}
        />

        {/* OFFER (like 30% OFF) */}
        <input
          type="text"
          name="offer"
          placeholder="Offer (e.g., 30% OFF)"
          value={form.offer}
          onChange={handleChange}
        />

        {/* FINAL PRICE (auto filled) */}
        <input
          type="number"
          name="price"
          placeholder="Final Price"
          value={form.price ? form.price.toFixed(2) : ""}
          readOnly
        />

        <input type="number" name="stock" placeholder="Stock" value={form.stock} onChange={handleChange} />
        <input type="number" step="0.1" name="rating" placeholder="Rating" value={form.rating} onChange={handleChange} />
        <input type="number" name="reviews" placeholder="Reviews" value={form.reviews} onChange={handleChange} />
        <input type="text" name="brand" placeholder="Brand" value={form.brand} onChange={handleChange} />
        <input type="text" name="model" placeholder="Model" value={form.model} onChange={handleChange} />
        <input type="text" name="material" placeholder="Material" value={form.material} onChange={handleChange} />
        <input type="text" name="warranty" placeholder="Warranty" value={form.warranty} onChange={handleChange} />
        <input type="text" name="colors" placeholder="Colors (comma separated)" value={form.colors} onChange={handleChange} />
        <input type="text" name="sizes" placeholder="Sizes (comma separated)" value={form.sizes} onChange={handleChange} />
        <textarea name="highlights" placeholder="Highlights (comma separated)" value={form.highlights} onChange={handleChange} />

        <input type="file" multiple onChange={handleFileChange} />
        <div className="ae-web-image">
          <input type="text" placeholder="Add image URL" value={webImage} onChange={(e) => setWebImage(e.target.value)} />
          <button type="button" onClick={handleAddWebImage}>Add URL</button>
        </div>

        <button type="submit">{editingId ? "Update Product" : "Add Product"}</button>
        {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
      </form>

      {/* LIST */}
      <div className="ae-list">
        {filteredElectronics.map((item) => (
          <div key={item.id} className="ae-card">
            <div className="ae-image-wrapper">
              {item.images?.length ? <img src={item.images[0]} alt={item.name} /> : <div>No Image</div>}
            </div>
            <div className="ae-details">
              <h4>{item.name}</h4>
              <p>
                ₹{item.price.toFixed(2)}{" "}
                {item.oldPrice && <span className="old-price">₹{item.oldPrice}</span>}
              </p>
              {item.offer && <p className="inline-offer">{item.offer}</p>}
              <p>Stock: {item.stock > 0 ? item.stock : "Out of Stock"}</p>
              {item.rating && <p>⭐ {item.rating} {item.reviews && `(${item.reviews} reviews)`}</p>}
              {item.shortDesc && <p>{item.shortDesc}</p>}
            </div>
            <div className="ae-actions">
              {!item.deleted ? (
                <>
                  <button onClick={() => handleEdit(item)}>Edit</button>
                  <button onClick={() => handleDelete(item.id)}>Delete</button>
                </>
              ) : (
                <>
                  <button onClick={() => handleRecover(item.id)}>Recover</button>
                  <button onClick={() => handlePermanentDelete(item.id)}>Permanent Delete</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}