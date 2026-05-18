import { useState } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { productService } from '../services/productService';

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string | null;
}

export default function DeleteModal({ isOpen, onClose, productId }: DeleteModalProps) {
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    // Nếu state isOpen bằng false thì không vẽ Modal ra giao diện
    if (!isOpen) return null;

    const handleDeleteSubmit = async () => {
        if (!productId) return;

        try {
            setLoading(true);
            setErrorMessage('');

            // Gọi API DELETE /api/factory/products/{id} từ dịch vụ productService
            const res = await productService.deleteProduct(Number(productId));

            if (res.success) {
                // Xóa thành công thì đóng modal và tải lại trang danh sách để cập nhật bảng
                onClose();
                window.location.reload();
            } else {
                setErrorMessage(res.message || 'Xóa sản phẩm thất bại.');
            }
        } catch (err) {
            console.error("Lỗi khi xóa sản phẩm:", err);
            setErrorMessage('Lỗi hệ thống hoặc bạn không có quyền xóa sản phẩm này.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
            <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '440px', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>

                {/* Header Cảnh báo */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ padding: '8px', backgroundColor: '#fee2e2', borderRadius: '50%', color: '#ef4444', display: 'flex' }}>
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                            Xóa hoàn toàn sản phẩm?
                        </h3>
                        <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
                            Bạn có chắc chắn muốn xóa sản phẩm mẫu có <strong style={{ color: '#0f172a' }}>ID: {productId}</strong> không?
                            Hành động này sẽ gỡ bỏ vĩnh viễn dữ liệu khỏi hệ thống và không thể hoàn tác.
                        </p>
                    </div>
                </div>

                {/* Hiển thị lỗi nếu có */}
                {errorMessage && (
                    <div style={{ marginTop: '14px', padding: '10px 14px', backgroundColor: '#fdf2f2', border: '1px solid #fde2e2', borderRadius: '8px', color: '#ec4899', fontSize: '13px', fontWeight: 500 }}>
                        ⚠️ {errorMessage}
                    </div>
                )}

                {/* Các nút hành động */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="button"
                        onClick={handleDeleteSubmit}
                        disabled={loading}
                        style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', backgroundColor: loading ? '#94a3b8' : '#ef4444', color: '#ffffff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <Trash2 size={16} />
                        {loading ? 'Đang xóa...' : 'Xác nhận xóa'}
                    </button>
                </div>

            </div>
        </div>
    );
}