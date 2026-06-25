import React, { useState, useEffect, useCallback } from 'react';
import http from '../../services/http';
import '../../styles/admin-table.css';

interface ReviewData {
  id: number;
  productId: number;
  productName?: string;
  rating: number;
  comment: string;
  customerId: number;
  customerName: string;
  customerAvatar: string | null;
  reply: string | null;
  repliedAt: string | null;
  isReported?: boolean;
  createdAt: string;
}

interface PageResponse<T> { content: T[]; totalElements: number; totalPages: number; number: number; }
interface ApiResponse<T> { data: T; message?: string; }

const AdminReviewManagement: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reported, setReported] = useState<ReviewData[]>([]);
  const [reportedCount, setReportedCount] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'all' | 'reported'>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchReviews = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await http.get<ApiResponse<PageResponse<ReviewData>>>('/admin/reviews', { params: { page: p, size: 20 } });
      if (res.data?.data) {
        setReviews(res.data.data.content || []);
        setTotalPages(res.data.data.totalPages || 1);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchReported = useCallback(async () => {
    try {
      const res = await http.get<ApiResponse<PageResponse<ReviewData>>>('/admin/reviews/reported', { params: { page: 0, size: 50 } });
      if (res.data?.data) {
        setReported(res.data.data.content || []);
        setReportedCount(res.data.data.totalElements || 0);
      }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchReviews(page); }, [page, fetchReviews]);
  useEffect(() => { fetchReported(); }, [fetchReported]);

  const handleDelete = async (id: number) => {
    if (!confirm('Xác nhận xóa đánh giá này?')) return;
    try {
      await http.delete(`/admin/reviews/${id}`);
      showMsg('success', 'Đã xóa đánh giá');
      fetchReviews(page);
    } catch (e: any) {
      showMsg('error', e?.response?.data?.message || 'Xóa thất bại');
    }
  };

  const handleResolveReport = async (id: number, action: 'DELETE' | 'DISMISS') => {
    const confirmMsg = action === 'DELETE' ? 'Xóa đánh giá vi phạm này?' : 'Bỏ báo cáo (giữ lại đánh giá)?';
    if (!confirm(confirmMsg)) return;
    try {
      await http.patch(`/admin/reviews/${id}/resolve?action=${action}`);
      showMsg('success', action === 'DELETE' ? 'Đã xóa đánh giá vi phạm' : 'Đã bỏ báo cáo');
      fetchReported();
      if (tab === 'all') fetchReviews(page);
    } catch (e: any) {
      showMsg('error', e?.response?.data?.message || 'Thất bại');
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < rating ? '#f59e0b' : '#d1d5db' }}>★</span>
    ));
  };

  return (
    <div className="at-container">
      {message && <div className={`wallet-toast ${message.type}`}>{message.text}</div>}
      {loading && <div className="at-loading">Đang tải...</div>}

      <div className="at-header">
        <h3>Quản lý Đánh giá</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`wallet-btn-outline ${tab === 'all' ? '' : ''}`}
            onClick={() => setTab('all')}
            style={{ fontWeight: tab === 'all' ? 700 : 400, background: tab === 'all' ? '#eff6ff' : '#fff' }}>
            Tất cả
          </button>
          <button className="wallet-btn-outline"
            onClick={() => setTab('reported')}
            style={{ fontWeight: tab === 'reported' ? 700 : 400, background: tab === 'reported' ? '#fef2f2' : '#fff', position: 'relative' }}>
            Bị báo cáo
            {reportedCount > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6, background: '#dc2626', color: '#fff',
                borderRadius: '50%', width: 20, height: 20, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
              }}>{reportedCount}</span>
            )}
          </button>
        </div>
      </div>

      <div className="at-section">
        <div className="wallet-table-wrap">
          <table className="wallet-table">
            <thead>
              <tr>
                <th>SP</th>
                <th>Khách hàng</th>
                <th>Đánh giá</th>
                <th>Bình luận</th>
                <th>Phản hồi</th>
                <th>Ngày</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(tab === 'all' ? reviews : reported).length === 0 ? (
                <tr><td colSpan={7} className="wallet-empty">
                  {tab === 'reported' ? 'Không có đánh giá nào bị báo cáo' : 'Chưa có đánh giá nào'}
                </td></tr>
              ) : (
                (tab === 'all' ? reviews : reported).map((r, idx) => (
                  <tr key={r.id} style={r.isReported ? { background: '#fef2f2' } : undefined}>
                    <td>#{r.productId}{r.productName ? ` - ${r.productName}` : ''}</td>
                    <td>{r.customerName || `#${r.customerId}`}</td>
                    <td><div style={{ display: 'flex' }}>{renderStars(r.rating)}</div></td>
                    <td className="tx-note">{r.comment?.slice(0, 60)}{(r.comment?.length ?? 0) > 60 ? '...' : ''}</td>
                    <td className="tx-note">{r.reply ? (r.reply.slice(0, 40) + ((r.reply?.length ?? 0) > 40 ? '...' : '')) : '-'}</td>
                    <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                    <td>
                      <div className="wallet-action-btns">
                        {r.isReported && (
                          <>
                            <button className="wallet-btn-sm"
                              onClick={() => handleResolveReport(r.id, 'DELETE')}
                              style={{ background: '#fef2f2', color: '#dc2626' }}
                              title="Xóa đánh giá vi phạm">
                              <span className="material-symbols-outlined">delete_forever</span>
                            </button>
                            <button className="wallet-btn-sm"
                              onClick={() => handleResolveReport(r.id, 'DISMISS')}
                              style={{ background: '#ecfdf5', color: '#065f46' }}
                              title="Bỏ báo cáo">
                              <span className="material-symbols-outlined">check_circle</span>
                            </button>
                          </>
                        )}
                        <button className="wallet-btn-sm"
                          onClick={() => handleDelete(r.id)}
                          style={{ background: '#f1f5f9', color: '#64748b' }}
                          title="Xóa đánh giá">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {tab === 'all' && totalPages > 1 && (
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

export default AdminReviewManagement;
