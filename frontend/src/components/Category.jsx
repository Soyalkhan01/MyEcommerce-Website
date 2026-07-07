import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Category.css";

const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const BASE_URL = isLocal
  ? "http://127.0.0.1:5000"
  : "https://my-backend-93up.onrender.com";

const getImageUrl = (prod) => {
  if (prod.images && prod.images.length > 0) {
    return prod.images[0].startsWith("http")
      ? prod.images[0]
      : `${BASE_URL}/images/${prod.images[0]}`;
  }

  if (prod.image) {
    return prod.image.startsWith("http")
      ? prod.image
      : `${BASE_URL}/images/${prod.image}`;
  }

  return "https://via.placeholder.com/300";
};

function Category({ addToCart }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showProducts, setShowProducts] = useState(false);
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${BASE_URL}/categories`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Category fetch error:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const resProducts = await fetch(`${BASE_URL}/products`);
      const productsData = await resProducts.json();

      const resLatest = await fetch(`${BASE_URL}/latestProducts`);
      const latestData = await resLatest.json();

      const merged = [
        ...(Array.isArray(latestData) ? latestData : []),
        ...(Array.isArray(productsData) ? productsData : []),
      ].filter((p) => !p.deleted);

      const sortedById = merged.sort(
        (a, b) => (a.id || 0) - (b.id || 0)
      );

      setProducts(sortedById);
    } catch (err) {
      console.error("Products fetch error:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

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

  const handleCategoryClick = (catName) => {
    if (selectedCategory === catName) {
      setShowProducts(!showProducts);
    } else {
      setSelectedCategory(catName);
      setShowProducts(true);
    }
  };

  const handleBuyNow = (product, e) => {
    e.stopPropagation();

    navigate("/checkout", {
      state: {
        cartItems: [{ ...product, quantity: 1 }],
        totalAmount: product.price,
      },
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    addToCart?.(product, 1);
    showToast(`1 ${product.name} added to cart`);
  };

  const handleCardClick = (product) => {
    navigate(`/product/${product.id}`);
  };

  const filteredProducts =
    selectedCategory === null || selectedCategory === "All Items"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div id="category" className="category-section">
      <div className="category-container">
        {categories
          .filter((cat) => !cat.deleted)
          .sort((a, b) => (a.name === "All Items" ? -1 : 0))
          .map((cat) => (
            <button
              key={cat.id}
              className="category-button"
              onClick={() => handleCategoryClick(cat.name)}
            >
              <img
                src={
                  cat.image?.startsWith("http")
                    ? cat.image
                    : `${BASE_URL}/images/${cat.image}`
                }
                alt={cat.name}
                className="category-icon"
              />
              <span>{cat.name}</span>
            </button>
          ))}
      </div>

      {showProducts && (
        <div className="cat-products">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((prod) => {
              const stockText =
                prod.stock > 0
                  ? `Stock: ${prod.stock}`
                  : "Out of Stock";

              const isOutOfStock = prod.stock === 0;

              return (
                <div
                  key={prod.id}
                  className="cat-product-card"
                  onClick={() => handleCardClick(prod)}
                >
                  <img src={getImageUrl(prod)} alt={prod.name} />

                  <h3 className="cat-product-title">{prod.name}</h3>

                  <p className="cat-product-desc">
                    {prod.shortDesc ||
                      "High performance with premium quality"}
                  </p>

                  <div className="cat-rating-offer">
                    <div className="cat-rating-box">
                      ⭐ {prod.rating || 4.3} (
                      {prod.reviews || 0} Reviews)
                      <br />
                      <span className="cat-stock-text">
                        {stockText}
                      </span>
                    </div>

                    {prod.offer && (
                      <span className="cat-inline-offer">
                        {prod.offer}
                      </span>
                    )}
                  </div>

                  <div className="cat-price-box">
                    <span className="cat-price">
                      ₹{prod.price}
                    </span>

                    {prod.oldPrice && (
                      <span className="cat-old-price">
                        ₹{prod.oldPrice}
                      </span>
                    )}
                  </div>

                  <div
                    className="cat-action-buttons"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="cat-buy-btn"
                      disabled={isOutOfStock}
                      onClick={(e) => handleBuyNow(prod, e)}
                    >
                      Buy Now
                    </button>

                    <button
                      className="cat-cart-btn"
                      disabled={isOutOfStock}
                      onClick={(e) => handleAddToCart(prod, e)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="no-product">No products found.</p>
          )}
        </div>
      )}

      <div className="toast-wrapper">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`cart-toast ${toast.fade ? "fade-out" : "show"
              }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Category;