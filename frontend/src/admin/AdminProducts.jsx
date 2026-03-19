import React, { useEffect, useState } from "react";
import BASE_URL from "../config"; // BASE_URL import
import "./AdminProducts.css";

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    price: "",
    oldPrice: "",
    stock: "",
    images: [],
    shortDesc: "",
    offer: "",
    rating: "",
    reviews: "",
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

  // ================= FETCH PRODUCTS =================
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/products`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ================= FORM HANDLERS =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    let newForm = { ...form, [name]: value };

    // ===== AUTOMATIC PRICE CALCULATION =====
    if (name === "offer" || name === "oldPrice") {
      const oldPriceNum = parseFloat(newForm.oldPrice) || 0;
      const offerMatch = newForm.offer.match(/(\d+(\.\d+)?)%/);
      if (oldPriceNum && offerMatch) {
        const percent = parseFloat(offerMatch[1]);
        const newPrice = oldPriceNum - (oldPriceNum * percent) / 100;
        newForm.price = Math.round(newPrice);
      } else if (!offerMatch && oldPriceNum) {
        newForm.price = oldPriceNum;
      }
    }

    setForm(newForm);
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
        const res = await fetch(`${BASE_URL}/upload`, {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (data.filename) uploaded.push(`${BASE_URL}/images/${data.filename}`);
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

  // ================= SUBMIT =================
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

    const url = editingId
      ? `${BASE_URL}/admin/products/${editingId}`
      : `${BASE_URL}/admin/products`;
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed");

      const result = await res.json();

      setMessage(editingId ? "Product updated!" : "Product added!");
      if (!editingId) setProducts((prev) => [result, ...prev]);
      else fetchProducts();

      resetForm();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setMessage("Operation failed!");
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // ================= RESET FORM =================
  const resetForm = () => {
    setForm({
      name: "",
      price: "",
      oldPrice: "",
      stock: "",
      images: [],
      shortDesc: "",
      offer: "",
      rating: "",
      reviews: "",
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

  // ================= EDIT / DELETE / RECOVER / PERMANENT DELETE =================
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
    await fetch(`${BASE_URL}/admin/products/${id}`, { method: "DELETE" });
    setMessage("Product deleted!");
    fetchProducts();
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRecover = async (id) => {
    await fetch(`${BASE_URL}/admin/products/${id}/recover`, { method: "POST" });
    setMessage("Product recovered!");
    fetchProducts();
    setTimeout(() => setMessage(null), 3000);
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm("Are you sure to permanently delete?")) return;
    await fetch(`${BASE_URL}/admin/products/${id}/permanent`, { method: "DELETE" });
    setMessage("Product permanently deleted!");
    fetchProducts();
    setTimeout(() => setMessage(null), 3000);
  };

  // ================= FILTER & SORT =================
  const filteredProducts = products
    .filter((p) => p.name && p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.id - a.id);

  return (
    <div className="ap-page">
      <h2>Manage Products</h2>

      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="ap-search"
      />

      {message && <div className="ap-message">{message}</div>}

      <form onSubmit={handleSubmit} className="ap-form">
        <input type="text" name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        <input type="text" name="shortDesc" placeholder="Short Description" value={form.shortDesc} onChange={handleChange} />
        <input type="number" name="oldPrice" placeholder="Old Price" value={form.oldPrice} onChange={handleChange} />
        <input type="text" name="offer" placeholder="Offer (e.g. 30%)" value={form.offer} onChange={handleChange} />
        <input type="number" name="price" placeholder="Price (auto from offer)" value={form.price} readOnly />
        <input type="number" name="stock" placeholder="Stock" value={form.stock} onChange={handleChange} />
        <input type="number" step="0.1" name="rating" placeholder="Rating" value={form.rating} onChange={handleChange} />
        <input type="number" name="reviews" placeholder="Reviews" value={form.reviews} onChange={handleChange} />

        {/* Images */}
        <input type="file" multiple onChange={handleFileChange} />
        <div className="ap-web-image">
          <input type="text" placeholder="Add image URL" value={webImage} onChange={(e) => setWebImage(e.target.value)} />
          <button type="button" onClick={handleAddWebImage}>Add URL</button>
        </div>

        {/* Specifications */}
        <input type="text" name="brand" placeholder="Brand" value={form.brand} onChange={handleChange} />
        <input type="text" name="model" placeholder="Model" value={form.model} onChange={handleChange} />
        <input type="text" name="material" placeholder="Material" value={form.material} onChange={handleChange} />
        <input type="text" name="warranty" placeholder="Warranty" value={form.warranty} onChange={handleChange} />

        {/* Colors / Sizes / Highlights */}
        <input type="text" name="colors" placeholder="Colors (comma separated)" value={form.colors} onChange={handleChange} />
        <input type="text" name="sizes" placeholder="Sizes (comma separated)" value={form.sizes} onChange={handleChange} />
        <textarea name="highlights" placeholder="Highlights (comma separated)" value={form.highlights} onChange={handleChange} />

        <button type="submit">{editingId ? "Update Product" : "Add Product"}</button>
        {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
      </form>

      <div className="ap-list">
        {filteredProducts.map((item) => (
          <div key={item.id} className="ae-card">
            <div className="ae-image-wrapper">
              {item.images?.length ? <img src={item.images[0]} alt={item.name} /> : <div>No Image</div>}
            </div>
            <div className="ae-details">
              <h4>{item.name}</h4>
              <p>₹{item.price} {item.oldPrice && <span className="old-price">₹{item.oldPrice}</span>}</p>
              <p>Stock: {item.stock > 0 ? item.stock : "Out of Stock"}</p>
              {item.rating && <p>⭐ {item.rating} {item.reviews && `(${item.reviews} reviews)`}</p>}
              {item.shortDesc && <p>{item.shortDesc}</p>}

              {/* Specifications */}
              <div className="ae-specs">
                <p><b>Brand:</b> {item.specifications?.Brand || "-"}</p>
                <p><b>Model:</b> {item.specifications?.Model || "-"}</p>
                <p><b>Material:</b> {item.specifications?.Material || "-"}</p>
                <p><b>Warranty:</b> {item.specifications?.Warranty || "-"}</p>
              </div>

              {/* Colors */}
              <p><b>Colors:</b> {item.colors?.length ? item.colors.join(", ") : "-"}</p>

              {/* Sizes */}
              <p><b>Sizes:</b> {item.sizes?.length ? item.sizes.join(", ") : "-"}</p>

              {/* Highlights */}
              <p><b>Highlights:</b> {item.highlights?.length ? item.highlights.join(", ") : "-"}</p>

              {item.offer && <p className="inline-offer">{item.offer}</p>}
            </div>
            <div className="ae-actions">
              {!item.deleted ? (
                <>
                  <button className="edit-btn" onClick={() => handleEdit(item)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(item.id)}>Delete</button>
                </>
              ) : (
                <>
                  <button className="recover-btn" onClick={() => handleRecover(item.id)}>Recover</button>
                  <button className="perm-delete-btn" onClick={() => handlePermanentDelete(item.id)}>Permanent Delete</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminProducts;