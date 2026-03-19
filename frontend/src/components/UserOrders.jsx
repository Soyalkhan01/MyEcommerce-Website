import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import BASE_URL from "../config";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./UserOrders.css";

export default function UserOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ===== NEW STATES (CANCEL MODAL) ===== */
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const prevOrders = useRef([]);

  /* ===== CANCEL REASONS ===== */
  const cancelReasons = [
    "Ordered by mistake",
    "Found cheaper elsewhere",
    "Delivery taking too long",
    "Changed my mind",
    "Wrong address selected",
    "Other",
  ];

  // ======================
  // FETCH ORDERS
  // ======================
  const fetchOrders = async () => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/user-orders/${userId}`);
      const data = await res.json();

      const sorted = data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setOrders((prevOrders) => {
        const stillWaitingConfirm = prevOrders.filter(
          (o) =>
            o.status === "Cancelled" ||
            o.status === "User Cancelled"
        );

        const merged = [...sorted];

        stillWaitingConfirm.forEach((oldOrder) => {
          const exists = merged.find(
            (n) => String(n._id) === String(oldOrder._id)
          );

          if (!exists) merged.push(oldOrder);
        });

        return merged.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 1000);
    return () => clearInterval(interval);
  }, []);

  // ======================
  // OPEN CANCEL MODAL
  // ======================
  const cancelOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setShowCancelModal(true);
  };

  // ======================
  // CONFIRM CANCEL
  // ======================
  const confirmCancelOrder = async () => {
let finalReason = cancelReason;

if (!cancelReason) {
  alert("Please select a reason");
  return;
}

if (cancelReason === "Other") {
  if (!customReason.trim()) {
    alert("Please enter your reason");
    return;
  }
  finalReason = customReason;
}
    try {
      const res = await fetch(
        `${BASE_URL}/cancel-order/${selectedOrderId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
body: JSON.stringify({ reason: finalReason }),        }
      );

      const data = await res.json();

      if (data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            String(o._id) === String(selectedOrderId)
              ? {
                  ...o,
                  status: "User Cancelled",
cancelReason: finalReason,                }
              : o
          )
        );
      }

      setShowCancelModal(false);
      setCancelReason("");
    } catch {
      alert("Server not responding");
    }
  };

  // ======================
  // CONFIRM REMOVE
  // ======================
  const confirmOwnerCancel = (orderId) => {
    if (!window.confirm("Remove cancelled order from list?")) return;

    setOrders((prev) =>
      prev.filter((o) => String(o._id) !== String(orderId))
    );
  };

  // ======================
  // UI
  // ======================
  return (
    <div className="orders-layout">
      <Navbar />

      <div className="orders-scroll-area">
        <div className="my-orders-page">

          {loading && (
            <div className="center-message">
              Loading your orders...
            </div>
          )}

          {!loading && orders.length === 0 && (
            <div className="center-message">
              No orders yet
            </div>
          )}

          {!loading && orders.length > 0 && (
            <>
              <h2 className="orders-title">My Orders</h2>

              <p className="total-orders">
                Total Orders: <strong>{orders.length}</strong>
              </p>

              {orders.map((order) => {

                const totalAmount = order.items.reduce(
                  (acc, item) => acc + item.price * item.quantity,
                  0
                );

                const totalProducts = order.items.reduce(
                  (acc, item) => acc + item.quantity,
                  0
                );

                const trackingSteps = [
                  "Order Placed",
                  "Order Confirmed",
                  "Packed the product",
                  "Arrived in warehouse",
                  "Near by courier facility",
                  "Out for Delivery",
                  "Delivered",
                ];

                const currentIndex =
                  trackingSteps.indexOf(order.status);

                return (
                  <div key={order._id} className="order-card">

                    <div className="order-card-header">
                      <h4>Order #{order._id}</h4>

                      <div className="order-actions">
                        <span className={`status ${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>

                        {order.status === "Cancelled" && (
                          <>
                            <p className="cancel-message">
                              ✅ Your Order was cancelled Please Re-order
                            </p>
                            <button
                              className="cancel-btn"
                              onClick={() =>
                                confirmOwnerCancel(order._id)
                              }
                            >
                              Confirm Cancel
                            </button>
                          </>
                        )}

                        {order.status === "User Cancelled" && (
                          <>
                            <p className="cancel-message">
                              ✅ You cancelled this order
                            </p>
                            <button
                              className="cancel-btn"
                              onClick={() =>
                                confirmOwnerCancel(order._id)
                              }
                            >
                              Confirm Cancel
                            </button>
                          </>
                        )}

                        {order.status !== "Delivered" &&
                          order.status !== "Cancelled" &&
                          order.status !== "User Cancelled" && (
                            <button
                              className="cancel-btn"
                              onClick={() =>
                                cancelOrder(order._id)
                              }
                            >
                              Cancel Order
                            </button>
                        )}
                      </div>
                    </div>

                    {order.status !== "Cancelled" &&
                      order.status !== "User Cancelled" && (
                        <div className="tracking-bar">
                          {trackingSteps.map((step, index) => (
                            <div key={index} className="tracking-step">
                              <div
                                className={`circle ${
                                  index <= currentIndex ? "active" : ""
                                }`}
                              >
                                {index < currentIndex ? "✓" : ""}
                              </div>

                              {index !== trackingSteps.length - 1 && (
                                <div
                                  className={`line ${
                                    index < currentIndex ? "active" : ""
                                  }`}
                                />
                              )}

                              <p>{step}</p>
                            </div>
                          ))}
                        </div>
                    )}

                    <p className="order-summary">
                      Total Products: <strong>{totalProducts}</strong> |
                      Total Amount: <strong> ₹{totalAmount}</strong>
                    </p>

                    <p className="shipping-info">
                      Ship to: {order.customer?.firstName}{" "}
                      {order.customer?.lastName},{" "}
                      {order.customer?.city},{" "}
                      {order.customer?.address}
                    </p>

                    <div className="products-grid">
                      <div className="grid-header">
                        <span>Image</span>
                        <span>Name</span>
                        <span>Qty</span>
                        <span>Price</span>
                        <span>Offer</span>
                         <span>Total</span>

                      </div>

                      {order.items.map((item, idx) => (
                        <div key={idx} className="grid-row">
                          <Link to={`/product/${item.id}`}>
                            <img
                              src={item.image}
                              alt={item.name}
                              className="product-img"
                            />
                          </Link>

                          <span>{item.name}</span>
                          <span>{item.quantity}</span>
                          <span>₹{item.price}</span>
                          <span>
  {item.offer && item.offer !== ""
    ? item.offer
    : item.offerPercentage > 0
    ? `${item.offerPercentage}% OFF`
    : item.discount > 0
    ? `₹${item.discount} OFF`
    : "-"}
</span>   
                          <span>₹{item.price * item.quantity}</span>
                     </div>
                      ))}
                    </div>

                  </div>
                );
              })}
            </>
          )}

        </div>
      </div>

      {/* ===== CANCEL MODAL ===== */}
      {showCancelModal && (
        <div className="cancel-modal-overlay">
          <div className="cancel-modal">

            <h3>Why are you cancelling?</h3>

{cancelReasons.map((reason, i) => (
  <label key={i} className="reason-option">
    <input
      type="radio"
      name="cancelReason"
      value={reason}
      onChange={(e) => setCancelReason(e.target.value)}
    />
    {reason}

    {/* ✅ OTHER INPUT FIELD */}
    {cancelReason === "Other" && reason === "Other" && (
      <input
        type="text"
        className="other-reason-input"
        placeholder="Enter your reason..."
        value={customReason}
        onChange={(e) => setCustomReason(e.target.value)}
      />
    )}
  </label>
))}

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={confirmCancelOrder}
              >
                Confirm Cancel
              </button>

              <button
                className="close-btn"
                onClick={() => setShowCancelModal(false)}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}