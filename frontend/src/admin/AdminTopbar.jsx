import { useEffect, useState } from "react";
import BASE_URL from "../config";
import "./admin.css";

function AdminTopbar() {
  const [topbar, setTopbar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopbar = async () => {
      try {
        const res = await fetch(`${BASE_URL}/admin/topbar`);
        if (!res.ok) throw new Error("Failed to fetch topbar");
        const data = await res.json();
        setTopbar(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load topbar");
      } finally {
        setLoading(false);
      }
    };

    fetchTopbar();
  }, []);

  if (loading) return <div className="admin-topbar">Loading...</div>;
  if (error) return <div className="admin-topbar">{error}</div>;
  if (!topbar) return <div className="admin-topbar">No topbar data</div>;

  return (
    <div className="admin-topbar">
      {topbar.title || "Admin Panel"}
    </div>
  );
}

export default AdminTopbar;