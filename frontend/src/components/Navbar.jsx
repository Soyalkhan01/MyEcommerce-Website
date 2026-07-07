import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaShoppingCart, FaHistory, FaCog } from "react-icons/fa";
import BASE_URL from "../config";
import "./Navbar.css";

const getImageUrl = (image) => {
  if (!image) return "https://via.placeholder.com/40";
  if (image.startsWith("data:image") || image.startsWith("http")) return image;
  return `${BASE_URL}/images/${image}`;
};

export default function Navbar({ cart = { count: 0 } }) {
  const [navbar, setNavbar] = useState({
    logo: { name: "", image: "" },
    menu: [],
    search: { placeholder: "Search products", button: "Search" },
    account: { greeting: "Hello,", title: "Sign In" },
    orders: { line1: "Returns", line2: "& Orders" },
    cart: { count: 0, icon: "" },
  });
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);

  const navigate = useNavigate();
  const sidebarRef = useRef(null);

  useEffect(() => {
    fetch(`${BASE_URL}/navbar`)
      .then((res) => res.json())
      .then((data) => setNavbar(data))
      .catch((err) => {
        console.error("Navbar fetch error:", err);
        setNavbar({});
      });

    fetch(`${BASE_URL}/products`)
      .then((res) => res.json())
      .then((data) =>
        setProducts(Array.isArray(data) ? data.filter((p) => !p.deleted) : [])
      )
      .catch(() => setProducts([]));

    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);

      fetch(`${BASE_URL}/user-orders/${parsed._id}`)
        .then((res) => res.json())
        .then((data) => setOrders(Array.isArray(data) ? data : []))
        .catch(() => setOrders([]));
    }

    const handleOutsideClick = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    const filtered = products.filter((p) =>
      p?.name?.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(filtered.slice(0, 6));
  }, [query, products]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setOrders([]);
    setSidebarOpen(false);
    navigate("/", { replace: true });
  };

  const handleCartClick = () => {
    if (!user) {
      alert("Please login first!");
      navigate("/login");
      return;
    }
    navigate("/cart");
  };

  const handleAccountClick = () => {
    if (!user) {
      navigate("/login");
    } else {
      setSidebarOpen(true);
    }
  };

  const handleOrdersClick = () => {
    if (!user) {
      alert("Please login to see your orders!");
      navigate("/login");
    } else {
      navigate("/user-orders");
    }
  };

  if (!navbar) return null;

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <img
            src={getImageUrl(navbar.logo.image)}
            alt="logo"
            className="navbar-logo"
          />
          <span className="navbar-brand">{navbar.logo.name || "Brand"}</span>
        </div>

        <ul className="navbar-menu">
          {navbar.menu.map((item) => (
            <li key={item.id || item.name}>
              <a href={item.link}>{item.name}</a>
            </li>
          ))}
        </ul>

        <div className="navbar-center">
          <div className="search-wrapper">
            <input
              type="text"
              className="navbar-search"
              placeholder={navbar.search.placeholder || "Search products"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <div className="search-dropdown">
                {searchResults.length > 0 ? (
                  searchResults.map((p) => (
                    <div
                      key={p.id}
                      className="search-item"
                      onClick={() => {
                        navigate(`/product/${p.id}`);
                        setQuery("");
                      }}
                    >
                      <img
                        src={getImageUrl(p.images?.[0] || p.image)}
                        alt={p.name}
                      />

                      <div className="search-content">
                        <div className="search-text">
                          <p className="search-name">{p.name}</p>
                          {/* <span className="search-price">₹{p.price}</span> */}
                        </div>

                        <span className="search-arrow">⬉</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="search-empty">No products found</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="navbar-right">
          <div className="nav-account" onClick={handleAccountClick}>
            <span className="nav-greeting">{navbar.account.greeting}</span>
            <span className="nav-title">{user ? user.name : navbar.account.title}</span>
          </div>

          <div className="nav-orders" onClick={handleOrdersClick}>
            <span>{navbar.orders.line1}</span>
            <span>{navbar.orders.line2}</span>
          </div>

          {/* <div className="nav-cart" onClick={handleCartClick}>
            <img src={getImageUrl(navbar.cart.icon)} alt="cart" />
            <span className="cart-count">{user ? cart.count : 0}</span>
          </div> */}
          <div className="nav-cart" onClick={handleCartClick}>
            <FaShoppingCart /> {/* Cart icon */}
            <span className="cart-count">
              {user ? cart.count : 0}
            </span>
          </div>
          {user ? (
            <div className="nav-user">
              <img
                src={getImageUrl(user.image)}
                alt={user.name}
                className="nav-user-img"
                onClick={() => setSidebarOpen(true)}
              />
              <span className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
                &#9776;
              </span>
            </div>
          ) : (
            <button className="nav-login" onClick={() => navigate("/login")}>
              Login
            </button>
          )}
        </div>
      </nav>

      {sidebarOpen && <div className="sidebar-overlay" />}
      <div ref={sidebarRef} className={`profile-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-user center-content">
            <img
              src={getImageUrl(user?.image)}
              alt={user?.name}
              className="sidebar-user-img-large"
            />
            <div className="sidebar-user-info">
              <h3>{user?.name}</h3>
              <p>{user?.email}</p>
            </div>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li onClick={() => navigate("/profile")}>
            <FaUser style={{ marginRight: "8px" }} />
            Edit Profile
          </li>

          <li onClick={() => navigate("/user-orders")}>
            <FaShoppingCart style={{ marginRight: "8px" }} />
            My Orders
          </li>

          <li onClick={() => navigate("/order-history")}>
            <FaHistory style={{ marginRight: "8px" }} />
            Order History
          </li>

          <li onClick={() => navigate("/settings")}>
            <FaCog style={{ marginRight: "8px" }} />
            Settings
          </li>
        </ul>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </>
  );
}