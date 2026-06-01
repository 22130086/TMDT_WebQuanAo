import { useState } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import "../../styles/factory.css";

import FactoryDashboard from "../FactoryDashboard";

import ProductList from "../../components/ProductList";
import ProductAdd from "../../components/ProductAdd";
import ProductEdit from "../../components/ProductEdit";
import ProductHide from "../../components/ProductHide";
import DeleteModal from "../../components/DeleteModal";

import ProductionPostList from "../../components/ProductionPostList";
import ProductionPostDetail from "../../components/ProductionPostDetail";

import SendQuote from "../../components/SendQuote";
import EditQuote from "../../components/EditQuote";
import DeleteQuoteModal from "../../components/DeleteQuoteModal";

const Factory = () => {
    const [refreshSignal, setRefreshSignal] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();

    // ── State chức năng 2: xóa sản phẩm ────────────────────────────────────
    const [isDeleteOpen, setIsDeleteOpen]       = useState(false);
    const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

    // ── State chức năng 3: rút báo giá ─────────────────────────────────────
    const [isDeleteQuoteOpen, setIsDeleteQuoteOpen] = useState(false);
    const [deleteQuoteId, setDeleteQuoteId]         = useState<string | null>(null);

    // ── Navigation handler ──────────────────────────────────────────────────
    const handleNavigation = (target: string) => {

        if (target === "list") {
            if (location.pathname.includes("/factory/outsourcing")) {
                navigate("/factory/outsourcing");
            } else {
                navigate("/factory/products");
            }

        } else if (target.startsWith("delete?")) {
            const id = new URLSearchParams(target.split('?')[1]).get('id');
            if (id) {
                setDeleteProductId(id);
                setIsDeleteOpen(true);
            }

        } else if (target.startsWith("edit?")) {
            const id = new URLSearchParams(target.split('?')[1]).get('id');
            if (id) {
                localStorage.setItem('edit_product_id', id);
                navigate(`/factory/products/edit?id=${id}`);
            }

        } else if (target.startsWith("hide?")) {
            const id = new URLSearchParams(target.split('?')[1]).get('id');
            if (id) {
                localStorage.setItem('hide_product_id', id);
                navigate(`/factory/products/hide?id=${id}`);
            }

        } else if (target.startsWith("post-detail")) {
            const id = new URLSearchParams(target.split('?')[1]).get('id');
            navigate(`/factory/outsourcing/detail?id=${id}`);

        } else if (target.startsWith("send-quote")) {
            const id = new URLSearchParams(target.split('?')[1]).get('id');
            navigate(`/factory/outsourcing/send-quote?id=${id}`);

        } else if (target.startsWith("edit-quote")) {
            const id = new URLSearchParams(target.split('?')[1]).get('id');
            navigate(`/factory/outsourcing/edit-quote?id=${id}`);

        } else if (target.startsWith("delete-quote")) {
            // Chỉ cần lấy quotation ID, modal tự fetch data
            const id = new URLSearchParams(target.split('?')[1]).get('id');
            if (id) {
                setDeleteQuoteId(id);
                setIsDeleteQuoteOpen(true);
            }

        } else {
            navigate(`/factory/products/${target}`);
        }
    };

    return (
        <div className="factory-page">
            {/* Sidebar */}
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

                    <Link
                        to="/factory/outsourcing"
                        className={location.pathname.includes("/factory/outsourcing") ? "active" : ""}
                    >
                        <span className="material-symbols-outlined">precision_manufacturing</span>
                        Yêu cầu gia công
                    </Link>

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

            {/* Main */}
            <main className="factory-main">
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

                <section className="factory-content">
                    <Routes>
                        <Route path="/" element={<FactoryDashboard />} />

                        <Route path="products"      element={<ProductList onNavigate={handleNavigation} />} />
                        <Route path="products/add"  element={<ProductAdd  onNavigate={handleNavigation} />} />
                        <Route path="products/edit" element={<ProductEdit onNavigate={handleNavigation} />} />
                        <Route path="products/hide" element={<ProductHide onNavigate={handleNavigation} />} />

                        <Route path="outsourcing" element={
                            <ProductionPostList
                                onNavigate={handleNavigation}
                                refreshSignal={refreshSignal}
                            />
                        } />
                        <Route path="outsourcing/detail"      element={<ProductionPostDetail onNavigate={handleNavigation} />} />
                        <Route path="outsourcing/send-quote"  element={<SendQuote            onNavigate={handleNavigation} />} />
                        <Route path="outsourcing/edit-quote"  element={<EditQuote            onNavigate={handleNavigation} />} />
                    </Routes>
                </section>
            </main>

            {/* Modal xóa sản phẩm — chức năng 2 */}
            <DeleteModal
                isOpen={isDeleteOpen}
                onClose={() => {
                    setIsDeleteOpen(false);
                    setDeleteProductId(null);
                }}
                productId={deleteProductId}
            />

            {/* Modal rút báo giá — chức năng 3 */}
            <DeleteQuoteModal
                isOpen={isDeleteQuoteOpen}
                quotationId={deleteQuoteId}
                onClose={() => {
                    setIsDeleteQuoteOpen(false);
                    setDeleteQuoteId(null);
                }}
                onSuccess={() => {
                    setIsDeleteQuoteOpen(false);
                    setDeleteQuoteId(null);
                    setRefreshSignal((v) => v + 1);
                }}
            />
        </div>
    );
};

export default Factory;