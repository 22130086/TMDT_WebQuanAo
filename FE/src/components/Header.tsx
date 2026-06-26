import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCart } from "../services/cartService";
import http from "../services/http";
import "../styles/header.css";

interface HeaderProps {
  onLogout?: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState<number>(0);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const [countRes, listRes] = await Promise.all([
        http.get("/notifications/unread-count"),
        http.get("/notifications?size=5")
      ]);
      if (countRes.data?.data !== undefined) setUnreadNotif(countRes.data.data);
      if (listRes.data?.data?.content) setNotifs(listRes.data.data.content);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { fetchNotifications(); const t = setInterval(fetchNotifications, 30000); return () => clearInterval(t); }, []);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markRead = async (id: number) => {
    await http.patch(`/notifications/${id}/read`);
    setUnreadNotif(prev => Math.max(0, prev - 1));
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const fetchCartCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setCartCount(0);
        return;
      }
      const response = await getCart();
      const items = Array.isArray(response) ? response : (response?.data || []);
      const count = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      setCartCount(count);
    } catch (error) {
      console.error("Lỗi lấy giỏ hàng ở Header:", error);
    }
  };

  useEffect(() => {
    fetchCartCount();

    window.addEventListener("cart-updated", fetchCartCount);
    return () => {
      window.removeEventListener("cart-updated", fetchCartCount);
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    setCartCount(0);

    if (onLogout) {
      onLogout();
    } else {
      navigate("/");
    }
  }

  return (
    <>
      {/* TOP MINI BAR */}
      <div className="top-mini-bar">
        Kết nối xưởng may và khách hàng toàn quốc
      </div>

      {/* MAIN HEADER */}
      <header className="topbar">
        <div className="topbar-container">

          {/* LOGO */}
          <Link to="/home" className="logo">
            <span className="logo-top">AZURE</span>
            <span className="logo-bottom">INDUSTRIAL</span>
          </Link>

          {/* SEARCH */}
          <div className="search-box">
            <span className="material-symbols-outlined">
              search
            </span>

            <input
              type="text"
              placeholder="Tìm kiếm xưởng may, sản phẩm..."
            />
          </div>

          {/* NAVIGATION */}
          <nav className="nav-links">
            <Link to="/home#factories">Xưởng may</Link>

            <Link to="/products">Sản phẩm</Link>
            <Link to="/custom-order"> Yêu cầu in áo</Link>  
            <Link to="/cart"> Giỏ hàng {cartCount > 0 && `(${cartCount})`}</Link>

            <a href="#about">Giới thiệu</a>
          </nav>

          {/* ACTIONS */}
          <div className="top-actions">
            <div ref={notifRef} style={{ position: "relative" }}>
              <button className="icon-btn" onClick={() => { setShowNotif(!showNotif); if (!showNotif) fetchNotifications(); }} style={{ position: "relative" }}>
                <span className="material-symbols-outlined">notifications</span>
                {unreadNotif > 0 && (
                  <span style={{
                    position: "absolute", top: -2, right: -2, background: "#dc2626", color: "#fff",
                    borderRadius: "50%", width: 18, height: 18, fontSize: 11, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>{unreadNotif > 99 ? "99+" : unreadNotif}</span>
                )}
              </button>
              {showNotif && (
                <div style={{
                  position: "absolute", top: 44, right: 0, width: 360, maxHeight: 400, overflow: "auto",
                  background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                  zIndex: 1000, border: "1px solid #e2e8f0"
                }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", fontWeight: 600, display: "flex", justifyContent: "space-between" }}>
                    <span>Thông báo</span>
                    {unreadNotif > 0 && <span style={{ color: "#dc2626", fontSize: 13 }}>{unreadNotif} chưa đọc</span>}
                  </div>
                  {notifs.length === 0 ? (
                    <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Không có thông báo</div>
                  ) : (
                    notifs.map((n: any) => (
                      <div key={n.id}
                        onClick={() => { if (!n.isRead) markRead(n.id); }}
                        style={{
                          padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #f1f5f9",
                          background: n.isRead ? "#fff" : "#eff6ff", transition: "background 0.15s"
                        }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 20, color: n.type === "WITHDRAWAL" ? "#dc2626" : n.type === "DEPOSIT" ? "#16a34a" : "#2563eb", marginTop: 2 }}>
                            {n.type === "WITHDRAWAL" ? "payments" : n.type === "DEPOSIT" ? "savings" : "notifications"}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: n.isRead ? "#475569" : "#1e293b" }}>{n.title}</div>
                            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{n.body}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{n.createdAt ? new Date(n.createdAt).toLocaleString("vi-VN") : ""}</div>
                          </div>
                          {!n.isRead && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", flexShrink: 0, marginTop: 6 }} />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <button className="icon-btn">
              <span className="material-symbols-outlined">
                favorite
              </span>
            </button>

            <button className="profile-btn">
              <Link to="/customer-profile">Hồ sơ</Link>
            </button>

            <button
              onClick={handleLogout}
              className="logout-btn"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>
    </>
  );
}