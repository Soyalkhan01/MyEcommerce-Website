import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import BASE_URL from "../config";

import "./ProductDetail.css";

function ProductDetail({ addToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [imgIndex, setImgIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : { count: 0, items: [] };
  });

  const [toasts, setToasts] = useState([]);

  // <<< Yahan add karo >>>
  const openProductDetailNewTab = (productId) => {
    const baseUrl = window.location.origin; // frontend ka URL
    window.open(`${baseUrl}/product/${productId}`, "_blank");
  };
  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchAll = async () => {
      try {
        const resProducts = await
          // fetch("http://127.0.0.1:5000/products");
          fetch(`${BASE_URL}/products`);

        const productsData = await resProducts.json();

        const resLatest = await
          // fetch("http://127.0.0.1:5000/latestProducts");
          fetch(`${BASE_URL}/latestProducts`);

        const latestData = await resLatest.json();

        const resElectronics = await
          // fetch("http://127.0.0.1:5000/electronics");
          fetch(`${BASE_URL}/electronics`);

        const electronicsData = await resElectronics.json();

        const merged = [
          ...(Array.isArray(latestData) ? latestData : []),
          ...(Array.isArray(productsData) ? productsData : []),
          ...(Array.isArray(electronicsData) ? electronicsData : [])
        ].filter((p) => !p.deleted);

        setAllProducts(merged);

        const found = merged.find((p) => p.id === Number(id) || p.id === id); // support string or number
        if (found) setProduct(found);
        else setError(true);
      } catch (err) {
        console.error(err);
        setError(true);
      }
    };

    fetchAll();
  }, [id]);

  if (error) return <div className="pdx-error">Product not found</div>;
  if (!product) return <div className="pdx-loading">Loading...</div>;

  const images =
    product.images?.length > 0
      ? product.images.map((img) =>
        img.startsWith("http")
          ? img
          : `http://127.0.0.1:5000/images/${img}`
      )
      : product.image
        ? [
          product.image.startsWith("http")
            ? product.image
            : `http://127.0.0.1:5000/images/${product.image}`,
        ]
        : ["https://via.placeholder.com/400"];

  const finalPrice = product.price;       // selling price
  const originalPrice = product.oldPrice; // cut price
  const totalPrice = finalPrice * quantity;

  const showToast = (message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, fade: true } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 500);
    }, 2500);
  };

  const handleAddToCart = (prod = product) => {
    const user = JSON.parse(localStorage.getItem("user")); // login check
    if (!user) {
      navigate("/login");
      return;
    }

    const qty = quantity;

    setCart((prev) => {
      const existing = prev.items.find((item) => item.id === prod.id);
      let updatedItems;

      if (existing) {
        updatedItems = prev.items.map((item) =>
          item.id === prod.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      } else {
        updatedItems = [...prev.items, { ...prod, quantity: qty }];
      }

      const totalCount = updatedItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      const newCart = { count: totalCount, items: updatedItems };
      localStorage.setItem("cart", JSON.stringify(newCart));

      showToast(`${qty} ${prod.name} added to cart`);
      return newCart;
    });

    if (addToCart) addToCart(prod, qty);
  };

  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);

  const faqs = [
    { q: "Is this product original?", a: "Yes, 100% original product." },
    { q: "Is COD available?", a: "Yes, Cash on Delivery is available." },
    { q: "How many days return?", a: "7 days easy return available." },
    { q: "Delivery time?", a: "3–5 business days delivery." },
  ];

  return (
    <div className="pdx-wrapper">
      <div className="pdx-card">
        <div className="pdx-img-box">
          {product.arrival && <span className="pdx-badge">New Arrival</span>}
          {product.offer && <span className="pdx-offer">{product.offer}</span>}
          {product.tag && (
            <span
              className="pdx-badge"
              style={{ left: "auto", right: "80px", backgroundColor: "#f59e0b" }}
            >
              {product.tag}
            </span>
          )}

          <div className="pdx-zoom-container">
            <img
              src={images[imgIndex]}
              alt={product.name}
              className="pdx-zoom-img"
            />
          </div>

          {images.length > 1 && (
            <div className="pdx-thumbnails">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt=""
                  className={idx === imgIndex ? "active-thumb" : ""}
                  onClick={() => setImgIndex(idx)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="pdx-info">
          <h2>{product.name}</h2>
          <span className="pdx-cat">{product.category}</span>

          {product.shortDesc && (
            <p className="pdx-short-desc">{product.shortDesc}</p>
          )}
          {product.description && (
            <p className="pdx-full-desc">{product.description}</p>
          )}

          <div className="pdx-price-row">
            <h3>₹{finalPrice}</h3>
            {originalPrice && originalPrice !== finalPrice && (
              <span className="pdx-original">₹{originalPrice}</span>
            )}
          </div>

          <div className="pdx-price-calculator">
            <strong>Total Price:</strong> ₹{totalPrice} ({quantity} × ₹{finalPrice})
          </div>

          <div className="pdx-cart-row">
            <div className="pdx-qty">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                −
              </button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)}>+</button>
            </div>

            <button
              className="pdx-add"
              onClick={() => handleAddToCart(product)} disabled={product.stock === 0}
            >
              Add to Cart
            </button>

            <button
              className="pdx-buy"
              disabled={product.stock === 0}
              onClick={() => {
                const user = JSON.parse(localStorage.getItem("user")); // login check
                if (!user) {
                  navigate("/login");
                  return;
                }
                navigate("/checkout", {
                  state: {
                    cartItems: [{ ...product, quantity }],
                    totalAmount: totalPrice,
                  },
                });
              }}
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* Highlights */}
      <h3>Highlights</h3>
      <div className="pdx-highlights">
        <ul>
          <li><strong>Material:</strong> {product.material}</li>
          <li><strong>Warranty:</strong> {product.warranty}</li>
          <li><strong>Color:</strong> {product.color}</li>
          <li><strong>Size:</strong> {product.size}</li>
          <li><strong>Quantity:</strong> {product.stock}</li>
          <li><strong>Key Benefits:</strong> {product.keyBenefits}</li>
        </ul>
      </div>

      {/* Toasts */}
      <div className="toast-wrapper">
        {toasts.map((toast) => (
          <div key={toast.id} className={`cart-toast ${toast.fade ? "fade-out" : "show"}`}>
            {toast.message}
          </div>
        ))}
      </div>

      {/* Variants */}
      <div className="pdx-variant-section">
        <h3>Select Size</h3>
        <div className="pdx-variant-options">
          {product.variants?.map((v, i) => (
            <button
              key={i}
              className={selectedVariant === v ? "active-variant" : ""}
              onClick={() => setSelectedVariant(v)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Specifications */}
      <div className="pdx-specification">
        <h3>Specifications</h3>
        <table>
          <tbody>
            <tr><td>Brand</td><td>{product.brand}</td></tr>
            <tr><td>Model</td><td>{product.model}</td></tr>
            <tr><td>Weight</td><td>{product.weight}</td></tr>
            <tr><td>Material</td><td>{product.material}</td></tr>
            <tr><td>Warranty</td><td>{product.warranty}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Key Benefits */}
      <div className="pdx-key-benefits">
        <div className="benefit-box">✔ Premium Quality</div>
        <div className="benefit-box">✔ Long Lasting</div>
        <div className="benefit-box">✔ Best for Daily Use</div>
        <div className="benefit-box">✔ Easy Return</div>
      </div>

      {/* Free shipping / COD / etc */}
      <div className="pdx-benefits">
        <span>🚚 Free Shipping</span>
        <span>🔁 7 Days Return</span>
        <span>💳 COD Available</span>
      </div>

      {/* Trust badges */}
      <div className="pdx-trust-badges">
        <div className="trust-badge">
          <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" alt="Secure Payment" />
          <span>Secure Payment</span>
        </div>
        <div className="trust-badge">
          <img src="https://cdn-icons-png.flaticon.com/512/2910/2910763.png" alt="Original Product" />
          <span>100% Original</span>
        </div>
        <div className="trust-badge">
          <img src="https://cdn-icons-png.flaticon.com/512/2910/2910765.png" alt="Support" />
          <span>24/7 Support</span>
        </div>
      </div>

      {/* Reviews */}
      <div className="pdx-reviews">
        <h3>
          <span className="review-count">{product.reviews?.length || 0}</span> Customer Reviews
        </h3>
        {product.reviews?.length > 0 ? (
          <div className="pdx-review-grid">
            {product.reviews.map((r, idx) => (
              <div key={idx} className="pdx-review-card">
                <div className="review-avatar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#bbb" viewBox="0 0 24 24">
                    <circle cx="12" cy="7" r="5" />
                    <path d="M12 14c-5 0-7 3-7 5v1h14v-1c0-2-2-5-7-5z" />
                  </svg>
                </div>
                <div className="review-content">
                  <div className="review-stars">
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                  </div>
                  <p className="review-text">{r.comment}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <p>No reviews yet</p>}
      </div>

      {/* FAQ */}
      <div className="pdx-faq">
        <h3>Frequently Asked Questions</h3>
        <div className="pdx-faq-list">
          {faqs.map((f, i) => (
            <div key={i} className="pdx-faq-item" style={{ fontWeight: 300, marginBottom: "10px" }}>
              <p className="pdx-faq-question" style={{ fontWeight: 500, marginBottom: "4px" }}>{f.q}</p>
              <p className="pdx-faq-answer" style={{ color: "#555", fontWeight: 300 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="pdx-ads-wrapper">
        <h3>Advertisements</h3>
        <div className="pdx-ads-grid">
          <div className="pdx-ad-card">
            <a href="https://www.apple.com" target="_blank" rel="noopener noreferrer">
              <img src="https://www.mactrast.com/wp-content/uploads/2018/12/iPhone_XR_-_Apple.jpg" alt="Apple iPhone" />
            </a>
          </div>
          <div className="pdx-ad-card">
            <a href="https://www.samsung.com" target="_blank" rel="noopener noreferrer">
              <img src="https://i.ytimg.com/vi/_Cf_Thff044/hq720.jpg" alt="Samsung Galaxy" />
            </a>
          </div>
          <div className="pdx-ad-card">
            <a href="https://www.microsoft.com" target="_blank" rel="noopener noreferrer">
              <img src="https://news.microsoft.com/wp-content/uploads/prod/sites/45/2018/08/Surface-Family-Expansion-1600x1079.png" alt="Microsoft Surface" />
            </a>
          </div>
        </div>
      </div>

      <div className="pdx-social-media">
        <h3>Share on</h3>
        <div className="social-icons">
          <a href="https://www.facebook.com/sharer/sharer.php?u=YOUR_PRODUCT_URL" target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">
            <img src="https://cdn-icons-png.flaticon.com/512/145/145802.png" alt="Facebook" className="social-icon" />
          </a>
          <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Share on Instagram">
            <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" className="social-icon" />
          </a>
          <a href="https://twitter.com/intent/tweet?url=YOUR_PRODUCT_URL" target="_blank" rel="noopener noreferrer" aria-label="Share on Twitter">
            <img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="Twitter" className="social-icon" />
          </a>
          <a href="https://www.linkedin.com/shareArticle?mini=true&url=YOUR_PRODUCT_URL" target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">
            <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" className="social-icon" />
          </a>
        </div>
      </div>

      {/* Related Products */}
      <div className="pdx-related">
        <h3>Related Products</h3>
        <div className="products-container2">
          {relatedProducts.map((item) => {
            const imageUrl =
              item.images?.[0] ||
              (item.image?.startsWith("http")
                ? item.image
                : item.image
                  ? `http://127.0.0.1:5000/images/${item.image}`
                  : "https://via.placeholder.com/300");

            const stockText =
              item.stock > 0
                ? item.stockLabel || `Stock: ${item.stock}`
                : "Out of Stock";

            return (
              <div key={item.id} className="product-card" style={{ cursor: "pointer", position: "relative" }}
                onClick={() => openProductDetailNewTab(item.id)}>

                <div className="product-badges">
                  {item.offer && <span className="pdx-badge offer">{item.offer}</span>}
                  {item.tag && item.tag.split(",").map((t, index) => (
                    <span key={index} className="pdx-badge tag">{t.trim()}</span>
                  ))}
                </div>

                <img src={imageUrl} alt={item.name} />
                <h3 className="product-title">{item.name}</h3>
                <p className="product-short-desc">{item.shortDesc || "High performance with premium quality"}</p>

                <div className="rating-offer-row">
                  <div className="rating-box">
                    ⭐ {item.rating || 4.3} ({item.reviews || 0} Reviews)
                    <br />
                    <span className="stock-text">{stockText}</span>
                  </div>
                </div>

                <div className="pprice-box">
                  <span className="pprice">₹{item.price}</span>
                  {item.oldPrice && item.oldPrice !== item.price && <span className="oold-price">₹{item.oldPrice}</span>}
                </div>

                <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="buy-btn"
                    onClick={() => openProductDetailNewTab(item.id)}
                  >
                    View
                  </button>

                  <button className="cart-btn" disabled={item.stock === 0} onClick={() => {
                    const user = JSON.parse(localStorage.getItem("user"));
                    if (!user) {
                      navigate("/login");
                      return;
                    }
                    handleAddToCart(item);
                  }}>
                    Add to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
