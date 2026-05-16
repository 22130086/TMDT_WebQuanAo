import { Link, useNavigate } from "react-router-dom";
import "../styles/header.css";

interface HeaderProps {
  onLogout?: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("auth_token");

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
            <a href="#products">Sản phẩm</a>
            <a href="#orders">Đơn hàng</a>
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
              Hồ sơ
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