import React, { useState, useEffect, useCallback } from 'react';
import ComplaintService from '../../services/complaintService';
import type { Complaint, ComplaintStats } from '../../services/complaintService';
import '../../styles/admin-table.css';

const statusLabels: Record<string, string> = { OPEN: 'Chờ xử lý', PROCESSING: 'Đang xử lý', RESOLVED: 'Đã giải quyết', CLOSED: 'Đã đóng' };

const ComplaintsManagement: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<ComplaintStats>({ totalComplaints: 0, openComplaints: 0, processingComplaints: 0, resolvedComplaints: 0, closedComplaints: 0 });
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolveStatus, setResolveStatus] = useState('RESOLVED');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMsg = (type: 'success' | 'error', text: string) => { setMessage({ type, text }); setTimeout(() => setMessage(null), 4000); };

  const fetchComplaints = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const d = search ? await ComplaintService.searchComplaints(search, p, 10) : await ComplaintService.getAllComplaints(p, 10);
      if (d?.content) { setComplaints(d.content); setTotalPages(d.totalPages || 1); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [search]);

  const fetchStats = useCallback(async () => {
    try { const d = await ComplaintService.getComplaintStats(); if (d) setStats(d); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchComplaints(page); }, [page, fetchComplaints]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const openResolve = (c: Complaint) => { setSelected(c); setResolution(''); setResolveStatus('RESOLVED'); setShowResolve(true); };
  const openDetail = (c: Complaint) => { setSelected(c); setShowDetail(true); };

  const handleResolve = async () => {
    if (!selected || !resolution.trim()) return; setSaving(true);
    try {
      await ComplaintService.resolveComplaint(selected.id, { resolution: resolution.trim(), status: resolveStatus });
      showMsg('success', 'Đã giải quyết khiếu nại'); setShowResolve(false); fetchComplaints(page); fetchStats();
    } catch (e: any) { showMsg('error', e?.response?.data?.message || 'Thất bại'); } finally { setSaving(false); }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try { await ComplaintService.updateStatus(id, status); showMsg('success', 'Cập nhật trạng thái'); fetchComplaints(page); fetchStats(); }
    catch (e: any) { showMsg('error', e?.response?.data?.message || 'Thất bại'); }
  };

  const filtered = complaints.filter(c => !statusFilter || c.status === statusFilter);

  return (
    <div className="at-container">
      {message && <div className={`wallet-toast ${message.type}`}>{message.text}</div>}
      {loading && <div className="at-loading">Đang tải...</div>}

      <div className="at-stats">
        <div className="at-stat primary"><p className="label">Tổng</p><h3 className="number">{stats.totalComplaints}</h3></div>
        <div className="at-stat warning"><p className="label">Chờ</p><h3 className="number">{stats.openComplaints}</h3></div>
        <div className="at-stat info"><p className="label">Đang xử lý</p><h3 className="number">{stats.processingComplaints}</h3></div>
        <div className="at-stat success"><p className="label">Đã giải quyết</p><h3 className="number">{stats.resolvedComplaints + stats.closedComplaints}</h3></div>
      </div>

      <div className={`at-main ${showDetail && selected ? 'has-detail' : ''}`}>
        <section className="at-section">
          <div className="at-header">
            <h3>Danh sách khiếu nại</h3>
            <div className="at-toolbar">
              <div className="at-search"><span className="material-symbols-outlined">search</span>
                <input placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && (setPage(0), fetchComplaints(0))} />
              </div>
              <select className="at-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">Tất cả</option><option value="OPEN">Chờ</option><option value="PROCESSING">Đang xử lý</option><option value="RESOLVED">Đã giải quyết</option><option value="CLOSED">Đã đóng</option>
              </select>
            </div>
          </div>

          <div className="wallet-table-wrap">
            <table className="wallet-table">
              <thead><tr><th>#</th><th>ĐH</th><th>Lý do</th><th>Trạng thái</th><th>Kết quả</th><th>Ngày</th><th>Thao tác</th></tr></thead>
              <tbody>
                {filtered.length === 0 && !loading && <tr><td colSpan={7} className="wallet-empty">Không có khiếu nại</td></tr>}
                {filtered.map((c, idx) => (
                  <tr key={c.id}>
                    <td>{page * 10 + idx + 1}</td>
                    <td>#{c.orderId}</td>
                    <td className="tx-note">{c.reason?.slice(0, 60)}{(c.reason?.length ?? 0) > 60 ? '...' : ''}</td>
                    <td>
                      <select className="at-select" value={c.status} onChange={e => handleUpdateStatus(c.id, e.target.value)} style={{ fontSize: '0.78rem', padding: '3px 8px' }}>
                        <option value="OPEN">Chờ</option><option value="PROCESSING">Đang XL</option><option value="RESOLVED">Đã GQ</option><option value="CLOSED">Đóng</option>
                      </select>
                    </td>
                    <td className="tx-note">{c.resolution || '-'}</td>
                    <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                    <td>
                      <div className="wallet-action-btns">
                        <button className="wallet-btn-sm primary" onClick={() => openDetail(c)}><span className="material-symbols-outlined">visibility</span></button>
                        {(c.status === 'OPEN' || c.status === 'PROCESSING') && (
                          <button className="wallet-btn-sm" onClick={() => openResolve(c)} style={{ background: '#ecfdf5', color: '#065f46' }}><span className="material-symbols-outlined">check_circle</span></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
        </section>

        {showDetail && selected && (
          <aside className="wallet-detail-panel">
            <div className="wallet-detail-header"><h4>Khiếu nại #{selected.id}</h4>
              <button className="wallet-close-btn" onClick={() => { setShowDetail(false); setSelected(null); }}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="wallet-detail-info">
              <div className="wallet-detail-row"><span>Đơn hàng:</span> #{selected.orderId}</div>
              <div className="wallet-detail-row"><span>Trạng thái:</span> {statusLabels[selected.status]}</div>
              <div className="wallet-detail-row"><span>Lý do:</span> {selected.reason}</div>
              {selected.resolution && <div className="wallet-detail-row"><span>Kết quả:</span> {selected.resolution}</div>}
              <div className="wallet-detail-row"><span>Ngày tạo:</span> {selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : '-'}</div>
            </div>
            {(selected.status === 'OPEN' || selected.status === 'PROCESSING') && (
              <button className="wallet-btn-submit" onClick={() => { setShowDetail(false); openResolve(selected); }} style={{ width: '100%', marginTop: 12 }}><span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span> Giải quyết</button>
            )}
          </aside>
        )}
      </div>

      {showResolve && selected && (
        <div className="wallet-modal-overlay" onClick={() => setShowResolve(false)}>
          <div className="wallet-modal" onClick={e => e.stopPropagation()}>
            <h3>Giải quyết khiếu nại #{selected.id}</h3>
            <p className="wallet-modal-sub">Lý do: {selected.reason}</p>
            <div className="wallet-form-group"><label>Phương án giải quyết</label>
              <textarea rows={4} value={resolution} onChange={e => setResolution(e.target.value)} placeholder="Nhập phương án..."
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', resize: 'vertical' }} />
            </div>
            <div className="wallet-form-group"><label>Trạng thái</label>
              <select className="at-select" value={resolveStatus} onChange={e => setResolveStatus(e.target.value)} style={{ width: '100%', padding: '10px' }}>
                <option value="RESOLVED">Đã giải quyết</option><option value="CLOSED">Đã đóng</option><option value="PROCESSING">Đang xử lý</option>
              </select>
            </div>
            <div className="wallet-modal-actions">
              <button className="wallet-btn-cancel" onClick={() => setShowResolve(false)}>Hủy</button>
              <button className="wallet-btn-submit" onClick={handleResolve} disabled={saving}>{saving ? 'Đang xử lý...' : 'Xác nhận'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsManagement;
