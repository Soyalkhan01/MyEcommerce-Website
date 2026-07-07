import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../config";

import "./LatestProducts.css";

function LatestProducts({ refreshFlag, addToCart }) {
  const [products, setProducts] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [user, setUser] = useState(null);
  const sliderRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const fetchProducts = () => {
    // fetch("http://127.0.0.1:5000/latestProducts")
    fetch(`${BASE_URL}/latestProducts`)

      .then((res) => res.json())
      .then((data) => {
        const filtered = Array.isArray(data) ? data.filter((p) => !p.deleted) : [];
        setProducts(filtered);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchProducts();
  }, [refreshFlag]);

  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const mouseDown = (e) => {
    isDown.current = true;
    sliderRef.current.classList.add("lp-slider-active");
    startX.current = e.pageX - sliderRef.current.offsetLeft;
    scrollLeft.current = sliderRef.current.scrollLeft;
  };
  const mouseLeave = () => {
    isDown.current = false;
    sliderRef.current.classList.remove("lp-slider-active");
  };
  const mouseUp = () => {
    isDown.current = false;
    sliderRef.current.classList.remove("lp-slider-active");
  };
  const mouseMove = (e) => {
    if (!isDown.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    sliderRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const showToast = (message) => {
    const id = Date.now();
    const newToast = { id, message };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, fade: true } : t))
      );
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 500);
    }, 2500);
  };

  const requireLogin = (callback) => {
    if (!user) {
      showToast("Please login first to continue!");
      navigate("/login");
      return false;
    }
    callback();
    return true;
  };

  const handleBuyNow = (product, e) => {
    e.stopPropagation();
    requireLogin(() => {
      navigate("/checkout", {
        state: {
          cartItems: [{ ...product, quantity: 1 }],
          totalAmount: product.price,
        },
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    requireLogin(() => {
      if (addToCart) addToCart(product, 1);
      showToast(`1 ${product.name} added to cart`);
    });
  };

  const handleCardClick = (product) => {
    window.open(`/product/${product.id}`, "_blank");
  };

  return (
    <section id="latest" className="lp-latest-products">
      <div className="lp-section-header">
        <h2>Latest Products</h2>
      </div>

      <div
        className="lp-slider"
        ref={sliderRef}
        onMouseDown={mouseDown}
        onMouseLeave={mouseLeave}
        onMouseUp={mouseUp}
        onMouseMove={mouseMove}
      >
        {products.length > 0 ? (
          products.map((p) => {
            const imageUrl =
              p.images?.[0] ||
              (p.image?.startsWith("http") ? p.image : p.image ? `http://127.0.0.1:5000/images/${p.image}` : "https://via.placeholder.com/300");
            const isOutOfStock = p.stock === 0;

            return (
              <div
                key={p.id}
                className="lp-product-card"
                style={{ cursor: "pointer" }}
                onClick={() => handleCardClick(p)}
              >
                <div className="lp-product-badges">
                  {p.tag?.split(",").map((t, index) => t.trim() ? <span key={index} className="lp-badge-tag">{t.trim()}</span> : null)}
                  {p.hot && <span className="lp-badge-hot-badge">{p.hot}</span>}
                  {p.latest && <span className="lp-badge-new-badge">{p.latest}</span>}
                  {p.offer && <span className="lp-badge-offer-badge">{p.offer}</span>}
                </div>

                <div className="lp-product-img-box">
                  <img src={imageUrl} alt={p.name} />
                </div>

                <div className="lp-product-info">
                  <h4 className="lp-product-title">{p.name}</h4>
                  <p className="lp-product-short-desc">{p.shortDesc || "High performance with premium quality"}</p>

                  <div className="lp-rating-row">
                    <div className="lp-rating-box">
                      ⭐ {p.rating || "4.3"}
                      <span className="lp-rating-count">{isOutOfStock ? "Out of Stock" : `Stock: ${p.stock}`}</span>
                    </div>
                  </div>

                  <div className="lp-price-box">
                    <span className="lp-price">₹{p.price}</span>
                    {p.oldPrice && <span className="lp-old-price">₹{p.oldPrice}</span>}
                  </div>

                  <div className="lp-action-buttons" onClick={(e) => e.stopPropagation()}>
                    <button className="lp-buy-btn" disabled={isOutOfStock} onClick={(e) => handleBuyNow(p, e)}>Buy Now</button>
                    <button className="lp-cart-btn" disabled={isOutOfStock} onClick={(e) => handleAddToCart(p, e)}>Add to Cart</button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="lp-section-empty">No latest products found.</p>
        )}
      </div>

      <div className="toast-wrapper">
        {toasts.map((toast) => (
          <div key={toast.id} className={`cart-toast ${toast.fade ? "fade-out" : "show"}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </section>
  );
}

export default LatestProducts;