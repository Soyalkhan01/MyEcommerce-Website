import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import StepsTracker from "./StepsTracker";
import BASE_URL from "../config";
import "./OrderSummary.css";

function OrderSummary() {
  const location = useLocation();
  const navigate = useNavigate();

  const steps = ["Cart", "Checkout", "Order Summary"];
  const currentStep = 2;

  const [customer, setCustomer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    payment: "cod",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  let { cartItems = [], totalAmount = 0 } = location.state || {};
  totalAmount = Number(totalAmount) || 0;

  useEffect(() => {
    if (location.state?.customer) {
      setCustomer(location.state.customer);
    }
  }, [location.state]);

  if (!cartItems || cartItems.length === 0) {
    return <p className="orders-empty">No order data available</p>;
  }

  const placeOrder = async () => {
    setLoading(true);
    setErrors({});

    const userId = localStorage.getItem("userId");

    if (!userId || userId === "undefined") {
      alert("Please login first");
      navigate("/login");
      return;
    }

    const orderData = {
      userId,
      customer,
      items: cartItems.map((item) => {
        const price = Number(item.price) || 0;
        const qty = item.quantity || 1;

        const offerPercentage =
          Number(item.offerPercentage) ||
          Number(item.discountPercentage) ||
          0;

        const discount = (price * offerPercentage) / 100;

        return {
          id: item.id,
          name: item.name,
          quantity: qty,
          price,
          image: item.images?.[0] || item.image || "",

          offer: item.offer || "",
          offerPercentage: offerPercentage,
          discount: discount,
          total: (price - discount) * qty,
        };
      }),
      total: totalAmount,
      date: new Date().toISOString(),
      status: "Pending",
    };

    console.log("ORDER PAYLOAD:", orderData);

    try {
      const res = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) {
        throw new Error("Failed to place order");
      }

      setConfirmed(true);
      localStorage.removeItem("cart");
    } catch (error) {
      console.error(error);
      setErrors({ api: "Failed to place order. Please try again." });
    } finally {
      setLoading(false);
      window.scrollTo(0, 0);
    }
  };

  if (confirmed) {
    return (
      <div className="orders-success">
        <h1>🎉 Order Placed Successfully</h1>
        <p>Thank you for shopping with us!</p>
        <button
          className="back-btn"
          onClick={() => navigate("/")}
        >
          Back to Home
        </button>
      </div>
    );
  }

  const getImageUrl = (item) => {
    const image = item.images?.[0] || item.image;

    if (!image) return "/default-product.png";

    return image.startsWith("http")
      ? image
      : `${BASE_URL}/images/${image}`;
  };

  return (
    <div className="orders-summary">
      <StepsTracker steps={steps} currentStep={currentStep} />

      <h3 className="orders-title">Review & Confirm Your Order</h3>

      <div className="orders-grid">
        {/* LEFT */}
        <div className="order-card">
          <h4>Delivery Details</h4>

          <div className="order-details">
            <p><strong>Name:</strong> {customer.firstName} {customer.lastName}</p>
            <p><strong>Email:</strong> {customer.email}</p>
            <p><strong>Phone:</strong> {customer.phone}</p>
            <p>
              <strong>Address:</strong> {customer.address},{" "}
              {customer.city}, {customer.state} - {customer.pincode}
            </p>
          </div>

          <h4 className="payment-p">Payment Method</h4>
          <p className="payment-method">
            {customer.payment === "cod"
              ? "Cash on Delivery"
              : "Online Payment"}
          </p>

          {errors.api && <p className="error-msg">{errors.api}</p>}

          <div className="order-footer">
            <p>
              Total Amount: <strong>₹{totalAmount.toFixed(2)}</strong>
            </p>

            <button
              onClick={placeOrder}
              disabled={loading}
              className="confirm-btn"
            >
              {loading ? "Placing Order..." : "Confirm Order"}
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="order-card">
          <h4>Order Items</h4>

          {cartItems.map((item, index) => {
            const price = Number(item.price) || 0;

            return (
              <div className="order-item" key={item.id || index}>
                <img src={getImageUrl(item)} alt={item.name} />

                <div>
                  <p className="item-name">{item.name}</p>
                  <p>Quantity: {item.quantity}</p>
                  <p>Price: ₹{price.toFixed(2)}</p>

                  {item.offerPercentage > 0 && (
                    <p className="offer-text">
                      {item.offerPercentage}% OFF
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default OrderSummary;