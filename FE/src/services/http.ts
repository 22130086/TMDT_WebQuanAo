import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

/** Base URL của backend, dùng để tạo URL đầy đủ cho ảnh */
export const BACKEND_BASE_URL =
  import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "")
    : "http://localhost:8080";

/**
 * Chuyển đường dẫn ảnh tương đối (từ backend) thành URL đầy đủ.
 * Nếu ảnh đã là URL tuyệt đối (http/https) thì giữ nguyên.
 */
export const getImageUrl = (path: string | undefined | null): string => {
  if (!path) return "https://placehold.co/600x600?text=No+Image";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BACKEND_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

const http = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  withCredentials: true,
});

/**
 * Request interceptor
 * Attach JWT token from localStorage.
 */
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor
 * Global error handling.
 */
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default http;
