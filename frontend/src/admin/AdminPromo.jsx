import { useEffect, useState } from "react";
import BASE_URL from "../config";
import "./AdminPromo.css";

function AdminPromo() {
  const [promos, setPromos] = useState([]);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    image: "",
    buttonText: "",
    buttonLink: "",
    bgColor: ""
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchPromos = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/promo`);
      const data = await res.json();
      setPromos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch promos:", err);
      setPromos([]);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = editingId
      ? `${BASE_URL}/admin/promo/${editingId}`
      : `${BASE_URL}/admin/promo`;
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed");

      setMessage(editingId ? "Promo updated!" : "Promo added!");
      setForm({ title: "", subtitle: "", image: "", buttonText: "", buttonLink: "", bgColor: "" });
      setEditingId(null);
      fetchPromos();

      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      console.error(err);
      setMessage("Operation failed!");
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleEdit = (p) => {
    setForm({
      title: p.title,
      subtitle: p.subtitle,
      image: p.image,
      buttonText: p.buttonText,
      buttonLink: p.buttonLink,
      bgColor: p.bgColor || ""
    });
    setEditingId(p.id);
  };

  const handleDelete = async (id) => {
    await fetch(`${BASE_URL}/admin/promo/${id}`, { method: "DELETE" });
    setMessage("Promo deleted!");
    fetchPromos();
  };

  const handleRecover = async (id) => {
    await fetch(`${BASE_URL}/admin/promo/recover/${id}`, { method: "PUT" });
    setMessage("Promo recovered!");
    fetchPromos();
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm("Permanent delete?")) return;
    await fetch(`${BASE_URL}/admin/promo/permanent/${id}`, { method: "DELETE" });
    setMessage("Promo permanently deleted!");
    fetchPromos();
  };

  const getPromoImageUrl = (img) => {
    if (!img) return "";
    return img.startsWith("http") ? img : `${BASE_URL}/images/${img}`;
  };

  return (
    <div className="admin-promo-container">
      <h2 className="admin-promo-heading">Admin Promo</h2>

      {message && <div className="admin-promo-message">{message}</div>}

      <form className="admin-promo-form" onSubmit={handleSubmit}>
        <input
          className="admin-promo-input"
          name="title"
          placeholder="Promo Title"
          value={form.title}
          onChange={handleChange}
          required
        />
        <input
          className="admin-promo-input"
          name="subtitle"
          placeholder="Promo Subtitle"
          value={form.subtitle}
          onChange={handleChange}
          required
        />
        <input
          className="admin-promo-input"
          name="image"
          placeholder="Image URL or Upload Path"
          value={form.image}
          onChange={handleChange}
          required
        />
        <input
          className="admin-promo-input"
          name="buttonText"
          placeholder="Button Text"
          value={form.buttonText}
          onChange={handleChange}
        />
        <input
          className="admin-promo-input"
          name="buttonLink"
          placeholder="Button Link"
          value={form.buttonLink}
          onChange={handleChange}
        />
        <input
          className="admin-promo-input"
          name="bgColor"
          placeholder="Background Color"
          value={form.bgColor}
          onChange={handleChange}
        />
        <button className="admin-promo-submit-btn" type="submit">
          {editingId ? "Update Promo" : "Add Promo"}
        </button>
      </form>

      <table className="admin-promo-table">
        <thead className="admin-promo-table-header">
          <tr>
            <th className="admin-promo-th">Image</th>
            <th className="admin-promo-th">Title</th>
            <th className="admin-promo-th">Subtitle</th>
            <th className="admin-promo-th">Actions</th>
          </tr>
        </thead>
        <tbody>
          {promos.length > 0 ? (
            promos.map((p) => (
              <tr className="admin-promo-tr" key={p.id}>
                <td className="admin-promo-td">
                  {getPromoImageUrl(p.image) ? (
                    <img src={getPromoImageUrl(p.image)} alt={p.title} className="admin-promo-thumb" />
                  ) : (
                    <span>No Image</span>
                  )}
                </td>
                <td className="admin-promo-td">{p.title}</td>
                <td className="admin-promo-td">{p.subtitle}</td>
                <td className="admin-promo-td">
                  {!p.deleted ? (
                    <>
                      <button className="admin-promo-edit-btn" onClick={() => handleEdit(p)}>Edit</button>
                      <button className="admin-promo-delete-btn" onClick={() => handleDelete(p.id)}>Delete</button>
                    </>
                  ) : (
                    <>
                      <button className="admin-promo-recover-btn" onClick={() => handleRecover(p.id)}>Recover</button>
                      <button className="admin-promo-perm-btn" onClick={() => handlePermanentDelete(p.id)}>Permanent</button>
                    </>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="admin-promo-no-data">No promos available.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPromo;