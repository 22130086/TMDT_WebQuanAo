import { useState } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/factory.css";

// Import trang tổng quan và cụm chức năng sản phẩm mẫu (tsx) đã tách
import FactoryDashboard from "./FactoryDashboard";
import ProductList from "../components/ProductList";
import ProductAdd from "../components/ProductAdd";
import ProductEdit from "../components/ProductEdit";
import ProductHide from "../components/ProductHide";
import DeleteModal from "../components/DeleteModal";

const Factory = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // State quản lý việc hiển thị modal xóa (2.3)
    const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
    const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
    // Điều phối URL động thay vì dùng màn hình ảo bằng state
    const handleNavigation = (target: string) => {
        if (target === "list") {
            navigate("/factory/products");
        } else if (target.startsWith("delete")) {
            // Bóc tách lấy ID từ chuỗi "delete?id=X"
            const queryParams = new URLSearchParams(target.split('?')[1]);
            const id = queryParams.get('id');
            if (id) {
                setDeleteProductId(id); // Lưu ID vào state để truyền xuống Modal
                setIsDeleteOpen(true);  // Mở mở popup Modal xóa
            }
        } else if (target.startsWith("edit")) {
            const queryParams = new URLSearchParams(target.split('?')[1]);
            const id = queryParams.get('id');
            if (id) localStorage.setItem('edit_product_id', id);
            navigate(`/factory/products/edit?id=${id}`);
        } else if (target.startsWith("hide")) {
            const queryParams = new URLSearchParams(target.split('?')[1]);
            const id = queryParams.get('id');
            if (id) localStorage.setItem('hide_product_id', id);
            navigate(`/factory/products/hide?id=${id}`);
        } else {
            navigate(`/factory/products/${target}`);
        }
    };

    return (
        <div className="factory-page">
            {/* Sidebar - Khung cố định bên trái */}
            <aside className="factory-sidebar">
                <div className="sidebar-header">
                    <h2>Xưởng May Azure</h2>
                    <p>Xưởng May Azure</p>
                </div>

                <nav className="sidebar-nav">
                    <Link
                        to="/factory"
                        className={location.pathname === "/factory" ? "active" : ""}
                    >
                        <span className="material-symbols-outlined">dashboard</span>
                        Tổng quan
                    </Link>

                    <Link
                        to="/factory/products"
                        className={location.pathname.includes("/factory/products") ? "active" : ""}
                    >
                        <span className="material-symbols-outlined">checkroom</span>
                        Sản phẩm mẫu
                    </Link>

                    <a href="#">
                        <span className="material-symbols-outlined">precision_manufacturing</span>
                        Yêu cầu gia công
                    </a>

                    <a href="#">
                        <span className="material-symbols-outlined">request_quote</span>
                        Báo giá
                    </a>

                    <a href="#">
                        <span className="material-symbols-outlined">inventory_2</span>
                        Đơn hàng
                    </a>

                    <a href="#">
                        <span className="material-symbols-outlined">star_rate</span>
                        Đánh giá
                    </a>

                    <a href="#">
                        <span className="material-symbols-outlined">factory</span>
                        Hồ sơ xưởng
                    </a>
                </nav>

                <div className="sidebar-footer">
                    <button className="new-request-btn">Tạo yêu cầu mới</button>

                    <div className="sidebar-links">
                        <a href="#">
                            <span className="material-symbols-outlined">support_agent</span>
                            Hỗ trợ
                        </a>

                        <a href="#" className="logout">
                            <span className="material-symbols-outlined">logout</span>
                            Đăng xuất
                        </a>
                    </div>
                </div>
            </aside>

            {/* Main Layout Content bên phải */}
            <main className="factory-main">
                {/* Header dùng chung */}
                <header className="factory-header">
                    <div className="header-left">
                        <h1>Azure Industrial</h1>
                    </div>

                    <div className="header-right">
                        <div className="search-box">
                            <span className="material-symbols-outlined">search</span>
                            <input type="text" placeholder="Tìm kiếm đơn hàng..." />
                        </div>

                        <button className="icon-btn">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>

                        <button className="icon-btn">
                            <span className="material-symbols-outlined">settings</span>
                        </button>

                        <div className="profile">
                            <div>
                                <h4>Admin Azure</h4>
                                <p>Quản lý xưởng</p>
                            </div>
                            <img src="https://i.pravatar.cc/100" alt="avatar" />
                        </div>
                    </div>
                </header>

                {/* Nội dung vùng làm việc thay đổi linh hoạt theo route con */}
                <section className="factory-content">
                    <Routes>
                        {/* Khi URL là /factory -> Vào thẳng Dashboard */}
                        <Route path="/" element={<FactoryDashboard />} />

                        {/* Khi URL là /factory/products -> Chức năng 2.5 Danh sách */}
                        <Route path="products" element={<ProductList onNavigate={handleNavigation} />} />

                        {/* Các chức năng 2.1, 2.2, 2.4 lồng nhau */}
                        <Route path="products/add" element={<ProductAdd onNavigate={handleNavigation} />} />
                        <Route path="products/edit" element={<ProductEdit onNavigate={handleNavigation} />} />
                        <Route path="products/hide" element={<ProductHide onNavigate={handleNavigation} />} />
                    </Routes>
                </section>
            </main>

            {/* Triển khai modal xóa chặn ở tầng cha cao nhất */}
            <DeleteModal
                isOpen={isDeleteOpen}
                onClose={() => {
                    setIsDeleteOpen(false);
                    setDeleteProductId(null);
                }}
                productId={deleteProductId}
            />
        </div>
    );
};

export default Factory;