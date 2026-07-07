import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import StepsTracker from "./StepsTracker";
import BASE_URL from "../config";
import "./Checkout.css";

function Checkout({ cart }) {
  const location = useLocation();
  const navigate = useNavigate();

  const steps = ["Cart", "Checkout", "Order Summary"];
  const currentStep = 1;

  const initialOrderItems = location.state?.cartItems || cart?.items || [];
  const [orderItems, setOrderItems] = useState(initialOrderItems);

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
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (orderItems.length === 0) {
    return (
      <p style={{ textAlign: "center", marginTop: 40 }}>
        Your cart is empty
      </p>
    );
  }

  const getImageUrl = (item) => {
    let image = null;

    if (Array.isArray(item.images) && item.images.length > 0) {
      image = item.images[0];
    }

    else if (typeof item.images === "string") {
      image = item.images;
    }

    else if (item.image) {
      image = item.image;
    }

    if (!image) {
      return "https://via.placeholder.com/100";
    }

    if (image.startsWith("http") || image.startsWith("data:image")) {
      return image;
    }

    return `${BASE_URL}/images/${image}`;
  };

  const updateQuantity = (id, newQty) => {
    if (newQty < 1) return;
    setOrderItems(
      orderItems.map((item) =>
        item.id === id ? { ...item, quantity: newQty } : item
      )
    );
  };

  const totalPrice = orderItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * item.quantity,
    0
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomer({ ...customer, [name]: value });
  };

  const validateAll = () => {
    const newErrors = {};
    if (!customer.firstName.trim()) newErrors.firstName = "Required";
    if (!customer.lastName.trim()) newErrors.lastName = "Required";
    if (!customer.email.trim()) newErrors.email = "Required";
    if (!customer.phone.trim()) newErrors.phone = "Required";
    if (!customer.address.trim()) newErrors.address = "Required";
    if (!customer.city.trim()) newErrors.city = "Required";
    if (!customer.state.trim()) newErrors.state = "Required";
    if (!customer.pincode.trim()) newErrors.pincode = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const confirmOrder = () => {
    if (!validateAll()) {
      setShowPopup(false);
      return;
    }

    setShowPopup(false);

    navigate("/order-summary", {
      state: {
        cartItems: orderItems,
        totalAmount: totalPrice,
        customer,
      },
    });

    window.scrollTo(0, 0);
  };

  return (
    <div className="co-page">
      <StepsTracker steps={steps} currentStep={currentStep} />

      <h3 className="co-title">Checkout</h3>

      <div className="co-content">

        <form className="co-form" onSubmit={(e) => e.preventDefault()}>
          <h3>Shipping Details</h3>

          <div className="co-input-group">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={customer.firstName}
              onChange={handleChange}
            />
            {errors.firstName && <small className="co-error">{errors.firstName}</small>}

            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={customer.lastName}
              onChange={handleChange}
            />
            {errors.lastName && <small className="co-error">{errors.lastName}</small>}
          </div>

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={customer.email}
            onChange={handleChange}
          />
          {errors.email && <small className="co-error">{errors.email}</small>}

          <input
            type="tel"
            name="phone"
            placeholder="Mobile Number"
            value={customer.phone}
            onChange={handleChange}
          />
          {errors.phone && <small className="co-error">{errors.phone}</small>}

          <input
            type="text"
            name="address"
            placeholder="Address"
            value={customer.address}
            onChange={handleChange}
          />
          {errors.address && <small className="co-error">{errors.address}</small>}

          <div className="co-input-group">
            <input
              type="text"
              name="city"
              placeholder="City"
              value={customer.city}
              onChange={handleChange}
            />
            {errors.city && <small className="co-error">{errors.city}</small>}

            <input
              type="text"
              name="state"
              placeholder="State"
              value={customer.state}
              onChange={handleChange}
            />
            {errors.state && <small className="co-error">{errors.state}</small>}
          </div>

          <input
            type="text"
            name="pincode"
            placeholder="Pincode"
            value={customer.pincode}
            onChange={handleChange}
          />
          {errors.pincode && <small className="co-error">{errors.pincode}</small>}

          <h3>Payment Method</h3>
          <div className="co-payment-options">
            <label>
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={customer.payment === "cod"}
                onChange={handleChange}
              />
              Cash on Delivery
            </label>

            <label>
              <input
                type="radio"
                name="payment"
                value="online"
                checked={customer.payment === "online"}
                onChange={handleChange}
              />
              Online Payment
            </label>
          </div>

          <button
            className="co-place-btn"
            type="button"
            onClick={() => setShowPopup(true)}
          >
            Place Order
          </button>
        </form>

        <div className="co-summary">
          <h3>Your Order</h3>

          <div className="co-summary-header">
            <span>Product</span>
            <span>Quantity</span>
            <span>Price</span>
          </div>

          <div className="co-summary-items">
            {orderItems.map((item) => (
              <div key={item.id} className="co-summary-item">
                <div className="co-product-name">
                  <img
                    src={getImageUrl(item)}
                    alt={item.name}
                  />
                  <span>{item.name}</span>
                </div>

                <div className="co-qty-controls">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>

                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="co-total">
            <span>Total</span>
            <span>₹{totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
      {showPopup && (
        <div className="co-popup-overlay">
          <div className="co-popup">
            <h3>Confirm Order</h3>
            <p>Are you sure you want to place this order?</p>
            <div className="co-popup-actions">
              <button
                className="co-popup-cancel"
                onClick={() => setShowPopup(false)}
              >
                Cancel
              </button>
              <button
                className="co-popup-confirm"
                onClick={confirmOrder}
              >
                Yes, Place Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Checkout;