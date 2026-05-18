import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { EyeOff } from 'lucide-react';
import '../styles/product-hide.css';
import { productService } from '../services/productService';
import axios from 'axios';

interface ProductHideProps {
    onNavigate: (target: string) => void;
}

export default function ProductHide({ onNavigate }: ProductHideProps) {
    // State lưu trữ dữ liệu sản phẩm thật lấy từ DB
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [fetching, setFetching] = useState<boolean>(true);
    const [toast, setToast] = useState<{ show: boolean; success: boolean; message: string }>({
        show: false,
        success: false,
        message: ''
    });

    // Sử dụng React Router để bóc tách ID sản phẩm trên thanh URL (?id=X)
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const productId = queryParams.get('id') || localStorage.getItem('hide_product_id') || '1';

    // 1. Tự động gọi API GET để kéo dữ liệu thật của sản phẩm lên giao diện khi mở trang
    useEffect(() => {
        if (!productId) {
            setToast({ show: true, success: false, message: 'Không tìm thấy ID sản phẩm.' });
            setFetching(false);
            return;
        }

        axios.get(`http://localhost:8080/api/products/${productId}`)
            .then((res) => {
                if (res.data.success && res.data.data) {
                    setProduct(res.data.data);
                }
            })
            .catch((err) => {
                console.error("Lỗi khi lấy chi tiết sản phẩm mẫu:", err);
            })
            .finally(() => setFetching(false));
    }, [productId]);

    // 2. Hàm xử lý gọi API PATCH để ẩn sản phẩm mẫu
    const handleConfirmHide = async () => {
        if (!productId) return;

        try {
            setLoading(true);
            // Gọi API PATCH /api/factory/products/{id}/hide qua productService
            const res = await productService.hideProduct(Number(productId));

            if (res.success) {
                setToast({ show: true, success: true, message: 'Đã cập nhật trạng thái mẫu thiết kế thành ĐÃ ẨN!' });
                localStorage.removeItem('hide_product_id'); // Dọn dẹp ID tạm
                // Chờ 1.5 giây để hiển thị Toast rồi quay lại trang danh sách
                setTimeout(() => onNavigate('list'), 1500);
            } else {
                setToast({ show: true, success: false, message: res.message || 'Thao tác ẩn thất bại.' });
            }
        } catch (err) {
            console.error("Lỗi hệ thống khi ẩn sản phẩm:", err);
            setToast({ show: true, success: false, message: 'Lỗi bảo mật hoặc bạn không có quyền ẩn mẫu này!' });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="main-content">Đang tải thông số kỹ thuật sản phẩm mẫu...</div>;

    return (
        <div className="product-hide-container">
            {/* Toast Alert thông báo trạng thái kết quả */}
            {toast.show && (
                <div className="toast-success-box" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, borderColor: toast.success ? '#bbf7d0' : '#fecaca', backgroundColor: '#fff' }}>
                    <span style={{ color: toast.success ? '#10b981' : '#ef4444', fontWeight: 'bold', marginRight: '8px' }}>
                        {toast.success ? '✓' : '✕'}
                    </span>
                    <span style={{ color: '#1e293b', fontSize: '14px' }}>{toast.message}</span>
                </div>
            )}

            <span className="back-navigation-link" onClick={() => onNavigate('list')}>← QUAY LẠI DANH MỤC</span>
            <h2 className="hide-title">Ẩn sản phẩm</h2>
            <p className="hide-subtitle">Ẩn sản phẩm sẽ khiến sản phẩm không còn hiển thị cho khách hàng nhưng vẫn được lưu trong hệ thống.</p>

            <div className="factory-grid">
                {/* Product Source Card - Hiển thị dữ liệu thật từ Database */}
                <div className="table-card flexible-product-row">
                    <div className="img-thumbnail-holder">
                        {/* ⚙️ SỬA TẠI ĐÂY: Thêm class status-hidden khi sản phẩm đổi sang trạng thái ẩn */}
                        <span className={`current-status-badge ${product?.status === 'HIDDEN' ? 'status-hidden' : ''}`}>
                            • {product?.status === 'ACTIVE' ? 'ĐANG HIỂN THỊ' : 'ĐÃ ẨN'}
                        </span>
                        <img
                            src={product?.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : 'https://placehold.co/150x150?text=No+Image'}
                            alt={product?.name}
                        />
                    </div>
                    <div className="product-text-details">
                        <span className="collection-tag">{product?.categoryName || "Premium Collection"}</span>
                        <h3 className="product-title-heading">{product?.name || "Tên sản phẩm"}</h3>
                        <div className="meta-info-flex">
                            <div>
                                <p className="meta-label">MÃ SẢN PHẨM (ID)</p>
                                <p className="meta-value">SKU-{product?.id}</p>
                            </div>
                            <div>
                                <p className="meta-label">TỒN KHO</p>
                                <p className="meta-value">{product?.stock?.toLocaleString('vi-VN') || 0} Sản phẩm</p>
                            </div>
                            <div>
                                <p className="meta-label">GIÁ THAM KHẢO</p>
                                <p className="meta-value" style={{ color: '#2563eb', fontWeight: 600 }}>
                                    {product?.price ? `${Number(product.price).toLocaleString('vi-VN')}đ` : '0đ'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Target Status Card */}
                <div className="table-card target-status-sidebar">
                    <div>
                        <p className="target-title-uppercase">TRẠNG THÁI MỤC TIÊU</p>
                        <div className="target-badge-block">
                            {/* ⚙️ SỬA TẠI ĐÂY: Thêm class eye-hidden để đổi icon sang màu đỏ khi ẩn thành công */}
                            <div className={`eye-off-container ${product?.status === 'HIDDEN' ? 'eye-hidden' : ''}`}>
                                <EyeOff size={16} />
                            </div>
                            <div>
                                <p className="target-mini-label">SẼ CHUYỂN THÀNH</p>
                                <span className="danger inline-badge">ĐÃ ẨN</span>
                            </div>
                        </div>
                    </div>
                    <div className="action-buttons-stack">
                        {/* Gắn hàm xử lý ẩn vào nút xác nhận */}
                        <button
                            className="new-request-btn flex-center-gap"
                            onClick={handleConfirmHide}
                            disabled={loading || product?.status === 'HIDDEN'}
                            style={{ backgroundColor: product?.status === 'HIDDEN' ? '#64748b' : '#dc2626', borderColor: product?.status === 'HIDDEN' ? '#64748b' : '#dc2626' }}
                        >
                            <EyeOff size={16} /> {loading ? '⏳ Đang lưu...' : 'Ẩn sản phẩm'}
                        </button>
                        <button className="icon-btn cancel-hide-btn" onClick={() => onNavigate('list')}>Hủy thao tác</button>
                    </div>
                </div>
            </div>
        </div>
    );
}