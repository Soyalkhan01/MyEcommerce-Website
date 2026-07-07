import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../config";
import "./Brands.css";

export default function Brands() {
  const [brands, setBrands] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${BASE_URL}/brands`)
      .then((res) => setBrands(res.data))
      .catch((err) => console.error("Brands fetch error:", err));
  }, []);

  const handleBrandClick = (brand) => {
    if (brand.url) {
      window.open(
        brand.url.startsWith("http")
          ? brand.url
          : `https://${brand.url}`,
        "_blank"
      );
    } else {
      navigate(`/products?brand=${encodeURIComponent(brand.name)}`);
    }
  };

  return (
    <section id="brands" className="brands-section">
      <h2 className="brands-title">Explore Popular Brands</h2>

      <div className="brands-container">
        {brands.map((brand) => (
          <div
            key={brand.id}
            className="brand-card"
            onClick={() => handleBrandClick(brand)}
            style={{ cursor: "pointer" }}
          >
            <div className="brand-image">
              <img
                src={brand.image?.startsWith("http") ? brand.image : `${BASE_URL}/images/${brand.image}`}
                alt={brand.name}
              />
            </div>
            <p className="brand-name">{brand.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}