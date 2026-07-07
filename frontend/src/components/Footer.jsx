import React, { useEffect, useState } from "react";
import BASE_URL from "../config";

import "./Footer.css";

export default function Footer() {
  const [footerData, setFooterData] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleShopNow = () => {
    const productsSection = document.getElementById("products");
    if (productsSection) {
      productsSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  useEffect(() => {
    // fetch("http://127.0.0.1:5000/footer") 
    fetch(`${BASE_URL}/footer`)

      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(data => setFooterData(data))
      .catch(err => {
        console.error(err);
        setFooterData({ headings: {}, columns: {}, social: {}, newsletter: {}, footerBottom: {} });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading Footer...</p>;

  const { headings, columns, social, newsletter, footerBottom } = footerData;

  return (
    <footer id="about" className="footer">
      <div className="footer-container">
        <div className="footer-columns">
          {Object.keys(columns).map(col => (
            <div key={col} className="footer-column">
              <h3>{headings[col]}</h3>
              <ul>
                {columns[col].map((item, idx) => (
                  <li key={idx}>
                    {item.url ? <a href={item.url}>{item.text}</a> : item.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="footer-column newsletter-column">
            <h3>{headings.connect}</h3>
            <p className="newsletter-text">
              {newsletter.text?.split("\n").map((line, i) => (
                <React.Fragment key={i}>{line}<br /></React.Fragment>
              ))}
            </p>
            <button className="newsletter-btn" onClick={handleShopNow}>{newsletter.button}</button>
            <div className="social-icons">
              {social && Object.keys(social).map(key => (
                <a key={key} href={social[key].url} target="_blank" rel="noopener noreferrer">
                  <img src={`https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/${key}.svg`} alt={social[key].name} />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          {footerBottom?.copyright}
        </div>
      </div>
    </footer>
  );
}