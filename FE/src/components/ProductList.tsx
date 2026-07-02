import { Plus, Eye, Edit2, EyeOff, Trash2, ChevronLeft, ChevronRight, Undo2, ExternalLink } from 'lucide-react';
import '../styles/product-list.css';
import { productService } from '../services/productService';
import { getImageUrl } from '../services/http';
import { useEffect, useState } from 'react';

interface ProductListProps {
    onNavigate: (target: string) => void;
}

// 🛠️ Định nghĩa Interface rõ ràng thay vì dùng any để vượt qua bộ lọc ESLint
interface ProductItem {
    id: number;
    name: string;
    categoryName?: string;
    description?: string;
    price: number;
    stock?: number;
    status: string;
    imageUrls?: string[];
}

export default function ProductList({ onNavigate }: ProductListProps) {
    // 🛠️ Thay thế any[] thành ProductItem[]
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [filterTab, setFilterTab] = useState<"ALL" | "ACTIVE" | "HIDDEN">("ALL");
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchProducts = () => {
        productService.getMyProducts(0, 50)
            .then((res) => {
                if (res.success && res.data && res.data.content) {
                    setProducts(res.data.content);
                }
            })
            .catch((err) => console.error("Lỗi kết nối API:", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchProducts();
    }, [refreshKey]);

    // Nhận tín hiệu từ DeleteModal để cập nhật dữ liệu tự động
    useEffect(() => {
        const handleRefresh = () => fetchProducts();
        window.addEventListener("refresh_product_list", handleRefresh);
        return () => window.removeEventListener("refresh_product_list", handleRefresh);
    }, []);

    if (loading) return <div className="main-content">Đang tải dữ liệu sản phẩm từ xưởng...</div>;

  const filteredProducts = filterTab === "ALL" ? products : products.filter(p => p.status === filterTab);

    return (
        <div className="product-list-container">
            {/* Header Title */}
            <div className="list-header">
                <div>
                    <h2 className="section-title">Danh sách sản phẩm mẫu</h2>
                    <p className="section-subtitle">Quản lý và cập nhật danh mục sản phẩm may mặc của xưởng.</p>
                </div>
                <button className="new-request-btn custom-width" onClick={() => onNavigate('add')}>
                    <Plus size={18} /> Thêm sản phẩm mới
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button className={`tab-btn ${filterTab === "ALL" ? "active-tab" : "outline-tab"}`}
                    onClick={() => setFilterTab("ALL")}>Tất cả ({products.length})</button>
                <button className={`tab-btn ${filterTab === "ACTIVE" ? "active-tab" : "outline-tab"}`}
                    onClick={() => setFilterTab("ACTIVE")}>Đang hiển thị</button>
                <button className={`tab-btn ${filterTab === "HIDDEN" ? "active-tab" : "outline-tab"}`}
                    onClick={() => setFilterTab("HIDDEN")}>Đã ẩn</button>
            </div>

            {/* Table Data */}
            <div className="table-card no-padding">
                <table className="custom-product-table">
                    <thead>
                    <tr>
                        <th>Hình ảnh</th>
                        <th>Tên sản phẩm</th>
                        <th>Danh mục</th>
                        <th>Mô tả</th>
                        <th>Giá tham khảo</th>
                        <th>Tồn kho</th>
                        <th>Trạng thái</th>
                        <th className="text-center">Hành động</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredProducts.map((p, idx) => (
                        <tr key={idx}>
                            <td>
                                <div className="product-img-box">
                                    <img
                                        src={p.imageUrls && p.imageUrls.length > 0 ? getImageUrl(p.imageUrls[0]) : 'https://placehold.co/100x100?text=No+Image'}
                                        alt={p.name}
                                    />
                                </div>
                            </td>
                            <td>
                                <p className="product-item-name">{p.name}</p>
                                <span className="product-sku">ID: {p.id}</span>
                            </td>
                            <td className="text-muted">{p.categoryName || "Chưa phân loại"}</td>
                            <td className="text-muted" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.description || "Không có mô tả"}
                            </td>
                            <td className="product-price-highlight">
                                {p.price ? `${Number(p.price).toLocaleString('vi-VN')}đ` : '0đ'}
                            </td>
                            <td>
                                <span style={{
                                    fontWeight: 600,
                                    color: (p.stock ?? 0) > 0 ? '#16a34a' : '#ef4444'
                                }}>
                                    {(p.stock ?? 0).toLocaleString('vi-VN')}
                                </span>
                            </td>
                            <td>
                                <span className={p.status === 'ACTIVE' ? 'success' : 'danger'}>
                                    {p.status === 'ACTIVE' ? 'ĐANG HIỂN THỊ' : p.status === 'HIDDEN' ? 'ĐÃ ẨN' : p.status}
                                </span>
                            </td>
                            <td>
                                <div className="action-buttons-group">
                                    <ExternalLink size={18} style={{ cursor: "pointer", color: "#3b82f6" }} title="Xem trang chi tiết" onClick={() => onNavigate(`detail?id=${p.id}`)} />
                                    {p.status === 'HIDDEN' ? (
                                        <Eye size={18} style={{ color: "#16a34a", cursor: "pointer" }}
                                            onClick={() => {
                                                productService.unhideProduct(p.id)
                                                    .then((res) => {
                                                        if (res.success) {
                                                            window.location.reload();
                                                        }
                                                    })
                                                    .catch((err) => console.error("Lỗi hiện sản phẩm:", err));
                                            }} />
                                    ) : (
                                        <EyeOff size={18} onClick={() => onNavigate(`hide?id=${p.id}`)} />
                                    )}
                                    <Edit2 size={18} onClick={() => onNavigate(`edit?id=${p.id}`)} />
                                    <Trash2 size={18} className="delete-icon" onClick={() => onNavigate(`delete?id=${p.id}`)} />
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="pagination-wrapper">
                    <span>HIỂN THỊ 1 - {products.length} SẢN PHẨM</span>
                    <div className="pagination-pages">
                        <button className="nav-page-btn"><ChevronLeft size={16} /></button>
                        <button className="page-num active-page">1</button>
                        <button className="page-num">2</button>
                        <button className="page-num">3</button>
                        <span>...</span>
                        <button className="page-num">12</button>
                        <button className="nav-page-btn"><ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}