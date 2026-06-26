import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ComplaintService from '../../services/complaintService';
import type { Complaint } from '../../services/complaintService';
import '../../styles/admin-table.css';

const statusLabels: Record<string, string> = {
  OPEN: 'Chờ xử lý', PROCESSING: 'Đang xử lý', RESOLVED: 'Đã giải quyết', CLOSED: 'Đã đóng'
};

const CustomerComplaints = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchComplaints = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const d = await ComplaintService.getMyComplaints(p, 10);
      if (d?.content) { setComplaints(d.content); setTotalPages(d.totalPages || 1); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchComplaints(page); }, [page, fetchComplaints]);

  return (
    <div className="at-container">
      {loading && <div className="at-loading">Đang tải...</div>}

      <div className="at-header">
        <h3>Khiếu nại của tôi</h3>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Tạo khiếu nại từ trang chi tiết đơn hàng</span>
      </div>

      <div className="at-section">
        <div className="wallet-table-wrap">
          <table className="wallet-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Đơn hàng</th>
                <th>Lý do</th>
                <th>Trạng thái</th>
                <th>Kết quả</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {complaints.length === 0 ? (
                <tr><td colSpan={6} className="wallet-empty">Chưa có khiếu nại nào</td></tr>
              ) : (
                complaints.map((c, idx) => (
                  <tr key={c.id}>
                    <td>{page * 10 + idx + 1}</td>
                    <td>
                      <a href="#" onClick={e => { e.preventDefault(); navigate(`/order-detail/${c.orderId}`); }}
                        style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}>
                        #{c.orderId}
                      </a>
                    </td>
                    <td className="tx-note">{c.reason?.slice(0, 80)}{(c.reason?.length ?? 0) > 80 ? '...' : ''}</td>
                    <td><span className={`wd-status wd-${c.status === 'OPEN' ? 'pending' : c.status === 'RESOLVED' ? 'transferred' : 'approved'}`}>{statusLabels[c.status] || c.status}</span></td>
                    <td className="tx-note">{c.resolution || '-'}</td>
                    <td>
                      <button className="wallet-btn-sm primary" onClick={() => navigate(`/order-detail/${c.orderId}`)}>
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
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

export default CustomerComplaints;
