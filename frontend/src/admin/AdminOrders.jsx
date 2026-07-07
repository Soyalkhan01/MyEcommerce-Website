import { useEffect, useState } from "react";
import BASE_URL from "../config";
import "./AdminOrders.css";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = () => {
    setLoading(true);
    fetch(`${BASE_URL}/orders`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(loadOrders, []);

  const deleteOrder = async (_id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    const res = await fetch(`${BASE_URL}/orders/${_id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.success) loadOrders();
  };

  if (loading) return <p className="admin-orders-message">Loading orders...</p>;
  if (orders.length === 0)
    return <p className="admin-orders-message">No orders found</p>;

  return (
    <div className="admin-orders-container">
      <h2>Orders</h2>

      <table className="admin-orders-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer Name</th>
            <th>Email</th>
            <th>Address</th>
            <th>Payment</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date & Time</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => {
            const customer = order.customer || {};

            const customerName =
              customer.name ||
              `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
              "N/A";

            const payment =
              customer.payment === "cod" ? "Cash on Delivery" : "Online";

            const date = order.createdAt
              ? new Date(order.createdAt).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
              : "N/A";

            return (
              <tr key={order._id}>
                <td>{order._id}</td>
                <td>{customerName}</td>
                <td>{customer.email || "N/A"}</td>
                <td>{customer.address || "N/A"}</td>
                <td>{payment}</td>
                <td>₹{order.total}</td>
                <td>{order.status}</td>
                <td>{date}</td>
                <td>
                  <button
                    className="admin-orders-delete-btn"
                    onClick={() => deleteOrder(order._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AdminOrders;