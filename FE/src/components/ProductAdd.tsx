import { useState } from 'react';
import { X } from 'lucide-react';
import '../styles/product-add.css';
import { productService } from '../services/productService';

interface ProductAddProps {
    onNavigate: (target: string) => void;
}

interface BackendError {
    response?: {
        data?: {
            message?: string;
        };
    };
}

export default function ProductAdd({ onNavigate }: ProductAddProps) {
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
    const [toast, setToast] = useState<{ show: boolean; success: boolean; message: string }>({
        show: false,
        success: false,
        message: ''
    });

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
                categoryId: Number(formData.categoryId),
                imageUrls: formData.imageUrls.length > 0 ? formData.imageUrls : ["https://placehold.co/600x600?text=Premium+Garment"]
            };

            const res = await productService.createProduct(submitData);

            if (res.success) {
                setToast({ show: true, success: true, message: 'Thêm sản phẩm thành công! Đang chờ Admin duyệt.' });
                setTimeout(() => onNavigate('list'), 2000);
            } else {
                setToast({ show: true, success: false, message: res.message || 'Thêm thất bại.' });
            }
        } catch (err: unknown) {
            console.error(err);
            const apiError = err as BackendError;
            setToast({
                show: true,
                success: false,
                message: apiError.response?.data?.message || 'Lỗi kết nối server hoặc bạn chưa được APPROVED!'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="product-add-container">
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
                <h2 className="main-title">Thêm sản phẩm mẫu</h2>
                <p className="sub-title">Khởi tạo thông số kỹ thuật và hình ảnh cho mẫu thiết kế mới của xưởng.</p>
            </div>

            <form onSubmit={handleSubmit} className="factory-grid">
                <div className="table-card form-flex-wrapper">
                    <div className="input-group">
                        <label className="custom-label">Tên sản phẩm *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Nhập tên mẫu sản phẩm (Ví dụ: Áo Polo đồng phục)..."
                            className="custom-field"
                        />
                    </div>

                    <div className="grid-cols-2 row-gap">
                        <div className="input-group">
                            <label className="custom-label">Mã ID Danh mục</label>
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
                                <option value={14}>Đồng Phục Công Ty (ID: 14)</option>
                                <option value={15}>Đồng Phục Học Sinh (ID: 15)</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="custom-label">Số lượng tồn kho ban đầu</label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                placeholder="Nhập số lượng tồn, ví dụ: 200..."
                                className="custom-field"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="custom-label">Giá tham khảo (VND) *</label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="Nhập số tiền mặt, ví dụ: 120000..."
                            className="custom-field"
                        />
                    </div>

                    <div className="input-group">
                        <label className="custom-label">Mô tả chi tiết sản phẩm</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Mô tả cụ thể về chất liệu vải, kiểu dáng, phom áo..."
                            className="custom-field text-area-field"
                        ></textarea>
                    </div>

                    <div className="form-actions-row">
                        <button type="submit" disabled={loading} className="new-request-btn auto-width">
                            {loading ? '⏳ Đang lưu...' : 'QL Lưu sản phẩm'}
                        </button>
                        <button type="button" className="icon-btn cancel-btn" onClick={() => onNavigate('list')}>Hủy bỏ</button>
                    </div>
                </div>

                <div className="upload-sidebar-flow">
                    <div className="table-card form-flex-wrapper">
                        <label className="custom-label">Đường dẫn hình ảnh (URL)</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                value={inputUrl}
                                onChange={(e) => setInputUrl(e.target.value)}
                                placeholder="Dán link ảnh từ Unsplash/Cloudinary..."
                                className="custom-field"
                            />
                            <button type="button" onClick={handleAddImageUrl} className="new-request-btn auto-width" style={{ padding: '0 16px' }}>Thêm</button>
                        </div>

                        <div style={{ marginTop: '10px' }}>
                            <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                                Ảnh đã chọn ({formData.imageUrls.length}):
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

                    <div className="table-card optimization-tip-box">
                        <p className="tip-title">⚙️ QUY TRÌNH KIỂM DUYỆT</p>
                        <p className="tip-desc" style={{ color: '#1e40af', fontSize: '12px', lineHeight: '1.6' }}>
                            Sản phẩm mẫu sau khi xưởng tạo mới sẽ ở trạng thái <strong>PENDING</strong>. Bạn cần đăng nhập bằng tài khoản <strong>ADMIN</strong> để thực hiện duyệt qua endpoint <code>PATCH /api/admin/products/{"{id}"}/approve</code> thì sản phẩm mới hiển thị công khai.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}