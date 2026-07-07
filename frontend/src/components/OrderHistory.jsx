import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BASE_URL from "../config";
import "./OrderHistory.css";

export default function OrderHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem("userId");

  const fetchHistory = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/order-history/${userId}`);
      const data = await res.json();
      const orders = Array.isArray(data) ? data : [];

      // 🔹 Sort by createdAt descending (latest first)
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setHistory(orders);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();

    const interval = setInterval(() => {
      fetchHistory();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const clearHistory = async () => {
    if (!window.confirm("Clear all history?")) return;

    await fetch(`${BASE_URL}/clear-history/${userId}`, {
      method: "DELETE",
    });

    setHistory([]);
  };

  const removeHistory = async (id) => {
    await fetch(`${BASE_URL}/remove-history/${id}`, {
      method: "DELETE",
    });

    setHistory(history.filter((o) => o._id !== id));
  };

  return (
    <div className="oh-layout">
      <Navbar />

      <div className="oh-scroll">
        <div className="oh-container">

          {history.length > 0 && (
            <div className="oh-header">
              <h2>Order History</h2>

              <button className="oh-clear-btn" onClick={clearHistory}>
                Clear History
              </button>
            </div>
          )}

          {loading && <p className="oh-center">Loading history...</p>}
          {!loading && history.length === 0 && (
            <p className="oh-center">No history found</p>
          )}

          {history.map((order) => {
            const totalAmount = order.total || 0;

            return (
              <div key={order._id} className="oh-card">

                <div className="oh-top">
                  <div>
                    <h4>Order #{order._id.slice(-6)}</h4>
                    <p>{new Date(order.createdAt).toLocaleString()}</p>
                  </div>

                  <div className="oh-right">
                    <span className={`oh-status ${order.status?.toLowerCase()}`}>
                      {order.status}
                    </span>

                    <button
                      className="oh-remove-btn"
                      onClick={() => removeHistory(order._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <p className="oh-total">Total: ₹{totalAmount}</p>

                {order.cancelReason && (
                  <p className="oh-cancel">
                    Cancel Reason: {order.cancelReason}
                  </p>
                )}

                <div className="oh-products">
                  {order.items.map((item, i) => {
                    // 🔹 Calculate saved amount correctly
                    const savedAmount =
                      item.oldPrice && item.oldPrice > item.price
                        ? (item.oldPrice - item.price) * item.quantity
                        : item.discount && item.discount > 0
                          ? item.discount * item.quantity
                          : 0;

                    const total = item.price * item.quantity;

                    return (
                      <div key={i} className="oh-product-row">
                        <img src={item.image} alt={item.name} />

                        <div>
                          <h5>{item.name}</h5>

                          <p>Qty: {item.quantity}</p>

                          {/* Price per item */}
                          <p className="oh-price">₹{item.price}</p>

                          {/* Old Price if exists */}
                          {/* {item.oldPrice && <p className="oh-old-price">Old Price: ₹{item.oldPrice}</p>} */}

                          {/* Offer */}
                          {item.offer && <p className="oh-offer">{item.offer}</p>}

                          {/* You saved */}
                          {/* {savedAmount > 0 && (
            <p className="oh-discount">
              You saved ₹{savedAmount.toFixed(2)}
            </p>
          )} */}

                          {/* Total for this item */}
                          <p className="oh-total-item">Total: ₹{total}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
}