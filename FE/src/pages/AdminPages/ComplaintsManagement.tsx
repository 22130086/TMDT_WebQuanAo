import React, { useState, useEffect, useCallback } from 'react';
import ComplaintService from '../../services/complaintService';
import type { Complaint, ComplaintStats } from '../../services/complaintService';
import '../../styles/admin-table.css';

const statusLabels: Record<string, string> = { OPEN: 'Chờ xử lý', PROCESSING: 'Đang xử lý', RESOLVED: 'Đã giải quyết', CLOSED: 'Đã đóng' };
const statusBadge: Record<string, string> = { OPEN: 'warning', PROCESSING: 'info', RESOLVED: 'success', CLOSED: 'neutral' };

const ComplaintsManagement: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<ComplaintStats>({ totalComplaints: 0, openComplaints: 0, processingComplaints: 0, resolvedComplaints: 0, closedComplaints: 0 });
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchComplaints = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const d = search
        ? await ComplaintService.searchComplaints(search, p, 10)
        : await ComplaintService.getAllComplaints(p, 10);
      if (d?.content) { setComplaints(d.content); setTotalPages(d.totalPages || 1); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search]);

  const fetchStats = useCallback(async () => {
    try { const d = await ComplaintService.getComplaintStats(); if (d) setStats(d); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchComplaints(page); }, [page, fetchComplaints]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleSearch = () => { setPage(0); fetchComplaints(0); };
  const clearDate = () => { setFromDate(''); setToDate(''); };

  const filtered = complaints.filter(c => {
    const matchStatus = !statusFilter || c.status === statusFilter;
    const matchDate = (!fromDate || (c.createdAt && c.createdAt >= fromDate)) && (!toDate || (c.createdAt && c.createdAt <= toDate + 'T23:59:59'));
    return matchStatus && matchDate;
  });

  return (
    <div className="at-container">
      {loading && <div className="at-loading">Đang tải...</div>}

      <div className="at-stats">
        <div className="at-stat primary"><p className="label">Tổng khiếu nại</p><h3 className="number">{stats.totalComplaints}</h3></div>
        <div className="at-stat warning"><p className="label">Đang chờ</p><h3 className="number">{stats.openComplaints}</h3></div>
        <div className="at-stat info"><p className="label">Đang xử lý</p><h3 className="number">{stats.processingComplaints}</h3></div>
        <div className="at-stat success"><p className="label">Đã giải quyết</p><h3 className="number">{stats.resolvedComplaints}</h3></div>
      </div>

      <div className="at-section">
        <div className="at-header">
          <h3>Danh sách khiếu nại</h3>
          <div className="at-toolbar">
            <div className="at-search">
              <span className="material-symbols-outlined">search</span>
              <input placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
            </div>
            <select className="at-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Tất cả trạng thái</option>
              <option value="OPEN">Chờ xử lý</option>
              <option value="PROCESSING">Đang xử lý</option>
              <option value="RESOLVED">Đã giải quyết</option>
              <option value="CLOSED">Đã đóng</option>
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
              <th>Mã ĐH / Khách</th><th>Lý do</th><th>Ngày gửi</th><th>Trạng thái</th><th className="center">Xem</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 && !loading && <tr><td colSpan={5} className="at-empty">Không có khiếu nại nào</td></tr>}
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <span className="at-id">#ORD-{c.orderId}</span>
                    <span className="at-sub" style={{ marginLeft: '0.5rem' }}>bởi User #{c.raisedById}</span>
                  </td>
                  <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.reason}</td>
                  <td className="at-date">{c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                  <td><span className={`at-badge ${statusBadge[c.status] || 'neutral'}`}>{statusLabels[c.status] || c.status}</span></td>
                  <td className="center">
                    <button className="at-btn outline icon-only" onClick={() => { setSelected(c); setShowDetail(true); }} title="Xem chi tiết">
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>visibility</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="at-pagination">
          <span className="info">Hiển thị {filtered.length} / {stats.totalComplaints} khiếu nại</span>
          <div className="ctrls">
            <button className="at-page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}><span className="material-symbols-outlined">chevron_left</span></button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
              <button key={i} className={`at-page-num ${i === page ? 'active' : ''}`} onClick={() => setPage(i)}>{i + 1}</button>
            ))}
            <button className="at-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><span className="material-symbols-outlined">chevron_right</span></button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && selected && (
        <div className="at-modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="at-modal" onClick={e => e.stopPropagation()}>
            <div className="at-modal-header">
              <h3>Chi tiết khiếu nại #ORD-{selected.orderId}</h3>
              <button className="at-modal-close" onClick={() => setShowDetail(false)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="at-modal-body">
              <div className="at-summary">
                <div className="at-summary-row"><span>Trạng thái</span><span className={`at-badge ${statusBadge[selected.status] || 'neutral'}`}>{statusLabels[selected.status]}</span></div>
                <div className="at-summary-row"><span>Người gửi</span><strong>User #{selected.raisedById}</strong></div>
                <div className="at-summary-row"><span>Ngày gửi</span><strong>{selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : '-'}</strong></div>
                {selected.resolution && <div className="at-summary-row"><span>Kết quả</span><strong>{selected.resolution}</strong></div>}
              </div>
              <div className="at-form-group">
                <label>Lý do khiếu nại</label>
                <textarea rows={3} value={selected.reason} readOnly disabled style={{ background: '#f8fafc' }} />
              </div>
              {selected.evidenceUrl && <p style={{ fontSize: '0.8125rem', color: '#3b82f6' }}>📎 <a href={selected.evidenceUrl} target="_blank" rel="noreferrer">Xem bằng chứng</a></p>}
            </div>
            <div className="at-modal-footer">
              <button className="at-btn outline" onClick={() => setShowDetail(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsManagement;
