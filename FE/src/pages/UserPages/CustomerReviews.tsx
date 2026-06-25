import { useState, useEffect, useCallback } from 'react';
import { reviewService } from '../../services/reviewService';
import type { ReviewData } from '../../services/reviewService';
import '../../styles/admin-table.css';

const CustomerReviews = () => {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchReviews = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await reviewService.getMyAllReviews(p, 10);
      if (res.success && res.data) {
        setReviews(res.data.content || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchReviews(page); }, [page, fetchReviews]);

  const startEdit = (r: ReviewData) => {
    setEditingId(r.id);
    setEditRating(r.rating);
    setEditComment(r.comment || '');
  };

  const handleUpdate = async () => {
    if (!editingId || !editComment.trim()) return;
    setSaving(true);
    try {
      await reviewService.updateProductReview(editingId, { rating: editRating, comment: editComment.trim() });
      showMsg('success', 'Cập nhật đánh giá thành công!');
      setEditingId(null);
      fetchReviews(page);
    } catch (e: any) {
      showMsg('error', e?.response?.data?.message || 'Cập nhật thất bại');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xác nhận xóa đánh giá này?')) return;
    try {
      await reviewService.deleteProductReview(id);
      showMsg('success', 'Đã xóa đánh giá');
      fetchReviews(page);
    } catch (e: any) {
      showMsg('error', e?.response?.data?.message || 'Xóa thất bại');
    }
  };

  const renderStars = (rating: number, interactive = false) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{
        fontSize: interactive ? 28 : 16,
        cursor: interactive ? 'pointer' : 'default',
        color: i < rating ? '#f59e0b' : '#d1d5db'
      }}
        onClick={interactive ? () => setEditRating(i + 1) : undefined}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="at-container">
      {message && <div className={`wallet-toast ${message.type}`}>{message.text}</div>}
      {loading && <div className="at-loading">Đang tải...</div>}

      <div className="at-header"><h3>Đánh giá của tôi</h3></div>

      <div className="at-section">
        <div className="wallet-table-wrap">
          <table className="wallet-table">
            <thead>
              <tr>
                <th>SP</th>
                <th>Đánh giá</th>
                <th>Bình luận</th>
                <th>Phản hồi từ xưởng</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr><td colSpan={5} className="wallet-empty">Chưa có đánh giá nào</td></tr>
              ) : (
                reviews.map(r => (
                  <tr key={r.id}>
                    <td>#{r.productId}{r.productName ? ` - ${r.productName}` : ''}</td>
                    <td>
                      {editingId === r.id
                        ? <div style={{ display: 'flex' }}>{renderStars(editRating, true)}</div>
                        : <div style={{ display: 'flex' }}>{renderStars(r.rating)}</div>
                      }
                    </td>
                    <td className="tx-note">
                      {editingId === r.id ? (
                        <textarea value={editComment} onChange={e => setEditComment(e.target.value)} rows={2}
                          style={{ width: '100%', padding: 6, border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.82rem', resize: 'vertical' }} />
                      ) : (r.comment || '-')}
                    </td>
                    <td style={{ maxWidth: 200 }}>
                      {r.reply ? (
                        <div style={{ background: '#f0fdf4', padding: '6px 10px', borderRadius: 8, fontSize: '0.82rem', color: '#065f46' }}>
                          <strong>Xưởng:</strong> {r.reply}
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                            {r.repliedAt ? new Date(r.repliedAt).toLocaleString('vi-VN') : ''}
                          </div>
                        </div>
                      ) : <span style={{ color: '#94a3b8' }}>Chưa phản hồi</span>}
                    </td>
                    <td>
                      <div className="wallet-action-btns">
                        {editingId === r.id ? (
                          <>
                            <button className="wallet-btn-sm primary" onClick={handleUpdate} disabled={saving} style={{ background: '#16a34a', color: '#fff' }}>
                              <span className="material-symbols-outlined">check</span>
                            </button>
                            <button className="wallet-btn-sm" onClick={() => setEditingId(null)} style={{ background: '#e2e8f0' }}>
                              <span className="material-symbols-outlined">close</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="wallet-btn-sm primary" onClick={() => startEdit(r)} title="Sửa đánh giá">
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button className="wallet-btn-sm" onClick={() => handleDelete(r.id)} style={{ background: '#fef2f2', color: '#dc2626' }}>
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="wallet-pagination">
            <button disabled={page === 0} onClick={() => setPage(page - 1)}><span className="material-symbols-outlined">chevron_left</span></button>
            <span>Trang {page + 1} / {totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}><span className="material-symbols-outlined">chevron_right</span></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerReviews;
