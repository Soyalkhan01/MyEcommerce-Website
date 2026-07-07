import { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../config";
import "./AdminCategory.css";

export default function AdminCategory() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [parentId, setParentId] = useState("");
  const [editId, setEditId] = useState(null);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/admin/categories`);
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      alert("Failed to fetch categories from server.");
    }
  };

  const saveCategory = async () => {
    if (!name.trim() || !image.trim()) {
      alert("Name and Image URL are required");
      return;
    }

    const payload = { name, image, parentId: parentId || null };

    try {
      if (editId) {
        await axios.put(`${BASE_URL}/admin/categories/${editId}`, payload);
      } else {
        await axios.post(`${BASE_URL}/admin/categories`, payload);
      }

      setName("");
      setImage("");
      setParentId("");
      setEditId(null);
      fetchCategories();
    } catch (err) {
      console.error("Error saving category:", err);
      alert("Failed to save category.");
    }
  };

  const editCategory = (cat) => {
    setEditId(cat.id);
    setName(cat.name);
    setImage(cat.image);
    setParentId(cat.parentId || "");
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await axios.delete(`${BASE_URL}/admin/categories/${id}`);
      fetchCategories();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete category.");
    }
  };

  const recoverCategory = async (id) => {
    try {
      await axios.put(`${BASE_URL}/admin/categories/recover/${id}`);
      fetchCategories();
    } catch (err) {
      console.error("Recover failed:", err);
    }
  };

  const permanentDeleteCategory = async (id) => {
    if (!window.confirm("Permanently delete this category?")) return;
    try {
      await axios.delete(`${BASE_URL}/admin/categories/permanent/${id}`);
      fetchCategories();
    } catch (err) {
      console.error("Permanent delete failed:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="admin-category-container">
      <h2>Manage Categories</h2>

      <div className="admin-category-form">
        <input
          list="category-list"
          type="text"
          placeholder="Category Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <datalist id="category-list">
          {categories
            .filter((c) => !c.deleted && c.id !== editId)
            .map((c) => (
              <option key={c.id} value={c.name} />
            ))}
        </datalist>

        <input
          type="text"
          placeholder="Image URL"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />

        <select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
        >
          <option value="">No Parent</option>
          {categories
            .filter((c) => !c.deleted && c.id !== editId)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>

        <button onClick={saveCategory}>
          {editId ? "Update Category" : "Add Category"}
        </button>

        {editId && (
          <button
            className="cancel-btn"
            onClick={() => {
              setEditId(null);
              setName("");
              setImage("");
              setParentId("");
            }}
          >
            Cancel
          </button>
        )}
      </div>

      <ul className="admin-category-list">
        {categories.map((cat) => (
          <li key={cat.id} className={cat.deleted ? "deleted" : ""}>
            <div className="cat-left">
              <img
                src={cat.image}
                alt={cat.name}
                onError={(e) =>
                  (e.target.src = "https://via.placeholder.com/40")
                }
              />
              <span>{cat.name}</span>
              {cat.parentId && (
                <span className="parent-label">
                  (Parent: {categories.find((c) => c.id === cat.parentId)?.name || "Deleted"})
                </span>
              )}
            </div>

            <div className="cat-actions">
              {!cat.deleted ? (
                <>
                  <button onClick={() => editCategory(cat)}>Edit</button>
                  <button onClick={() => deleteCategory(cat.id)}>Delete</button>
                </>
              ) : (
                <>
                  <button onClick={() => recoverCategory(cat.id)}>Recover</button>
                  <button
                    className="permanent-btn"
                    onClick={() => permanentDeleteCategory(cat.id)}
                  >
                    Permanent Delete
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}