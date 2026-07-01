import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { getImageUrl } from '../services/http';
import '../styles/product-edit.css';

interface FactoryProductDetailProps {
    onNavigate: (target: string) => void;
}

export default function FactoryProductDetail({ onNavigate }: FactoryProductDetailProps) {
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const productId = queryParams.get('id');

    useEffect(() => {
        if (!productId) {
            setLoading(false);
            return;
        }

        axios.get(`http://localhost:8080/api/products/${productId}`)
            .then((res) => {
                if (res.data.success && res.data.data) {
                    setProduct(res.data.data);
                }
            })
            .catch((err) => {
                console.error("Lỗi khi tải thông tin sản phẩm mẫu:", err);
            })
            .finally(() => setLoading(false));
    }, [productId]);

    if (loading) return <div className="main-content">Đang tải thông tin sản phẩm...</div>;
    if (!product) return <div className="main-content">Không tìm thấy sản phẩm.</div>;

    return (
        <div className="product-add-container">
            <div className="add-header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 className="main-title">Chi tiết sản phẩm mẫu</h2>
                    <p className="sub-title">Xem thông số kỹ thuật và hình ảnh của mẫu thiết kế.</p>
                </div>
                <button type="button" className="icon-btn" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => onNavigate('list')}>
                    Quay lại
                </button>
            </div>

            <div className="factory-grid">
                <div className="table-card form-flex-wrapper">
                    <div className="input-group">
                        <label className="custom-label">Tên sản phẩm</label>
                        <div className="custom-field" style={{ background: '#f8fafc', padding: '12px' }}>{product.name}</div>
                    </div>

                    <div className="grid-cols-2 row-gap">
                        <div className="input-group">
                            <label className="custom-label">Danh mục</label>
                            <div className="custom-field" style={{ background: '#f8fafc', padding: '12px' }}>{product.categoryName || product.categoryId || "Chưa có"}</div>
                        </div>

                        <div className="input-group">
                            <label className="custom-label">Số lượng tồn kho</label>
                            <div className="custom-field" style={{ background: '#f8fafc', padding: '12px' }}>{product.stock} cái</div>
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="custom-label">Giá tham khảo (VND)</label>
                        <div className="custom-field" style={{ background: '#f8fafc', padding: '12px', fontWeight: 'bold', color: '#b91c1c' }}>
                            {Number(product.price).toLocaleString('vi-VN')} đ
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="custom-label">Mô tả chi tiết sản phẩm</label>
                        <div className="custom-field" style={{ background: '#f8fafc', padding: '12px', minHeight: '100px', whiteSpace: 'pre-line' }}>
                            {product.description || "Không có mô tả"}
                        </div>
                    </div>
                </div>

                <div className="upload-sidebar-flow">
                    <div className="table-card form-flex-wrapper">
                        <label className="custom-label">Hình ảnh sản phẩm</label>
                        <div style={{ marginTop: '10px' }}>
                            <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                                Ảnh đã tải lên ({product.imageUrls ? product.imageUrls.length : 0}):
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                {product.imageUrls?.map((url: string, index: number) => (
                                    <div key={index} style={{ position: 'relative', aspectRatio: '1/1', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <img src={getImageUrl(url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="table-card optimization-tip-box" style={{ marginTop: '16px' }}>
                        <p className="tip-title">ℹ️ TRẠNG THÁI SẢN PHẨM</p>
                        <p className="tip-desc" style={{ color: '#1e40af', fontSize: '12px', lineHeight: '1.6' }}>
                            Trạng thái hiện tại: <strong>{product.status === 'ACTIVE' ? 'ĐANG HIỂN THỊ' : product.status === 'HIDDEN' ? 'ĐÃ ẨN' : product.status}</strong>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
