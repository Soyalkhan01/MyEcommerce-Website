import { useEffect, useState } from "react";
import BASE_URL from "../config";

import "./Preloader.css";

export default function Preloader() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await
          // fetch("http://127.0.0.1:5000/preloader");
          fetch(`${BASE_URL}/preloader`);


        if (!res.ok) throw new Error("Network error");

        const json = await res.json();
        setData(json);
        setLoading(false);
      } catch (err) {
        console.error("Preloader fetch error:", err);
        setError(true);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="preloader">
        <div className="loader-box">
          <div className="spinner"></div>
          <h2>{data?.brand || "Loading..."}</h2>
          <p>{data?.text || "Please wait"}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="preloader">
        <div className="loader-box">
          <h2>{data?.brand || "Oops!"}</h2>
          <p>{data?.errorText || "Connect your network / try again"}</p>
        </div>
      </div>
    );
  }

  return null;
}