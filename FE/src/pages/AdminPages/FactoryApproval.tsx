import { useState, useEffect, useCallback } from 'react';
import AdminUserService from '../../services/adminUserService';
import type { FactoryInfo } from '../../services/adminUserService';
import '../../styles/admin-table.css';

const statusLabels: Record<string, string> = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' };
const statusBadge: Record<string, string> = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' };

export default function FactoryApproval() {
  const [factories, setFactories] = useState<FactoryInfo[]>([]);
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
      const d = await AdminUserService.getPendingFactories(p, 10);
      if (d?.content) { setFactories(d.content); setTotalPages(d.totalPages || 1); setTotal(d.totalElements || 0); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(page); }, [page, fetch]);

  const handleApprove = async (id: number) => { await AdminUserService.approveFactory(id); fetch(page); };

  const filtered = factories.filter(f => {
    const matchSearch = !search || (f.factoryName || '').toLowerCase().includes(search.toLowerCase()) || (f.address || '').toLowerCase().includes(search.toLowerCase()) || String(f.id).includes(search);
    const matchStatus = !statusFilter || f.verifiedStatus === statusFilter;
    const matchDate = (!fromDate || (f.createdAt && f.createdAt >= fromDate)) && (!toDate || (f.createdAt && f.createdAt <= toDate + 'T23:59:59'));
    return matchSearch && matchStatus && matchDate;
  });

  const clearDate = () => { setFromDate(''); setToDate(''); };

  return (
    <div className="at-container">
      {loading && <div className="at-loading">Đang tải...</div>}

      <div className="at-section">
        <div className="at-header">
          <div>
            <h3>Duyệt xưởng may</h3>
            <p className="subtitle">Phê duyệt hồ sơ xưởng may đăng ký · {total} hồ sơ</p>
          </div>
          <div className="at-toolbar">
            <div className="at-search">
              <span className="material-symbols-outlined">search</span>
              <input placeholder="Tìm tên, địa chỉ..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="at-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="APPROVED">Đã duyệt</option>
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
              <th>ID</th><th>Tên xưởng</th><th>Địa chỉ</th><th>Đánh giá</th><th>Ngày đăng ký</th><th>Trạng thái</th><th className="center">Duyệt</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 && !loading && <tr><td colSpan={7} className="at-empty">Không có xưởng nào</td></tr>}
              {filtered.map(f => (
                <tr key={f.id}>
                  <td><span className="at-id">#{f.id}</span></td>
                  <td><span className="at-name">{f.factoryName || f.factoryUserName || f.factoryUserEmail || `User #${f.userId}`}</span></td>
                  <td className="at-sub">{f.address || '-'}</td>
                  <td>{f.ratingAvg ? f.ratingAvg + ' ⭐' : '-'}</td>
                  <td className="at-date">{f.createdAt ? new Date(f.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                  <td><span className={`at-badge ${statusBadge[f.verifiedStatus] || 'neutral'}`}>{statusLabels[f.verifiedStatus] || f.verifiedStatus}</span></td>
                  <td className="center">
                    {f.verifiedStatus === 'PENDING' && (
                      <button className="at-btn primary" onClick={() => handleApprove(f.id)}>Duyệt</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="at-pagination">
          <span className="info">Hiển thị {filtered.length} / {total} hồ sơ</span>
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
