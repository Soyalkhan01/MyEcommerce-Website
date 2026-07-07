import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import StepsTracker from "./StepsTracker";
import BASE_URL from "../config";
import "./Cart.css";

function Cart({ cart, removeFromCart, updateQuantity }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const steps = ["Cart", "Checkout", "Order Summary"];
  const currentStep = 0;

  if (loading) {
    return (
      <div className="cart-loading">
        <p>Loading cart...</p>
      </div>
    );
  }

  if (!cart?.items || cart.items.length === 0) {
    return <p className="cart-empty">Your cart is empty</p>;
  }

  const subtotal = cart.items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * item.quantity,
    0
  );

  const discount = 0;
  const total = subtotal - discount;

  const getImageUrl = (item) => {
    const image = item.images?.[0] || item.image;

    return image?.startsWith("http")
      ? image
      : `${BASE_URL}/images/${image}`;
  };

  return (
    <div className="cart-page">
      <StepsTracker steps={steps} currentStep={currentStep} />

      <h3 className="cartx-title">Your Shopping Cart</h3>

      <div className="cart-container">
        <div className="cart-left">
          <div className="cart-header">
            <h2>
              Cart <span>({cart.items.length} products)</span>
            </h2>
          </div>

          <div className="cart-list">
            {cart.items.map((item) => {
              const price = Number(item.price) || 0;

              return (
                <div className="cart-item" key={item.id}>
                  <img src={getImageUrl(item)} alt={item.name} />

                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <p className="item-variant">Variant</p>
                  </div>

                  <div className="cart-qty">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          Math.max(1, item.quantity - 1)
                        )
                      }
                    >
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity + 1)
                      }
                    >
                      +
                    </button>
                  </div>

                  <div className="cart-price">
                    ₹{price.toFixed(2)}
                  </div>

                  <button
                    className="cart-remove"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="cart-right">
          <div className="promo-box">
            <h4>Promo code</h4>

            <div className="promo-input">
              <input placeholder="Type here..." />
              <button>Apply</button>
            </div>
          </div>

          <div className="summary-box">
            <div className="summary-Sub">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="summary-Dis">
              <span>Discount</span>
              <span>-₹{discount.toFixed(2)}</span>
            </div>

            <div className="summary-total">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            <button
              className="checkout-btn"
              onClick={() => {
                navigate("/checkout", { state: { cart } });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Continue to checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;