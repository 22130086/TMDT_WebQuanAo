import React, { useState, useEffect, useCallback } from 'react';
import AdminQuotationService, { type QuotationData } from '../../services/adminQuotationService';
import '../../styles/admin-table.css';

const statusLabels: Record<string, string> = {
  PENDING: 'Đang chờ', ACCEPTED: 'Đã chấp nhận', REJECTED: 'Từ chối',
  WITHDRAWN: 'Đã rút lại', CANCELLED: 'Đã hủy'
};

const statusColors: Record<string, string> = {
  PENDING: 'warning', ACCEPTED: 'success', REJECTED: 'danger',
  WITHDRAWN: 'info', CANCELLED: 'secondary'
};

const QuotationManagement: React.FC = () => {
  const [data, setData] = useState<QuotationData[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<QuotationData | null>(null);
  const [loading, setLoading] = useState(false);

  const pageSize = 10;

  const fetchData = useCallback(async (p: number, f: string) => {
    setLoading(true);
    try {
      const d = await AdminQuotationService.getAll(f || undefined, p, pageSize);
      if (d?.content) {
        setData(d.content);
        setTotalPages(d.totalPages || 1);
        setTotalElements(d.totalElements || 0);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(page, filter); }, [page, filter, fetchData]);

  const formatMoney = (n: number) => n?.toLocaleString('vi-VN') + ' ₫';

  const filteredData = search
    ? data.filter(d =>
        (d.factoryName || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
        String(d.id).includes(search) ||
        (d.postTitle || '').toLowerCase().includes(search.toLowerCase())
      )
    : data;

  const handleDelete = async (id: number) => {
    const reason = prompt('Lý do xóa báo giá:');
    if (reason === null) return; // user cancelled
    await AdminQuotationService.delete(id, reason || undefined);
    setSelected(null);
    fetchData(page, filter);
  };

  const handleRowClick = async (item: QuotationData) => {
    try {
      const detail = await AdminQuotationService.getById(item.id);
      if (detail) setSelected(detail);
    } catch { setSelected(item); }
  };

  return (
    <div className="at-container">
      {loading && <div className="at-loading">Đang tải...</div>}

      <div className={`at-main ${selected ? 'has-detail' : ''}`}>
        {/* Table */}
        <section className="at-section">
          <div className="at-header">
            <h3>Danh sách Báo giá</h3>
            <div className="at-toolbar">
              <div className="at-search">
                <span className="material-symbols-outlined">search</span>
                <input placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="at-select" value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }}>
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">Đang chờ</option>
                <option value="ACCEPTED">Đã chấp nhận</option>
                <option value="REJECTED">Từ chối</option>
                <option value="WITHDRAWN">Đã rút lại</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
          </div>
          <div className="at-table-wrap">
            <table className="at-table">
              <thead>
                <tr>
                  <th>Mã BG</th>
                  <th>Khách hàng</th>
                  <th>Xưởng</th>
                  <th>Bài đăng</th>
                  <th className="right">Tổng giá</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 && !loading && (
                  <tr><td colSpan={8} className="at-empty">Không có báo giá nào</td></tr>
                )}
                {filteredData.map(d => (
                  <tr key={d.id} onClick={() => handleRowClick(d)} className="clickable">
                    <td><span className="at-id">#BG-{d.id}</span></td>
                    <td><span className="at-name">{d.customerName || `User #${d.customerId}`}</span></td>
                    <td><span className="at-name">{d.factoryName || `Factory #${d.factoryId}`}</span></td>
                    <td>
                      <span className="at-sub" style={{ maxWidth: '150px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.postTitle || `Bài #${d.postId || '-'}`}
                      </span>
                    </td>
                    <td className="right"><span className="at-money">{formatMoney(d.totalPrice)}</span></td>
                    <td>
                      <span className={`at-badge ${statusColors[d.status] || 'info'}`}>
                        {statusLabels[d.status] || d.status}
                      </span>
                    </td>
                    <td className="at-date">{d.createdAt ? new Date(d.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                    <td>
                      <div className="at-actions">
                        <button
                          className="at-btn danger icon-only"
                          title="Xóa báo giá"
                          onClick={e => { e.stopPropagation(); handleDelete(d.id); }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="at-pagination">
            <span className="info">Hiển thị {data.length} / {totalElements}</span>
            <div className="ctrls">
              <button className="at-page-btn" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                <button key={i} className={`at-page-num ${i === page ? 'active' : ''}`} onClick={() => setPage(i)}>
                  {i + 1}
                </button>
              ))}
              <button className="at-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </section>

        {/* Detail Panel */}
        {selected && (
          <aside className="at-detail">
            <div className="at-detail-header">
              <div>
                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#0037b0', textTransform: 'uppercase' }}>Chi tiết báo giá</span>
                <h4>#BG-{selected.id}</h4>
              </div>
              <span className="material-symbols-outlined" style={{ color: '#0037b0', fontSize: '2rem' }}>request_quote</span>
            </div>
            <div className="at-detail-row"><span>Khách hàng</span><strong>{selected.customerName || `User #${selected.customerId}`}</strong></div>
            <div className="at-detail-row"><span>Xưởng</span><strong>{selected.factoryName || `Factory #${selected.factoryId}`}</strong></div>
            <div className="at-detail-row"><span>Bài đăng</span><strong>{selected.postTitle || `#${selected.postId || '-'}`}</strong></div>
            <div className="at-detail-row"><span>Đơn giá</span><strong>{formatMoney(selected.unitPrice)}</strong></div>
            <div className="at-detail-row"><span>Số lượng</span><strong>{selected.quantity}</strong></div>
            <div className="at-detail-row"><span>Tổng giá</span><strong style={{ color: '#16a34a' }}>{formatMoney(selected.totalPrice)}</strong></div>
            {selected.deliveryDays != null && <div className="at-detail-row"><span>Thời gian giao</span><strong>{selected.deliveryDays} ngày</strong></div>}
            {selected.note && <div className="at-detail-row"><span>Ghi chú</span><strong style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>{selected.note}</strong></div>}
            <div className="at-detail-row">
              <span>Trạng thái</span>
              <span className={`at-badge ${statusColors[selected.status] || 'info'}`}>{statusLabels[selected.status] || selected.status}</span>
            </div>
            <div className="at-detail-row"><span>Ngày tạo</span><strong>{selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : '-'}</strong></div>
            {selected.updatedAt && <div className="at-detail-row"><span>Cập nhật</span><strong>{new Date(selected.updatedAt).toLocaleString('vi-VN')}</strong></div>}

            <div className="at-detail-actions">
              <button className="at-btn danger" onClick={() => handleDelete(selected.id)}>
                <span className="material-symbols-outlined">delete</span> Xóa báo giá
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default QuotationManagement;
