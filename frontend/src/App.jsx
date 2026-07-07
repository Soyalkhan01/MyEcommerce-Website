import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import BASE_URL from "./config";

import ScrollToTop from "./components/ScrollToTop";
import Navbar from "./components/Navbar";
import Banner from "./components/Banner";
import Features from "./components/Features";
import Category from "./components/Category";
import LatestProducts from "./components/LatestProducts";
import Products from "./components/Products";
import ProductDetail from "./components/ProductDetail";
import Cart from "./components/Cart";
import Checkout from "./components/Checkout";
import OrderSummary from "./components/OrderSummary";
import Footer from "./components/Footer";
import Preloader from "./components/Preloader";
import Promo from "./components/Promo";
import Brands from "./components/Brands";
import BannerTwo from "./components/BannerTwo";
import Electronics from "./components/Electronics";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Profile from "./components/Profile";
import UserOrders from "./components/UserOrders";
import OrderHistory from "./components/OrderHistory";
import Settings from "./components/Settings";

// Admin Components
import AdminLayout from "./admin/AdminLayout";
import AdminProducts from "./admin/AdminProducts";
import AdminOrders from "./admin/AdminOrders";
import AdminBanners from "./admin/AdminBanners";
import AdminNavbar from "./admin/AdminNavbar";
import AdminLatestProducts from "./admin/AdminLatestProducts";
import AdminCategory from "./admin/AdminCategory";
import AdminFeatures from "./admin/AdminFeatures";
import AdminPromo from "./admin/AdminPromo";
import AdminFooter from "./admin/AdminFooter";
import AdminFavicon from "./admin/AdminFavicon";
import AdminDashboard from "./admin/AdminDashboard";
import AdminBrands from "./admin/AdminBrands";
import AdminBannerTwo from "./admin/AdminBannerTwo";
import AdminElectronic from "./admin/AdminElectronic";
import OwnerProfile from "./admin/OwnerProfile";

import AdminLogin from "./admin/AdminLogin";
import AdminSignUp from "./admin/AdminSignUp";

function App() {
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : { count: 0, items: [] };
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);

  // Loader
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // ================= CART =================

  const addToCart = (product, quantity) => {
    setCart((prev) => {
      const existing = prev.items.find((item) => item.id === product.id);
      let updatedItems;

      if (existing) {
        updatedItems = prev.items.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        updatedItems = [...prev.items, { ...product, quantity }];
      }

      const totalCount = updatedItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      const newCart = { count: totalCount, items: updatedItems };
      localStorage.setItem("cart", JSON.stringify(newCart));
      return newCart;
    });
  };

  const updateQuantity = (id, quantity) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, quantity } : item
      ),
    }));
  };

  const removeFromCart = (id) => {
    setCart((prev) => {
      const updatedItems = prev.items.filter((item) => item.id !== id);
      const totalCount = updatedItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const newCart = { count: totalCount, items: updatedItems };
      localStorage.setItem("cart", JSON.stringify(newCart));
      return newCart;
    });
  };


  useEffect(() => {
    fetch(`${BASE_URL}/site-config`)
      .then((res) => res.json())
      .then((data) => {
        if (!data?.favicon) return;

        let link =
          document.querySelector("link[rel='icon']") ||
          document.createElement("link");

        link.rel = "icon";
        link.type = "image/png";
        link.href = data.favicon.startsWith("http")
          ? data.favicon
          : `${BASE_URL}/images/${data.favicon}?v=${Date.now()}`;

        document.head.appendChild(link);
      })
      .catch((err) => console.error("Favicon load error:", err));
  }, []);


  const AdminPrivateRoute = ({ children }) => {
    const admin = JSON.parse(localStorage.getItem("adminLoggedIn"));
    return admin ? children : <Navigate to="/admin/login" replace />;
  };

  if (loading) return <Preloader />;

  return (
    <>
      <ScrollToTop />
      {toast && <div className="toast">{toast}</div>}

      <Routes>
        {/* HOME */}
        <Route
          path="/"
          element={
            <>
              <Navbar cart={cart} setSearchQuery={setSearchQuery} />
              <Banner />
              <Brands />
              <BannerTwo />
              <LatestProducts addToCart={addToCart} searchQuery={searchQuery} />
              <Category addToCart={addToCart} searchQuery={searchQuery} />
              <Promo />
              <Products addToCart={addToCart} searchQuery={searchQuery} />
              <Electronics addToCart={addToCart} searchQuery={searchQuery} />
              <Features />
              <Footer />
            </>
          }
        />

        {/* USER ROUTES */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/user-orders" element={<UserOrders />} />
        <Route path="/order-history" element={<OrderHistory />} />
        <Route path="/settings" element={<Settings />} />

        {/* PRODUCT DETAIL */}
        <Route
          path="/product/:id"
          element={
            <>
              <Navbar cart={cart} setSearchQuery={setSearchQuery} />
              <ProductDetail addToCart={addToCart} />
              <Footer />
            </>
          }
        />

        {/* CART */}
        <Route
          path="/cart"
          element={
            <>
              <Navbar cart={cart} setSearchQuery={setSearchQuery} />
              <Cart
                cart={cart}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
              />
              <Footer />
            </>
          }
        />

        {/* CHECKOUT */}
        <Route
          path="/checkout"
          element={
            <>
              <Navbar cart={cart} setSearchQuery={setSearchQuery} />
              <Checkout cart={cart} setCart={setCart} />
              <Footer />
            </>
          }
        />

        <Route
          path="/order-summary"
          element={
            <>
              <Navbar cart={cart} />
              <OrderSummary />
              <Footer />
            </>
          }
        />

        {/* ADMIN LOGIN */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/signup" element={<AdminSignUp />} />

        {/* ADMIN PANEL */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={<AdminPrivateRoute><AdminDashboard /></AdminPrivateRoute>} />
          <Route path="products" element={<AdminPrivateRoute><AdminProducts /></AdminPrivateRoute>} />
          <Route path="electronics" element={<AdminPrivateRoute><AdminElectronic /></AdminPrivateRoute>} />
          <Route path="orders" element={<AdminPrivateRoute><AdminOrders /></AdminPrivateRoute>} />
          <Route path="banners" element={<AdminPrivateRoute><AdminBanners /></AdminPrivateRoute>} />
          <Route path="navbar" element={<AdminPrivateRoute><AdminNavbar /></AdminPrivateRoute>} />
          <Route path="latest-products" element={<AdminPrivateRoute><AdminLatestProducts /></AdminPrivateRoute>} />
          <Route path="category" element={<AdminPrivateRoute><AdminCategory /></AdminPrivateRoute>} />
          <Route path="features" element={<AdminPrivateRoute><AdminFeatures /></AdminPrivateRoute>} />
          <Route path="promo" element={<AdminPrivateRoute><AdminPromo /></AdminPrivateRoute>} />
          <Route path="footer" element={<AdminPrivateRoute><AdminFooter /></AdminPrivateRoute>} />
          <Route path="favicon" element={<AdminPrivateRoute><AdminFavicon /></AdminPrivateRoute>} />
          <Route path="brands" element={<AdminPrivateRoute><AdminBrands /></AdminPrivateRoute>} />
          <Route path="banner-two" element={<AdminPrivateRoute><AdminBannerTwo /></AdminPrivateRoute>} />
          <Route path="/admin/profile" element={<OwnerProfile />} />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;