import { useState, useEffect, useCallback } from 'react';
import AdminOrderService from '../../services/orderService';
import type { AdminOrder } from '../../services/orderService';
import '../../styles/admin-table.css';

const statusLabels: Record<string, string> = {
  PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao', RECEIVED: 'Đã nhận', CANCELLED: 'Đã hủy'
};
const statusBadge: Record<string, string> = {
  PENDING: 'warning', CONFIRMED: 'info', SHIPPING: 'info',
  DELIVERED: 'success', RECEIVED: 'success', CANCELLED: 'danger'
};

export default function OrderManagement() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const d = await AdminOrderService.getAll(p, 10);
      if (d?.content) { setOrders(d.content); setTotalPages(d.totalPages || 1); setTotal(d.totalElements || 0); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(page); }, [page, fetch]);

  const formatMoney = (n: number) => n?.toLocaleString('vi-VN') + ' ₫';
  const clearDate = () => { setFromDate(''); setToDate(''); };

  const filtered = orders.filter(o => {
    const matchSearch = !search || String(o.id).includes(search) || (o.customerName || '').toLowerCase().includes(search.toLowerCase()) || (o.customerEmail || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    const matchDate = (!fromDate || (o.createdAt && o.createdAt >= fromDate)) && (!toDate || (o.createdAt && o.createdAt <= toDate + 'T23:59:59'));
    return matchSearch && matchStatus && matchDate;
  });

  return (
    <div className="at-container">
      {loading && <div className="at-loading">Đang tải...</div>}

      <div className="at-section">
        <div className="at-header">
          <div>
            <h3>Danh sách đơn hàng</h3>
            <p className="subtitle">{total} đơn hàng trong hệ thống</p>
          </div>
          <div className="at-toolbar">
            <div className="at-search">
              <span className="material-symbols-outlined">search</span>
              <input placeholder="Tìm mã ĐH, khách..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="at-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xác nhận</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="SHIPPING">Đang giao</option>
              <option value="DELIVERED">Đã giao</option>
              <option value="RECEIVED">Đã nhận</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
            <div className="at-date-filter">
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} title="Từ ngày" />
              <span className="sep">→</span>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} title="Đến ngày" />
              {(fromDate || toDate) && <button className="at-date-clear" onClick={clearDate}><span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>close</span></button>}
            </div>
          </div>
        </div>

        <div className="at-table-wrap">
          <table className="at-table">
            <thead><tr>
              <th>Mã ĐH</th><th>Khách hàng</th><th className="right">Tổng tiền</th><th>Thanh toán</th><th>Ngày đặt</th><th>Trạng thái</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 && !loading && <tr><td colSpan={6} className="at-empty">Không có đơn hàng nào</td></tr>}
              {filtered.map(o => (
                <tr key={o.id}>
                  <td><span className="at-id">#ORD-{o.id}</span></td>
                  <td>
                    <div className="at-name" style={{ fontSize: '0.8125rem' }}>{o.customerName || o.customerEmail || `User #${o.customerId}`}</div>
                    {o.receiverName && <div className="at-sub">Nhận: {o.receiverName} - {o.receiverPhone}</div>}
                  </td>
                  <td className="right">
                    <span className="at-money">{formatMoney(o.finalAmount || o.totalAmount)}</span>
                    {o.paymentMethod && <div className="at-sub" style={{ textAlign: 'right' }}>{o.paymentMethod}</div>}
                  </td>
                  <td><span className={`at-badge ${o.paymentStatus === 'PAID' ? 'success' : o.paymentStatus === 'PENDING' ? 'warning' : 'neutral'}`}>{o.paymentStatus === 'PAID' ? 'Đã TT' : o.paymentStatus === 'PENDING' ? 'Chờ TT' : o.paymentStatus || '-'}</span></td>
                  <td className="at-date">{o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                  <td><span className={`at-badge ${statusBadge[o.status] || 'neutral'}`}>{statusLabels[o.status] || o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="at-pagination">
          <span className="info">Hiển thị {filtered.length} / {total} đơn hàng</span>
          <div className="ctrls">
            <button className="at-page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}><span className="material-symbols-outlined">chevron_left</span></button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
              <button key={i} className={`at-page-num ${i === page ? 'active' : ''}`} onClick={() => setPage(i)}>{i + 1}</button>
            ))}
            <button className="at-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><span className="material-symbols-outlined">chevron_right</span></button>
          </div>
        </div>
      </div>
    </div>
  );
}
