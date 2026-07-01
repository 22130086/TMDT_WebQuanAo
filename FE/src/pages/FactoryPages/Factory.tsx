import { useState } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import "../../styles/admin.css";

import FactoryDashboard from "../FactoryDashboard";
import ProductList from "../../components/ProductList";
import ProductAdd from "../../components/ProductAdd";
import ProductEdit from "../../components/ProductEdit";
import ProductHide from "../../components/ProductHide";
import FactoryProductDetail from "../../components/FactoryProductDetail";
import DeleteModal from "../../components/DeleteModal";
import ProductionPostList from "../../components/ProductionPostList";
import ProductionPostDetail from "../../components/ProductionPostDetail";
import SendQuote from "../../components/SendQuote";
import EditQuote from "../../components/EditQuote";
import DeleteQuoteModal from "../../components/DeleteQuoteModal";
import FactoryOrders from "./FactoryOrders";
import FactoryProfileEdit from "./FactoryProfileEdit";
import FactoryReviewManagement from "./FactoryReviewManagement";
import FactoryWallet from "./FactoryWallet";
import FactoryDisputes from "./FactoryDisputes";
import FactoryComplaints from "./FactoryComplaints";

const Factory = () => {
    const [refreshSignal, setRefreshSignal] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
    const [isDeleteQuoteOpen, setIsDeleteQuoteOpen] = useState(false);
    const [deleteQuoteId, setDeleteQuoteId] = useState<number | null>(null);

    const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/"); };

    const handleNavigation = (target: string) => {
        if (target === "list") { if (location.pathname.includes("/factory/outsourcing")) navigate("/factory/outsourcing"); else navigate("/factory/products"); }
        else if (target.startsWith("delete?")) { const id = new URLSearchParams(target.split('?')[1]).get('id'); if (id) { setDeleteProductId(id); setIsDeleteOpen(true); } }
        else if (target.startsWith("edit?")) { const id = new URLSearchParams(target.split('?')[1]).get('id'); if (id) { localStorage.setItem('edit_product_id', id); navigate("/factory/products/edit?id=" + id); } }
        else if (target.startsWith("hide?")) { const id = new URLSearchParams(target.split('?')[1]).get('id'); if (id) { localStorage.setItem('hide_product_id', id); navigate("/factory/products/hide?id=" + id); } }
        else if (target.startsWith("post-detail")) { navigate("/factory/outsourcing/detail?id=" + new URLSearchParams(target.split('?')[1]).get('id')); }
        else if (target.startsWith("send-quote")) { navigate("/factory/outsourcing/send-quote?id=" + new URLSearchParams(target.split('?')[1]).get('id')); }
        else if (target.startsWith("edit-quote")) { navigate("/factory/outsourcing/edit-quote?id=" + new URLSearchParams(target.split('?')[1]).get('id')); }
        else if (target.startsWith("delete-quote")) { const id = new URLSearchParams(target.split('?')[1]).get('id'); if (id) { setDeleteQuoteId(Number(id)); setIsDeleteQuoteOpen(true); } }
        else { navigate("/factory/products/" + target); }
    };

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/") ? 'active' : '';

    return (
        <div className="admin-layout">
            <aside className="sidebar">
                <div className="sidebar-brand"><h1>FactoryOS</h1><p>Xưởng sản xuất</p></div>
                <nav className="sidebar-menu">
                    <Link to="/factory" className={location.pathname === "/factory" ? "active" : ""}><span className="material-symbols-outlined">dashboard</span> Tổng quan</Link>
                    <Link to="/factory/products" className={isActive('/factory/products')}><span className="material-symbols-outlined">checkroom</span> Sản phẩm mẫu</Link>
                    <Link to="/factory/outsourcing" className={isActive('/factory/outsourcing')}><span className="material-symbols-outlined">precision_manufacturing</span> Yêu cầu gia công</Link>
                    <Link to="/factory/orders" className={isActive('/factory/orders')}><span className="material-symbols-outlined">inventory_2</span> Đơn hàng</Link>
                    <Link to="/factory/wallet" className={isActive('/factory/wallet')}><span className="material-symbols-outlined">account_balance_wallet</span> Ví tiền</Link>
                    <Link to="/factory/disputes" className={isActive('/factory/disputes')}><span className="material-symbols-outlined">gavel</span> Tranh chấp</Link>
                    <Link to="/factory/complaints" className={isActive('/factory/complaints')}><span className="material-symbols-outlined">report_problem</span> Khiếu nại</Link>
                    <Link to="/factory/reviews" className={isActive('/factory/reviews')}><span className="material-symbols-outlined">reviews</span> Đánh giá</Link>
                    <Link to="/factory/profile" className={isActive('/factory/profile')}><span className="material-symbols-outlined">factory</span> Hồ sơ xưởng</Link>
                </nav>
            </aside>
            <main className="admin-main">
                <header className="admin-header">
                    <div><h2>Xưởng sản xuất</h2></div>
                    <div className="header-actions">
                        <button className="icon-btn"><span className="material-symbols-outlined">notifications</span></button>
                        <button className="icon-btn logout-btn" onClick={handleLogout}><span className="material-symbols-outlined">logout</span></button>
                    </div>
                </header>
                <section style={{ padding: 24 }}>
                    <Routes>
                        <Route path="/" element={<FactoryDashboard />} />
                        <Route path="products" element={<ProductList onNavigate={handleNavigation} />} />
                        <Route path="products/add" element={<ProductAdd onNavigate={handleNavigation} />} />
                        <Route path="products/edit" element={<ProductEdit onNavigate={handleNavigation} />} />
                        <Route path="products/hide" element={<ProductHide onNavigate={handleNavigation} />} />
                        <Route path="products/detail" element={<FactoryProductDetail onNavigate={handleNavigation} />} />
                        <Route path="outsourcing" element={<ProductionPostList onNavigate={handleNavigation} refreshSignal={refreshSignal} />} />
                        <Route path="outsourcing/detail" element={<ProductionPostDetail onNavigate={handleNavigation} />} />
                        <Route path="outsourcing/send-quote" element={<SendQuote onNavigate={handleNavigation} />} />
                        <Route path="outsourcing/edit-quote" element={<EditQuote onNavigate={handleNavigation} />} />
                        <Route path="orders" element={<FactoryOrders />} />
                        <Route path="wallet" element={<FactoryWallet />} />
                        <Route path="disputes" element={<FactoryDisputes />} />
                        <Route path="complaints" element={<FactoryComplaints />} />
                        <Route path="reviews" element={<FactoryReviewManagement />} />
                        <Route path="profile" element={<FactoryProfileEdit />} />
                    </Routes>
                </section>
            </main>
            {isDeleteOpen && deleteProductId && <DeleteModal isOpen={isDeleteOpen} productId={deleteProductId} onClose={() => setIsDeleteOpen(false)} />}
            {isDeleteQuoteOpen && deleteQuoteId && <DeleteQuoteModal isOpen={isDeleteQuoteOpen} quotationId={deleteQuoteId} onClose={() => setIsDeleteQuoteOpen(false)} />}
        </div>
    );
};

export default Factory;
