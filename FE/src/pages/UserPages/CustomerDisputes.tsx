import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DisputeService from '../../services/disputeService';
import type { Dispute } from '../../services/disputeService';
import '../../styles/admin-table.css';

const statusLabels: Record<string, string> = {
  OPEN: 'Chờ xử lý', ADDITIONAL_INFO_REQUESTED: 'Cần bổ sung', VERDICT_GIVEN: 'Đã phán quyết', CLOSED: 'Đã đóng'
};

const CustomerDisputes = () => {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchDisputes = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const d = await DisputeService.getMyDisputes(p, 10);
      if (d?.content) { setDisputes(d.content); setTotalPages(d.totalPages || 1); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDisputes(page); }, [page, fetchDisputes]);

  const formatMoney = (n?: number) => (n ?? 0).toLocaleString('vi-VN') + ' ₫';

  return (
    <div className="at-container">
      {loading && <div className="at-loading">Đang tải...</div>}

      <div className="at-header">
        <h3>Tranh chấp của tôi</h3>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Tạo tranh chấp từ trang chi tiết đơn hàng</span>
      </div>

      <div className="at-section">
        <div className="wallet-table-wrap">
          <table className="wallet-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Đơn hàng</th>
                <th>Mô tả</th>
                <th>Trạng thái</th>
                <th>Phán quyết</th>
                <th>Hoàn tiền</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {disputes.length === 0 ? (
                <tr><td colSpan={7} className="wallet-empty">Chưa có tranh chấp nào</td></tr>
              ) : (
                disputes.map((d, idx) => (
                  <tr key={d.id}>
                    <td>{page * 10 + idx + 1}</td>
                    <td>
                      <a href="#" onClick={e => { e.preventDefault(); navigate(`/order-detail/${d.orderId}`); }}
                        style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}>
                        #{d.orderId}
                      </a>
                    </td>
                    <td className="tx-note">{d.description?.slice(0, 80)}{(d.description?.length ?? 0) > 80 ? '...' : ''}</td>
                    <td><span className={`wd-status wd-${d.status === 'OPEN' ? 'pending' : d.status === 'VERDICT_GIVEN' ? 'approved' : 'transferred'}`}>{statusLabels[d.status] || d.status}</span></td>
                    <td className="tx-note">{d.verdict || '-'}</td>
                    <td className="tx-positive">{d.refundToCustomer ? formatMoney(d.refundToCustomer) : '-'}</td>
                    <td>
                      <button className="wallet-btn-sm primary" onClick={() => navigate(`/order-detail/${d.orderId}`)}>
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

export default CustomerDisputes;
