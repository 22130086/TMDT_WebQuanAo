import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/admin.css";

interface AdminLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function AdminLayout({ title, children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>FactoryOS</h1>
          <p>Production Unit 01</p>
        </div>

        <nav className="sidebar-menu">
          <Link to="/admin" className={isActive('/admin')}>
            <span className="material-symbols-outlined">dashboard</span>
            Bảng điều khiển
          </Link>
          <Link to="/admin/products" className={isActive('/admin/products')}>
            <span className="material-symbols-outlined">inventory_2</span>
            Sản phẩm
          </Link>
          <Link to="/admin/orders" className={isActive('/admin/orders')}>
            <span className="material-symbols-outlined">shopping_cart</span>
            Đơn hàng
          </Link>
          <Link to="/admin/factories" className={isActive('/admin/factories')}>
            <span className="material-symbols-outlined">factory</span>
            Duyệt xưởng
          </Link>
          <Link to="/admin/users" className={isActive('/admin/users')}>
            <span className="material-symbols-outlined">group</span>
            Người dùng
          </Link>
          <Link to="/admin/reports" className={isActive('/admin/reports')}>
            <span className="material-symbols-outlined">analytics</span>
            Báo cáo
          </Link>
          <Link to="/admin/complaints" className={isActive('/admin/complaints')}>
            <span className="material-symbols-outlined">report_problem</span>
            Khiếu nại
          </Link>
          <Link to="/admin/disputes" className={isActive('/admin/disputes')}>
            <span className="material-symbols-outlined">gavel</span>
            Tranh chấp
          </Link>
          <Link to="/admin/withdrawals" className={isActive('/admin/withdrawals')}>
            <span className="material-symbols-outlined">payments</span>
            Rút tiền
          </Link>
          <Link to="/admin/wallets" className={isActive('/admin/wallets')}>
            <span className="material-symbols-outlined">account_balance_wallet</span>
            Ví tiền
          </Link>
          <Link to="/admin/reviews" className={isActive('/admin/reviews')}>
            <span className="material-symbols-outlined">reviews</span>
            Đánh giá
          </Link>
          <Link to="/admin/quotations" className={isActive('/admin/quotations')}>
            <span className="material-symbols-outlined">request_quote</span>
            Báo giá
          </Link>
          <Link to="/admin/posts" className={isActive('/admin/posts')}>
            <span className="material-symbols-outlined">post_add</span>
            Bài đăng
          </Link>
          <Link to="/admin/categories" className={isActive('/admin/categories')}>
            <span className="material-symbols-outlined">category</span>
            Danh mục
          </Link>
          <Link to="/admin/attributes" className={isActive('/admin/attributes')}>
            <span className="material-symbols-outlined">palette</span>
            Thuộc tính SP
          </Link>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="admin-main">
        {/* HEADER */}
        <header className="admin-header">
          <div>
            <h2>{title}</h2>
          </div>
          <div className="header-actions">
            <button className="icon-btn" title="Thông báo">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="icon-btn" title="Cài đặt">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button className="icon-btn logout-btn" onClick={handleLogout} title="Đăng xuất">
              <span className="material-symbols-outlined">logout</span>
            </button>
            <img className="avatar" src="https://i.pravatar.cc/100" alt="avatar" />
          </div>
        </header>

        {/* CONTENT */}
        {children}
      </main>
    </div>
  );
}
