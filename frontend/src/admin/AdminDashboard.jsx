import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import "./AdminDashboard.css";

// Dynamic BASE_URL (same as OwnerProfile)
const BASE_URL =
  window.location.hostname === "localhost"
    ? "http://127.0.0.1:5000"
    : import.meta.env.VITE_BASE_URL;

const SummaryCard = ({ title, value, icon, bgColor }) => (
  <div className="summary-card" style={{ backgroundColor: bgColor }}>
    <div className="summary-icon">{icon}</div>
    <div className="summary-info">
      <h4>{title}</h4>
      <p>{value}</p>
    </div>
  </div>
);

const UserActivity = ({ activities }) => (
  <section className="user-activity-section">
    <h2>User Activity Log</h2>
    <div className="user-activity-list">
      {activities.length === 0 ? (
        <p>No recent activities</p>
      ) : (
        activities.map((act, idx) => (
          <div key={idx} className="user-activity-item">
            <div>
              <strong>{act.user}</strong> -{" "}
              <span className={`activity-type ${act.type.toLowerCase()}`}>
                {act.type}
              </span>
            </div>
            <div>{new Date(act.time).toLocaleString()}</div>
          </div>
        ))
      )}
    </div>
  </section>
);

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [conversionData, setConversionData] = useState(0);

  // Admin profile state
  const [adminProfile, setAdminProfile] = useState({});

  useEffect(() => {
    const admin = JSON.parse(localStorage.getItem("adminLoggedIn"));
    if (!admin) navigate("/admin/login");
  }, [navigate]);

  // Fetch all dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Admin profile
        const profileRes = await axios.get(`${BASE_URL}/admin/owner-profile`);
        if (profileRes.data.success) setAdminProfile(profileRes.data.profile);

        // Stats
        const statsRes = await axios.get(`${BASE_URL}/admin/dashboard/stats`);
        setStats(statsRes.data);

        // Orders
        const ordersRes = await axios.get(`${BASE_URL}/orders`);
        const sortedOrders = ordersRes.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setOrders(sortedOrders);

        // Products
        const productsRes = await axios.get(`${BASE_URL}/admin/dashboard/products`);
        setProducts(productsRes.data);

        // Activities
        const activitiesRes = await axios.get(`${BASE_URL}/admin/dashboard/activities`);
        setActivities(activitiesRes.data);

        // Revenue
        const revenueRes = await axios.get(`${BASE_URL}/admin/dashboard/revenue`);
        setRevenueData(revenueRes.data);

        // Conversion
        const conversionRes = await axios.get(`${BASE_URL}/admin/dashboard/conversion`);
        setConversionData(conversionRes.data.conversion || 0);

      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    };
    fetchData();
  }, []);

  const updateOrderStatus = async (orderId, status) => {
    try {
      const res = await axios.put(`${BASE_URL}/orders/${orderId}/status`, { status });
      if (res.data.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status } : o))
        );
      } else alert("Failed to update status: " + (res.data.error || "Unknown error"));
    } catch {
      alert("Network error updating order status");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    navigate("/admin/login");
  };

  // Profile image
  const profileImage =
    adminProfile.image
      ? adminProfile.image.startsWith("http")
        ? adminProfile.image
        : `${BASE_URL}${adminProfile.image}`
      : "/default-avatar.png";

  return (
    <div className="dashboard-container">
      <h1>E-Commerce Admin Dashboard</h1>
      <button className="logout-btn1" onClick={handleLogout}>Logout</button>

      <div className="dashboard-header">
        <div className="admin-profile-card" onClick={() => navigate("/admin/profile")}>
          <img src={profileImage} alt="Admin" className="admin-avatar" />
          <div>
            <h4>{adminProfile.name || "Admin"}</h4>
            <p>{adminProfile.role || "Owner"}</p>
          </div>
        </div>
      </div>

      {/* Analytics */}
      <section className="analytics-row">
        <div className="session-card">
          <h3>Sessions Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#5b4dfc" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="conversion-card2">
          <h3>Conversion</h3>
          <div className="gauge-wrapper">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Converted", value: conversionData },
                    { name: "Remaining", value: 100 - conversionData }
                  ]}
                  startAngle={180} endAngle={0}
                  innerRadius={70} outerRadius={100}
                  dataKey="value"
                >
                  <Cell fill="#5b4dfc" />
                  <Cell fill="#e0e0e0" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="gauge-center">
              <h2>{conversionData}%</h2>
              <span>Live</span>
            </div>
          </div>
        </div>
      </section>

      {/* Summary Cards */}
      <div className="summary-cards">
        <SummaryCard title="Total Customers" value={stats.totalCustomers || 0} icon="👥" bgColor="#ff9800" />
        <SummaryCard title="New Today" value={stats.newCustomersToday || 0} icon="🆕" bgColor="#4caf50" />
        <SummaryCard title="New This Week" value={stats.newCustomersWeek || 0} icon="📅" bgColor="#2196f3" />
        <SummaryCard title="Total Revenue" value={`₹${stats.totalRevenue || 0}`} icon="💰" bgColor="#9c27b0" />
      </div>

      {/* Orders Table */}
      <section className="orders-section">
        <h2>Recent Orders</h2>
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th><th>Customer Name</th><th>Email</th><th>Phone</th>
                <th>Address</th><th>Products</th><th>Quantity</th><th>Total</th>
                <th>Date</th><th>Status</th><th>Action</th><th>Tracking</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>#{order._id}</td>
                  <td>{order.customer?.firstName} {order.customer?.lastName}</td>
                  <td>{order.customer?.email || "N/A"}</td>
                  <td>{order.customer?.phone || "N/A"}</td>
                  <td className="address-cell">{order.customer?.address || "N/A"}</td>
<td className="products-cell">
  <div className="products-list">
    {order.items.map((item, i) => (
      <div key={i} className="product-row">
        <img
          src={item.images?.[0] || item.image || "/default-product.png"}
          alt={item.name}
          className="product-thumb"
        />
        <div className="product-info">
          <span className="product-name">{item.name}</span>

          {/* Old price */}
          {item.oldPrice && (
            <p className="old-price">₹{item.oldPrice.toFixed(2)}</p>
          )}

          {/* Offer */}
          {item.offer && <p className="product-offer">{item.offer}</p>}

          {/* Discount */}
          {/* {item.discount > 0 && (
            <p className="product-discount">
              You saved ₹{item.discount.toFixed(2)}
            </p>
          )} */}

          {/* Final price */}
          <p className="final-price">₹{item.price.toFixed(2)}</p>
        </div>
      </div>
    ))}
  </div>
</td>
                  <td>{order.items.map((item) => item.quantity).join(", ")}</td>
                  <td>₹{order.total.toFixed(2)}</td>
                  <td>{new Date(order.createdAt).toLocaleString("en-IN")}</td>
<td>
  <div className="status-wrapper">

    <span
      className={`status-badge status-${order.status
        ?.toLowerCase()
        .replace(/\s/g, "-")}`}
    >
      {order.status}
    </span>

    {/* ✅ Show reason if user cancelled */}
    {order.status === "User Cancelled" && order.cancelReason && (
      <div className="cancel-reason">
        Reason: {order.cancelReason}
      </div>
    )}

  </div>
</td> 
              <td>
                    {order.status !== "Completed" && order.status !== "Shipping" && (
                      <button className="btn-shipping" onClick={() => updateOrderStatus(order._id, "Shipping")}>Shipping</button>
                    )}
{order.status !== "Cancelled" && order.status !== "User Cancelled" && (
  <button className="btn-cancel" onClick={() => updateOrderStatus(order._id, "Cancelled")}>
    Cancel
  </button>
)}
                  </td>
                  <td>
                    <div className="status-slider">
                      {["Order Placed","Order Confirmed","Packed the product","Arrived in warehouse","Near by courier facility","Out for Delivery","Delivered"].map(s => (
                        <button key={s} onClick={() => updateOrderStatus(order._id, s)}>{s}</button>
                      ))}
                      <button className="btn-cancel" onClick={() => updateOrderStatus(order._id, "Cancelled")}>Cancel</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top Products */}
      <section className="tp-section">
        <h2>Top Products</h2>
        <div className="tp-grid">
          {products.sort((a, b) => b.sales - a.sales).map((p) => (
            <div key={p.id} className="tp-card">
              <img src={p.images?.[0] || p.image || "/default-product.png"} alt={p.name} className="tp-thumb" />
              <div className="tp-info">
                <p className="tp-name">{p.name}</p>
                <p className="tp-sold">{p.sales} sold</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <UserActivity activities={activities} />
    </div>
  );
}