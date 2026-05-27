import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import '../styles/product-edit.css';
import { productService } from '../services/productService';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
interface ProductEditProps {
    onNavigate: (target: string) => void;
}

interface BackendError {
    response?: {
        data?: {
            message?: string;
        };
    };
}

export default function ProductEdit({ onNavigate }: ProductEditProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock: '',
        categoryId: 7,
        imageUrls: [] as string[]
    });

    const [inputUrl, setInputUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [toast, setToast] = useState<{ show: boolean; success: boolean; message: string }>({
        show: false,
        success: false,
        message: ''
    });
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const productId = queryParams.get('id') || localStorage.getItem('edit_product_id') || '1';

    // 1. Tự động kéo dữ liệu thông số cũ từ Spring Boot lên Form
    useEffect(() => {
        if (!productId) {
            setToast({ show: true, success: false, message: 'Không tìm thấy ID sản phẩm cần chỉnh sửa.' });
            setFetching(false);
            return;
        }

        setFetching(true); // Đảm bảo bật loading khi ID thay đổi
        axios.get(`http://localhost:8080/api/products/${productId}`)
            .then((res) => {
                if (res.data.success && res.data.data) {
                    const p = res.data.data;
                    setFormData({
                        name: p.name,
                        description: p.description || '',
                        price: p.price.toString(),
                        stock: p.stock ? p.stock.toString() : '0',
                        categoryId: p.categoryId || 7,
                        imageUrls: p.imageUrls || []
                    });
                }
            })
            .catch((err) => {
                console.error("Lỗi khi tải thông tin sản phẩm mẫu:", err);
                setToast({ show: true, success: false, message: 'Lỗi kết nối máy chủ khi tải thông tin cũ.' });
            })
            .finally(() => setFetching(false));
    }, [productId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddImageUrl = () => {
        if (inputUrl.trim()) {
            setFormData(prev => ({
                ...prev,
                imageUrls: [...prev.imageUrls, inputUrl.trim()]
            }));
            setInputUrl('');
        }
    };

    const handleRemoveImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            imageUrls: prev.imageUrls.filter((_, i) => i !== index)
        }));
    };

    // 2. Logic gửi dữ liệu cập nhật dạng PUT lên Back-End
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.price) {
            setToast({ show: true, success: false, message: 'Tên sản phẩm và giá không được để trống!' });
            return;
        }

        try {
            setLoading(true);
            const submitData = {
                name: formData.name,
                description: formData.description,
                price: Number(formData.price),
                stock: formData.stock ? Number(formData.stock) : 0,
                categoryId: Number(formData.categoryId)
            };

            // Gọi hàm PUT /api/factory/products/{id} thông qua productService
            const res = await productService.updateProduct(Number(productId), submitData);

            if (res.success) {
                setToast({ show: true, success: true, message: 'Cập nhật thông tin mẫu thiết kế thành công!' });
                // Xóa ID lưu tạm và quay lại trang danh sách sau 1.5 giây
                localStorage.removeItem('edit_product_id');
                setTimeout(() => onNavigate('list'), 1500);
            } else {
                setToast({ show: true, success: false, message: res.message || 'Cập nhật thất bại.' });
            }
        } catch (err: unknown) {
            console.error(err);
            const apiError = err as BackendError;
            setToast({
                show: true,
                success: false,
                message: apiError.response?.data?.message || 'Bạn không có quyền chỉnh sửa tài nguyên của xưởng khác!'
            });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="main-content">Đang tải thông số kỹ thuật mẫu mã...</div>;

    return (
        <div className="product-add-container">
            {/* Toast Alert Thông báo */}
            {toast.show && (
                <div className="toast-success-box" style={{ borderColor: toast.success ? '#bbf7d0' : '#fecaca' }}>
                    <span style={{ color: toast.success ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                        {toast.success ? '✓' : '✕'}
                    </span>
                    <div className="toast-text-wrapper">
                        <p className="toast-title" style={{ color: toast.success ? '#1e293b' : '#991b1b' }}>
                            {toast.success ? 'Thành công' : 'Thất bại'}
                        </p>
                        <p className="toast-desc">{toast.message}</p>
                    </div>
                    <button type="button" onClick={() => setToast(prev => ({ ...prev, show: false }))} style={{ background: 'none', border: 'none', marginLeft: '10px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
                </div>
            )}

            <div className="add-header-section">
                <h2 className="main-title">Chỉnh sửa sản phẩm mẫu</h2>
                <p className="sub-title">Cập nhật lại giá cả tham khảo, số lượng tồn kho hoặc thông số mô tả kỹ thuật vải.</p>
            </div>

            <form onSubmit={handleSubmit} className="factory-grid">
                {/* Khối thông tin bên trái */}
                <div className="table-card form-flex-wrapper">
                    <div className="input-group">
                        <label className="custom-label">Tên mẫu thiết kế *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="custom-field"
                        />
                    </div>

                    <div className="grid-cols-2 row-gap">
                        <div className="input-group">
                            <label className="custom-label">Phân loại danh mục</label>
                            <select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleChange}
                                className="custom-field select-field"
                            >
                                <option value={7}>Áo Thun (ID: 7)</option>
                                <option value={8}>Áo Polo (ID: 8)</option>
                                <option value={9}>Áo Sơ Mi (ID: 9)</option>
                                <option value={10}>Áo Khoác (ID: 10)</option>
                                <option value={11}>Quần Tây (ID: 11)</option>
                                <option value={12}>Quần Jean (ID: 12)</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="custom-label">Số lượng hàng tồn kho</label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                className="custom-field"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="custom-label">Giá bán gia công tham khảo (VND) *</label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            className="custom-field"
                        />
                    </div>

                    <div className="input-group">
                        <label className="custom-label">Mô tả đặc tính chi tiết</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className="custom-field text-area-field"
                        ></textarea>
                    </div>

                    <div className="form-actions-row">
                        <button type="submit" disabled={loading} className="new-request-btn auto-width">
                            {loading ? '⏳ Đang lưu...' : 'Cập nhật thay đổi'}
                        </button>
                        <button type="button" className="icon-btn cancel-btn" onClick={() => onNavigate('list')}>Hủy chỉnh sửa</button>
                    </div>
                </div>

                {/* Khối quản lý hình ảnh bên phải */}
                <div className="upload-sidebar-flow">
                    <div className="table-card form-flex-wrapper">
                        <label className="custom-label">Bộ sưu tập hình ảnh sản phẩm</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                value={inputUrl}
                                onChange={(e) => setInputUrl(e.target.value)}
                                placeholder="Dán URL link ảnh mới vào đây..."
                                className="custom-field"
                            />
                            <button type="button" onClick={handleAddImageUrl} className="new-request-btn auto-width" style={{ padding: '0 16px' }}>Thêm</button>
                        </div>

                        <div style={{ marginTop: '10px' }}>
                            <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                                Danh sách hình ảnh mẫu hiện tại ({formData.imageUrls.length}):
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                {formData.imageUrls.map((url, index) => (
                                    <div key={index} style={{ position: 'relative', aspectRatio: '1/1', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        <button type="button" onClick={() => handleRemoveImage(index)} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}>
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}