import React, { useEffect, useState } from "react";
import BASE_URL from "../config"; // <-- BASE_URL import
import "./AdminLatestProducts.css";

const emptyForm = {
  name: "",
  category: "",
  price: "",
  oldPrice: "",
  stock: "",
  rating: "",
  reviews: "",
  offer: "",
  tag: "",
  shortDesc: "",
  brand: "",
  model: "",
  material: "",
  warranty: "",
  colors: "",
  sizes: "",
  highlights: "",
  image: "",
  imageFile: null,
};

function AdminLatestProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  /* ================= FETCH PRODUCTS ================= */
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/latest-products`);
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

  /* ================= FORM HANDLERS ================= */
  const handleChange = (key, value) => {
    setForm(prev => {
      let updated = { ...prev, [key]: value };

      // ✅ Auto-calculate price if oldPrice or offer changes
      if (key === "oldPrice" || key === "offer") {
        const oldPriceNum = Number(updated.oldPrice) || 0;

        // Extract number from offer string (e.g., "30% OFF")
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

  const handleFileChange = (file) => setForm(prev => ({ ...prev, imageFile: file, image: "" }));
  const resetForm = () => { setForm(emptyForm); setEditingId(null); };

  /* ================= SUBMIT PRODUCT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = new FormData();
    Object.keys(form).forEach(key => {
      if (key === "imageFile" && form.imageFile) payload.append("imageFile", form.imageFile);
      else if (key !== "imageFile") payload.append(key, form[key] || "");
    });

    const url = editingId
      ? `${BASE_URL}/admin/latest-products/${editingId}`
      : `${BASE_URL}/admin/latest-products`;

    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, { method, body: payload });
      if (!res.ok) throw new Error("Failed to save product");
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Operation failed: " + err.message);
    }
  };

  /* ================= ACTIONS ================= */
  const editProduct = (p) => {
    setForm({
      name: p.name || "",
      category: p.category || "",
      price: p.price || "",
      oldPrice: p.oldPrice || "",
      stock: p.stock || "",
      rating: p.rating || "",
      reviews: p.reviews || "",
      offer: p.offer || "",
      tag: p.tag || "",
      shortDesc: p.shortDesc || "",
      brand: p.brand || "",
      model: p.model || "",
      material: p.material || "",
      warranty: p.warranty || "",
      colors: p.colors || "",
      sizes: p.sizes || "",
      highlights: p.highlights || "",
      image: p.image || "",
      imageFile: null,
    });
    setEditingId(p.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await fetch(`${BASE_URL}/admin/latest-products/${id}`, { method: "DELETE" });
    fetchProducts();
  };

  const recoverProduct = async (id) => {
    await fetch(`${BASE_URL}/admin/latest-products/${id}/recover`, { method: "POST" });
    fetchProducts();
  };

  const permanentDelete = async (id) => {
    if (!window.confirm("Permanently delete this product?")) return;
    await fetch(`${BASE_URL}/admin/latest-products/${id}/permanent`, { method: "DELETE" });
    fetchProducts();
  };

  /* ================= UI ================= */
  return (
    <div className="admin-page">
      <h2>Latest Products – Admin</h2>

      {/* ===== FORM ===== */}
      <form className="admin-form" onSubmit={handleSubmit}>
        <input placeholder="Product Name" value={form.name} onChange={e => handleChange("name", e.target.value)} />
        <input placeholder="Category" value={form.category} onChange={e => handleChange("category", e.target.value)} />

        {/* OLD PRICE */}
        <input type="number" placeholder="Old Price" value={form.oldPrice} onChange={e => handleChange("oldPrice", e.target.value)} />

        {/* OFFER (like 30% OFF) */}
        <input placeholder="Offer (e.g., 30% OFF)" value={form.offer} onChange={e => handleChange("offer", e.target.value)} />

        {/* FINAL PRICE (auto filled) */}
        <input type="number" placeholder="Final Price" value={form.price || ""} readOnly />

        <input type="number" placeholder="Stock" value={form.stock} onChange={e => handleChange("stock", e.target.value)} />
        <input type="number" step="0.1" placeholder="Rating" value={form.rating} onChange={e => handleChange("rating", e.target.value)} />
        <input type="number" placeholder="Reviews" value={form.reviews} onChange={e => handleChange("reviews", e.target.value)} />
        <input placeholder="Tag" value={form.tag} onChange={e => handleChange("tag", e.target.value)} />
        <input placeholder="Short Description" value={form.shortDesc} onChange={e => handleChange("shortDesc", e.target.value)} />

        {/* Electronics Fields */}
        <input placeholder="Brand" value={form.brand} onChange={e => handleChange("brand", e.target.value)} />
        <input placeholder="Model" value={form.model} onChange={e => handleChange("model", e.target.value)} />
        <input placeholder="Material" value={form.material} onChange={e => handleChange("material", e.target.value)} />
        <input placeholder="Warranty" value={form.warranty} onChange={e => handleChange("warranty", e.target.value)} />
        <input placeholder="Colors (comma separated)" value={form.colors} onChange={e => handleChange("colors", e.target.value)} />
        <input placeholder="Sizes (comma separated)" value={form.sizes} onChange={e => handleChange("sizes", e.target.value)} />
        <input placeholder="Highlights (comma separated)" value={form.highlights} onChange={e => handleChange("highlights", e.target.value)} />

        <input placeholder="Image URL" value={form.image} onChange={e => handleChange("image", e.target.value)} />
        <input type="file" accept="image/*" onChange={e => handleFileChange(e.target.files[0])} />

        <button type="submit">{editingId ? "Update Product" : "Add Product"}</button>
      </form>

      {/* ===== LIVE PREVIEW ===== */}
      {(form.name || form.image || form.imageFile) && (
        <div className="ap-product-preview">
          <h3>Live Preview</h3>
          <div className="ap-product-item">
            <div className="ap-product-info">
              <div className="ap-image-wrapper">
                {form.imageFile ? (
                  <img src={URL.createObjectURL(form.imageFile)} alt="preview" />
                ) : form.image ? (
                  <img src={form.image} alt="preview" />
                ) : (
                  <div className="ap-placeholder">No Image</div>
                )}
              </div>
              <div className="ap-details">
                <strong>{form.name}</strong>
                <p>
                  ₹{form.price} {form.oldPrice && <span className="old-price">₹{form.oldPrice}</span>}
                </p>
                {form.offer && <span className="inline-offer">{form.offer}</span>}
                <p>{form.shortDesc}</p>
                <p><b>Stock:</b> {form.stock}</p>
                <p><b>Rating:</b> ⭐ {form.rating} ({form.reviews} reviews)</p>
                <hr />
                <p><b>Brand:</b> {form.brand}</p>
                <p><b>Model:</b> {form.model}</p>
                <p><b>Material:</b> {form.material}</p>
                <p><b>Warranty:</b> {form.warranty}</p>
                <p><b>Colors:</b> {form.colors}</p>
                <p><b>Sizes:</b> {form.sizes}</p>
                {form.highlights && (
                  <>
                    <p><b>Highlights:</b></p>
                    <ul>{form.highlights.split(",").map((h, i) => <li key={i}>{h.trim()}</li>)}</ul>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== PRODUCTS TABLE ===== */}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Old Price</th>
            <th>Tag</th><th>Offer</th><th>Stock</th><th>Rating</th><th>Reviews</th>
            <th>Brand</th><th>Model</th><th>Material</th><th>Warranty</th>
            <th>Colors</th><th>Sizes</th><th>Highlights</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td><img src={p.image} alt={p.name} className="product-thumb" /></td>
              <td>{p.name}</td>
              <td>{p.category || "-"}</td>
              <td>₹{p.price}</td>
              <td>{p.oldPrice ? <span className="old-price">₹{p.oldPrice}</span> : "-"}</td>
              <td>{p.tag || "-"}</td>
              <td>{p.offer || "-"}</td>
              <td>{p.stock}</td>
              <td>{p.rating}</td>
              <td>{p.reviews}</td>
              <td>{p.brand || "-"}</td>
              <td>{p.model || "-"}</td>
              <td>{p.material || "-"}</td>
              <td>{p.warranty || "-"}</td>
              <td>{p.colors || "-"}</td>
              <td>{p.sizes || "-"}</td>
              <td>{p.highlights || "-"}</td>
              <td>
                {!p.deleted ? (
                  <>
                    <button onClick={() => editProduct(p)}>Edit</button>
                    <button onClick={() => deleteProduct(p.id)}>Delete</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => recoverProduct(p.id)}>Recover</button>
                    <button onClick={() => permanentDelete(p.id)}>Permanent</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminLatestProducts;