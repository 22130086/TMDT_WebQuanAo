import { useState, useEffect, useCallback } from 'react';
import AdminProductService from '../../services/adminProductService';
import type { ProductItem } from '../../services/adminProductService';
import '../../styles/admin-table.css';

const statusLabels: Record<string, string> = { PENDING: 'Chờ duyệt', ACTIVE: 'Hoạt động', HIDDEN: 'Đã ẩn', REJECTED: 'Từ chối', DRAFT: 'Nháp' };
const statusBadge: Record<string, string> = { PENDING: 'warning', ACTIVE: 'success', HIDDEN: 'neutral', REJECTED: 'danger', DRAFT: 'neutral' };

export default function ProductManagement() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [tab, setTab] = useState<'all' | 'pending'>('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const d = tab === 'pending'
        ? await AdminProductService.getPending(p, 10)
        : await AdminProductService.getAll(keyword || undefined, p, 10);
      if (d?.content) { setProducts(d.content); setTotalPages(d.totalPages || 1); setTotal(d.totalElements || 0); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [tab, keyword]);

  useEffect(() => { fetch(page); }, [page, fetch]);

  const handleApprove = async (id: number) => { await AdminProductService.approve(id); fetch(page); };
  const handleReject = async (id: number) => {
    const reason = prompt('Lý do từ chối:');
    if (!reason) return;
    await AdminProductService.reject(id, reason);
    fetch(page);
  };

  const filtered = products.filter(p => {
    const matchStatus = !statusFilter || p.status === statusFilter;
    const matchDate = (!fromDate || (p.createdAt && p.createdAt >= fromDate)) && (!toDate || (p.createdAt && p.createdAt <= toDate + 'T23:59:59'));
    return matchStatus && matchDate;
  });

  const clearDate = () => { setFromDate(''); setToDate(''); };
  const formatMoney = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

  return (
    <div className="at-container">
      {loading && <div className="at-loading">Đang tải...</div>}

      <div className="at-section">
        <div className="at-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h3>Quản lý sản phẩm</h3>
            <div className="at-tabs">
              <button className={`at-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => { setTab('all'); setPage(0); }}>Tất cả</button>
              <button className={`at-tab warn ${tab === 'pending' ? 'active' : ''}`} onClick={() => { setTab('pending'); setPage(0); }}>Chờ duyệt</button>
            </div>
          </div>
          <div className="at-toolbar">
            <div className="at-search">
              <span className="material-symbols-outlined">search</span>
              <input placeholder="Tìm kiếm..." value={keyword} onChange={e => setKeyword(e.target.value)} onKeyDown={e => e.key === 'Enter' && (setPage(0), fetch(0))} />
            </div>
            <select className="at-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="HIDDEN">Đã ẩn</option>
              <option value="REJECTED">Từ chối</option>
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
              <th>Tên sản phẩm</th><th className="right">Giá</th><th>Xưởng</th><th>Ngày tạo</th><th>Trạng thái</th><th className="center">Hành động</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 && !loading && <tr><td colSpan={6} className="at-empty">Không có sản phẩm nào</td></tr>}
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {p.imageUrls?.[0] && <img src={p.imageUrls[0]} alt="" style={{ width: 36, height: 36, borderRadius: '0.375rem', objectFit: 'cover' }} />}
                      <div>
                        <div className="at-name">{p.name}</div>
                        <div className="at-sub">#{p.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="right"><span className="at-money">{formatMoney(p.price)}</span></td>
                  <td>{p.factoryName || `Xưởng #${p.factoryId}`}</td>
                  <td className="at-date">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                  <td><span className={`at-badge ${statusBadge[p.status] || 'neutral'}`}>{statusLabels[p.status] || p.status}</span></td>
                  <td className="center">
                    {p.status === 'PENDING' && (
                      <div className="at-actions" style={{ opacity: 1, justifyContent: 'center' }}>
                        <button className="at-btn primary" onClick={() => handleApprove(p.id)}>Duyệt</button>
                        <button className="at-btn danger" onClick={() => handleReject(p.id)}>Từ chối</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="at-pagination">
          <span className="info">{total} sản phẩm · Hiển thị {filtered.length}</span>
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
