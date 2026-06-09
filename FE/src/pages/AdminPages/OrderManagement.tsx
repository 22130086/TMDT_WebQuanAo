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
  const [selected, setSelected] = useState<AdminOrder | null>(null);

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

  const handleRowClick = async (order: AdminOrder) => {
    try {
      const detail = await AdminOrderService.getById(order.id);
      if (detail) setSelected(detail);
    } catch { setSelected(order); }
  };

  return (
    <div className="at-container">
      {loading && <div className="at-loading">Đang tải...</div>}

      <div className={`at-main ${selected ? 'has-detail' : ''}`}>
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
                  <tr key={o.id} onClick={() => handleRowClick(o)} className="clickable">
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

        {/* Detail Panel */}
        {selected && (
          <aside className="at-detail">
            <div className="at-detail-header">
              <div>
                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#0037b0', textTransform: 'uppercase' }}>Chi tiết đơn hàng</span>
                <h4>#ORD-{selected.id}</h4>
              </div>
              <span className={`at-badge ${statusBadge[selected.status] || 'neutral'}`}>{statusLabels[selected.status] || selected.status}</span>
            </div>

            <div className="at-detail-row"><span>Khách hàng</span><strong>{selected.customerName || selected.customerEmail || `User #${selected.customerId}`}</strong></div>
            {selected.customerEmail && <div className="at-detail-row"><span>Email</span><strong>{selected.customerEmail}</strong></div>}
            <div className="at-detail-row"><span>Người nhận</span><strong>{selected.receiverName || '-'} - {selected.receiverPhone || '-'}</strong></div>
            {selected.shippingAddress && <div className="at-detail-row"><span>Địa chỉ</span><strong style={{ fontSize: '0.8rem' }}>{selected.shippingAddress}</strong></div>}
            {selected.note && <div className="at-detail-row"><span>Ghi chú</span><strong style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>{selected.note}</strong></div>}

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.75rem 0' }} />

            <div className="at-detail-row"><span>Tổng tiền</span><strong>{formatMoney(selected.totalAmount)}</strong></div>
            {selected.discountAmount != null && selected.discountAmount > 0 && <div className="at-detail-row"><span>Giảm giá</span><strong style={{ color: '#dc2626' }}>-{formatMoney(selected.discountAmount)}</strong></div>}
            <div className="at-detail-row"><span>Thành tiền</span><strong style={{ fontSize: '1.1rem', color: '#16a34a' }}>{formatMoney(selected.finalAmount)}</strong></div>
            <div className="at-detail-row"><span>Thanh toán</span><span className={`at-badge ${selected.paymentStatus === 'PAID' ? 'success' : 'warning'}`}>{selected.paymentStatus === 'PAID' ? 'Đã thanh toán' : selected.paymentStatus === 'PENDING' ? 'Chờ thanh toán' : selected.paymentStatus || '-'}</span></div>
            {selected.paymentMethod && <div className="at-detail-row"><span>Phương thức</span><strong>{selected.paymentMethod}</strong></div>}
            {selected.orderType && <div className="at-detail-row"><span>Loại đơn</span><strong>{selected.orderType === 'DIRECT' ? 'Mua trực tiếp' : selected.orderType === 'OUTSOURCING' ? 'Đặt gia công' : selected.orderType}</strong></div>}
            <div className="at-detail-row"><span>Ngày đặt</span><strong>{selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : '-'}</strong></div>

            {/* Items */}
            {selected.items && selected.items.length > 0 && (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.75rem 0' }} />
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0037b0', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Sản phẩm ({selected.items.length})</div>
                <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                      <th style={{ textAlign: 'left', padding: '0.35rem 0.25rem' }}>Sản phẩm</th>
                      <th style={{ textAlign: 'center', padding: '0.35rem 0.25rem' }}>SL</th>
                      <th style={{ textAlign: 'right', padding: '0.35rem 0.25rem' }}>Đơn giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.items.map((item, idx) => (
                      <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.35rem 0.25rem' }}>{item.productName || `SP #${item.productId}`}</td>
                        <td style={{ textAlign: 'center', padding: '0.35rem 0.25rem' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right', padding: '0.35rem 0.25rem', color: '#0f172a', fontWeight: 600 }}>{formatMoney(item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
