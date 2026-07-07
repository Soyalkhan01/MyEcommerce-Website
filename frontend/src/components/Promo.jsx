import { useEffect, useState } from "react";
import BASE_URL from "../config";

import "./Promo.css";

export default function Promo() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const res = await
          // fetch("http://127.0.0.1:5000/promo");
          fetch(`${BASE_URL}/promo`);

        const data = await res.json();
        if (Array.isArray(data)) setItems(data.slice(0, 4));
        else setItems([]);
      } catch (err) {
        console.error("Failed to fetch promo items:", err);
        setItems([]);
      }
    };
    fetchPromos();
  }, []);

  if (!items.length) return null;

  const getImageUrl = (img) => {
    if (!img) return "https://via.placeholder.com/400x200";
    return img.startsWith("http") ? img : `http://127.0.0.1:5000/images/${img}`;
  };

  return (
    <section className="promo-grid">
      {items.map((p, index) => (
        <div
          key={index}
          className={`promo-card style-${index + 1}`}
          style={{
            backgroundImage: `url(${getImageUrl(p.image)})`,
          }}
        >
          <div className="promo-overlay"></div>
          <div className="promo-content">
            {p.badge && <span className="promo-badge">{p.badge}</span>}
            <h3>{p.title}</h3>
            <p>{p.subtitle}</p>
            {p.buttonLink && (
              <a
                href={p.buttonLink}
                target="_blank"
                rel="noopener noreferrer"
                className="promo-btn"
              >
                {p.buttonText || "Shop Now"}
              </a>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}