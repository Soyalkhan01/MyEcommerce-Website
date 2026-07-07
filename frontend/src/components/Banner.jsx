import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../config";
import "./Banner.css";

function Banner() {
  const [banners, setBanners] = useState([]);
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch(`${BASE_URL}/banner`);
        if (!res.ok) throw new Error("Network response was not ok");

        const data = await res.json();

        const validBanners = Array.isArray(data)
          ? data.filter((b) => !b.deleted)
          : [];

        setBanners(validBanners);
      } catch (err) {
        console.error("Banner fetch error:", err);
      }
    };

    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [banners]);

  if (banners.length === 0) return null;

  const banner = banners[index];

  const bannerImage = banner.image?.startsWith("http")
    ? banner.image
    : banner.image
      ? `${BASE_URL}/images/${banner.image}`
      : "https://via.placeholder.com/1200x400";

  const handleClick = () => {
    if (banner.productId) {
      navigate(`/product/${banner.productId}`);
    } else if (banner.buttonLink) {
      window.location.href = banner.buttonLink;
    }
  };

  return (
    <div
      className="banner-slider"
      style={{
        backgroundImage: `url(${bannerImage})`,
        cursor: "pointer",
      }}
      onClick={handleClick}
    >
      <div className="banner-overlay">
        <div className="banner-content">
          <h1>{banner.title}</h1>
          <p>{banner.subtitle}</p>

          {banner.buttonText && banner.buttonLink && (
            <a
              href={banner.buttonLink}
              className="banner-btn"
              onClick={(e) => e.stopPropagation()}
            >
              {banner.buttonText}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default Banner;