const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const BASE_URL = isLocal
  ? "http://127.0.0.1:5000"
  : "https://my-backend-93up.onrender.com";

export default BASE_URL;
