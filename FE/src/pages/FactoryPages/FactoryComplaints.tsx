import { useState, useEffect, useCallback } from 'react';
import ComplaintService from '../../services/complaintService';
import type { Complaint } from '../../services/complaintService';
import '../../styles/admin-table.css';

const statusLabels: Record<string, string> = { OPEN: 'Chờ xử lý', PROCESSING: 'Đang xử lý', RESOLVED: 'Đã giải quyết', CLOSED: 'Đã đóng' };

const FactoryComplaints = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [showResolve, setShowResolve] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolveStatus, setResolveStatus] = useState('RESOLVED');
  const [resolving, setResolving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMsg = (type: 'success' | 'error', text: string) => { setMessage({ type, text }); setTimeout(() => setMessage(null), 4000); };

  const fetchComplaints = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const d = await ComplaintService.getFactoryComplaints(p, 10);
      if (d?.content) { setComplaints(d.content); setTotalPages(d.totalPages || 1); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchComplaints(page); }, [page, fetchComplaints]);

  const openResolve = (c: Complaint) => { setSelected(c); setResolution(''); setResolveStatus('RESOLVED'); setShowResolve(true); };

  const handleResolve = async () => {
    if (!selected || !resolution.trim()) { showMsg('error', 'Vui lòng nhập phương án giải quyết'); return; }
    setResolving(true);
    try {
      await ComplaintService.resolveComplaint(selected.id, { resolution: resolution.trim(), status: resolveStatus });
      showMsg('success', 'Đã giải quyết khiếu nại!'); setShowResolve(false); fetchComplaints(0);
    } catch (e: any) { showMsg('error', e?.response?.data?.message || 'Thất bại'); }
    finally { setResolving(false); }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try { await ComplaintService.updateStatus(id, status); showMsg('success', 'Cập nhật trạng thái'); fetchComplaints(page); }
    catch (e: any) { showMsg('error', e?.response?.data?.message || 'Thất bại'); }
  };

  return (
    <div className="at-container">
      {message && <div className={`wallet-toast ${message.type}`}>{message.text}</div>}
      {loading && <div className="at-loading">Đang tải...</div>}

      <div className="at-header"><h3>Khiếu nại từ khách hàng</h3></div>

      <div className={`at-main ${selected && !showResolve ? 'has-detail' : ''}`}>
        <section className="at-section">
          <div className="wallet-table-wrap">
            <table className="wallet-table">
              <thead><tr><th>#</th><th>ĐH</th><th>Lý do</th><th>Trạng thái</th><th>Kết quả</th><th>Ngày</th><th>Thao tác</th></tr></thead>
              <tbody>
                {complaints.length === 0 ? <tr><td colSpan={7} className="wallet-empty">Không có khiếu nại</td></tr> : (
                  complaints.map((c, idx) => (
                    <tr key={c.id}>
                      <td>{idx + 1}</td><td>#{c.orderId}</td>
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
                          <button className="wallet-btn-sm primary" onClick={() => setSelected(c)}><span className="material-symbols-outlined">visibility</span></button>
                          {(c.status === 'OPEN' || c.status === 'PROCESSING') && (
                            <button className="wallet-btn-sm" onClick={() => openResolve(c)} style={{ background: '#ecfdf5', color: '#065f46' }}><span className="material-symbols-outlined">check_circle</span></button>
                          )}
                        </div>
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
        </section>

        {selected && !showResolve && (
          <aside className="wallet-detail-panel">
            <div className="wallet-detail-header"><h4>Khiếu nại #{selected.id}</h4>
              <button className="wallet-close-btn" onClick={() => setSelected(null)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="wallet-detail-info">
              <div className="wallet-detail-row"><span>Đơn hàng:</span> #{selected.orderId}</div>
              <div className="wallet-detail-row"><span>Trạng thái:</span> {statusLabels[selected.status]}</div>
              <div className="wallet-detail-row"><span>Lý do:</span> {selected.reason}</div>
              {selected.resolution && <div className="wallet-detail-row"><span>Giải quyết:</span> {selected.resolution}</div>}
              <div className="wallet-detail-row"><span>Ngày tạo:</span> {selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : '-'}</div>
            </div>
            {(selected.status === 'OPEN' || selected.status === 'PROCESSING') && (
              <button className="wallet-btn-submit" onClick={() => openResolve(selected)} style={{ width: '100%', marginTop: 12 }}><span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span> Giải quyết</button>
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
              <textarea rows={4} value={resolution} onChange={e => setResolution(e.target.value)} placeholder="Nhập phương án giải quyết..."
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', resize: 'vertical' }} />
            </div>
            <div className="wallet-form-group"><label>Trạng thái</label>
              <select className="at-select" value={resolveStatus} onChange={e => setResolveStatus(e.target.value)} style={{ width: '100%', padding: '10px' }}>
                <option value="RESOLVED">Đã giải quyết</option><option value="CLOSED">Đã đóng</option><option value="PROCESSING">Đang xử lý</option>
              </select>
            </div>
            <div className="wallet-modal-actions">
              <button className="wallet-btn-cancel" onClick={() => setShowResolve(false)}>Hủy</button>
              <button className="wallet-btn-submit" onClick={handleResolve} disabled={resolving}>{resolving ? 'Đang xử lý...' : 'Xác nhận'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FactoryComplaints;
