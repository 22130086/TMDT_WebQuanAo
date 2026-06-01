import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCart } from "../services/cartService";
import "../styles/header.css";

interface HeaderProps {
  onLogout?: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState<number>(0);

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
            <a href="#factories">Xưởng may</a>

            <Link to="/products">Sản phẩm</Link>
            <Link to="/custom-order"> Yêu cầu in áo</Link>  
            <Link to="/cart"> Giỏ hàng {cartCount > 0 && `(${cartCount})`}</Link>

            <a href="#about">Giới thiệu</a>
          </nav>

          {/* ACTIONS */}
          <div className="top-actions">
            <button className="icon-btn">
              <span className="material-symbols-outlined">
                notifications
              </span>
            </button>

            <button className="icon-btn">
              <span className="material-symbols-outlined">
                favorite
              </span>
            </button>

            <button className="profile-btn">
              <Link to="/order-history">Hồ sơ</Link>
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