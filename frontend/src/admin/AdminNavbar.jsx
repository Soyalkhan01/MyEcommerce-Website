import { useEffect, useState } from "react";
import BASE_URL from "../config";
import "./AdminNavbar.css";

export default function AdminNavbar() {
  const [menu, setMenu] = useState([]);
  const [deletedMenu, setDeletedMenu] = useState([]);
  const [loading, setLoading] = useState(true);

  const [config, setConfig] = useState({
    logo: { name: "", image: "" },
    search: { placeholder: "", button: "" },
    account: { greeting: "", title: "" },
    orders: { line1: "", line2: "" },
    cart: { count: 0, icon: "" }
  });

  const [form, setForm] = useState({ name: "", link: "" });

  const loadData = async () => {
    try {
      const menuRes = await fetch(`${BASE_URL}/admin/navbar/menu`);
      const configRes = await fetch(`${BASE_URL}/admin/navbar/config`);

      const menuData = await menuRes.json();
      const configData = await configRes.json();

      setMenu(menuData.filter(m => !m.deleted));
      setDeletedMenu(menuData.filter(m => m.deleted));

      setConfig({
        logo: configData.logo || { name: "", image: "" },
        search: configData.search || { placeholder: "", button: "" },
        account: configData.account || { greeting: "", title: "" },
        orders: configData.orders || { line1: "", line2: "" },
        cart: configData.cart || { count: 0, icon: "" }
      });

      setLoading(false);
    } catch (err) {
      console.error("Failed to load navbar data:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addMenu = async () => {
    if (!form.name || !form.link) return;

    await fetch(`${BASE_URL}/admin/navbar/menu`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    setForm({ name: "", link: "" });
    loadData();
  };

  const deleteMenu = async (id) => {
    await fetch(`${BASE_URL}/admin/navbar/menu/${id}`, { method: "DELETE" });
    loadData();
  };

  const recoverMenu = async (id) => {
    await fetch(`${BASE_URL}/admin/navbar/menu/${id}`, { method: "POST" });
    loadData();
  };

  const permanentDeleteMenu = async (id) => {
    if (!window.confirm("Permanently delete this menu?")) return;
    await fetch(`${BASE_URL}/admin/navbar/menu/${id}?permanent=true`, { method: "DELETE" });
    loadData();
  };

  const handleLogoFromGallery = async (file) => {
    if (!file) return;

    const fd = new FormData();
    fd.append("image", file);

    const res = await fetch(`${BASE_URL}/admin/logo/upload`, { method: "POST", body: fd });
    const data = await res.json();

    if (data.success) {
      setConfig(prev => ({
        ...prev,
        logo: {
          ...prev.logo,
          image: `${BASE_URL}/images/${data.filename}`
        }
      }));
    }
  };

  const saveConfig = async () => {
    try {
      const payload = {
        logo: config.logo,
        search: config.search,
        account: config.account,
        orders: config.orders,
        cart: config.cart
      };

      const res = await fetch(`${BASE_URL}/admin/navbar/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        alert("Navbar saved successfully!");
        loadData();
      } else {
        alert("Save failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error saving navbar. Check console.");
    }
  };

  if (loading) return <p style={{ padding: 20 }}>Loading navbar settings...</p>;

  return (
    <div className="anav-page">
      <h2>Navbar Manager</h2>

      <div className="anav-card">
        <h4>Logo</h4>
        <input
          placeholder="Logo name"
          value={config.logo.name}
          onChange={(e) => setConfig({ ...config, logo: { ...config.logo, name: e.target.value } })}
        />
        <input
          placeholder="Logo image URL (https://...)"
          value={config.logo.image}
          onChange={(e) => setConfig({ ...config, logo: { ...config.logo, image: e.target.value } })}
        />
        <p style={{ textAlign: "center", margin: "8px 0", fontSize: 13 }}>OR</p>
        <input type="file" accept="image/*" onChange={(e) => handleLogoFromGallery(e.target.files[0])} />
        {config.logo.image && <img src={config.logo.image} height="60" alt="Logo Preview" style={{ marginTop: 12 }} />}
      </div>

      <div className="anav-card">
        <h4>Menu</h4>
        <input placeholder="Menu name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Menu link" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
        <button onClick={addMenu}>Add Menu</button>

        {menu.map((m) => (
          <div key={m.id} className="anav-row">
            {m.name} — {m.link}
            <button onClick={() => deleteMenu(m.id)}>Delete</button>
          </div>
        ))}

        {deletedMenu.length > 0 && (
          <div className="anav-recover-section">
            <h4>Deleted Menus</h4>
            {deletedMenu.map((m) => (
              <div key={m.id} className="anav-row recover">
                {m.name} — {m.link}
                <button onClick={() => recoverMenu(m.id)}>Recover</button>
                <button onClick={() => permanentDeleteMenu(m.id)}>Permanent Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="anav-card">
        <h4>Search</h4>
        <input
          placeholder="Search placeholder"
          value={config.search.placeholder}
          onChange={(e) => setConfig({ ...config, search: { ...config.search, placeholder: e.target.value } })}
        />
        <input
          placeholder="Search button text"
          value={config.search.button}
          onChange={(e) => setConfig({ ...config, search: { ...config.search, button: e.target.value } })}
        />
      </div>

      <div className="anav-card">
        <h4>Account</h4>
        <input
          placeholder="Greeting"
          value={config.account.greeting}
          onChange={(e) => setConfig({ ...config, account: { ...config.account, greeting: e.target.value } })}
        />
        <input
          placeholder="Title"
          value={config.account.title}
          onChange={(e) => setConfig({ ...config, account: { ...config.account, title: e.target.value } })}
        />
      </div>

      <div className="anav-card">
        <h4>Orders</h4>
        <input
          placeholder="Line 1"
          value={config.orders.line1}
          onChange={(e) => setConfig({ ...config, orders: { ...config.orders, line1: e.target.value } })}
        />
        <input
          placeholder="Line 2"
          value={config.orders.line2}
          onChange={(e) => setConfig({ ...config, orders: { ...config.orders, line2: e.target.value } })}
        />
      </div>

      <div className="anav-card">
        <h4>Cart</h4>
        <input
          type="number"
          placeholder="Cart count"
          value={config.cart.count}
          onChange={(e) => setConfig({ ...config, cart: { ...config.cart, count: parseInt(e.target.value) || 0 } })}
        />
        <input
          placeholder="Cart icon URL"
          value={config.cart.icon}
          onChange={(e) => setConfig({ ...config, cart: { ...config.cart, icon: e.target.value } })}
        />
      </div>

      <button className="anav-save" onClick={saveConfig}>Save Navbar</button>
    </div>
  );
}