import React, { useState, useEffect, useCallback } from 'react';
import DisputeService from '../../services/disputeService';
import type { Dispute, DisputeStats } from '../../services/disputeService';
import '../../styles/admin-table.css';

const statusLabels: Record<string, string> = { OPEN: 'Chờ xử lý', ADDITIONAL_INFO_REQUESTED: 'Cần bổ sung', VERDICT_GIVEN: 'Đã phán quyết', CLOSED: 'Đã đóng' };
const statusBadge: Record<string, string> = { OPEN: 'warning', ADDITIONAL_INFO_REQUESTED: 'info', VERDICT_GIVEN: 'success', CLOSED: 'neutral' };

const DisputesManagement: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState<DisputeStats>({ total: 0, open: 0, infoRequested: 0, verdictGiven: 0, closed: 0 });
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showVerdict, setShowVerdict] = useState(false);
  const [verdictText, setVerdictText] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [verdictNote, setVerdictNote] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMsg = (type: 'success' | 'error', text: string) => { setMessage({ type, text }); setTimeout(() => setMessage(null), 4000); };

  const fetchDisputes = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const d = search ? await DisputeService.search(search, p, 10) : await DisputeService.getAll(p, 10);
      if (d?.content) { setDisputes(d.content); setTotalPages(d.totalPages || 1); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [search]);

  const fetchStats = useCallback(async () => {
    try { const d = await DisputeService.getStats(); if (d) setStats(d); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchDisputes(page); }, [page, fetchDisputes]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const openDetail = (d: Dispute) => { setSelected(d); setShowDetail(true); };
  const openVerdictModal = (d: Dispute) => { setSelected(d); setVerdictText(''); setRefundAmount(''); setTransferAmount(''); setVerdictNote(''); setShowVerdict(true); };

  const submitVerdict = async () => {
    if (!selected || !verdictText.trim()) return;
    await DisputeService.giveVerdict(selected.id, { verdict: verdictText, refundToCustomer: refundAmount ? Number(refundAmount) : 0, transferToFactory: transferAmount ? Number(transferAmount) : 0, adminNote: verdictNote });
    showMsg('success', 'Đã đưa ra phán quyết'); setShowVerdict(false); fetchDisputes(page); fetchStats();
  };

  const handleRequestInfo = async (d: Dispute) => {
    const note = prompt('Yêu cầu bổ sung thông tin gì?'); if (!note) return;
    await DisputeService.requestInfo(d.id, note); showMsg('success', 'Đã yêu cầu bổ sung'); fetchDisputes(page); fetchStats();
  };

  const handleClose = async (d: Dispute) => {
    if (!confirm('Đóng tranh chấp này?')) return;
    const note = prompt('Ghi chú đóng (tuỳ chọn):') || '';
    await DisputeService.closeDispute(d.id, note || undefined);
    showMsg('success', 'Đã đóng tranh chấp'); fetchDisputes(page); fetchStats();
  };

  const formatMoney = (n?: number) => (n ?? 0).toLocaleString('vi-VN') + ' ₫';
  const filtered = disputes.filter(d => !statusFilter || d.status === statusFilter);

  return (
    <div className="at-container">
      {message && <div className={`wallet-toast ${message.type}`}>{message.text}</div>}
      {loading && <div className="at-loading">Đang tải...</div>}

      <div className="at-stats">
        <div className="at-stat primary"><p className="label">Tổng</p><h3 className="number">{stats.total}</h3></div>
        <div className="at-stat warning"><p className="label">Chờ xử lý</p><h3 className="number">{stats.open}</h3></div>
        <div className="at-stat info"><p className="label">Cần bổ sung</p><h3 className="number">{stats.infoRequested}</h3></div>
        <div className="at-stat success"><p className="label">Đã giải quyết</p><h3 className="number">{stats.verdictGiven + stats.closed}</h3></div>
      </div>

      <div className={`at-main ${showDetail && selected ? 'has-detail' : ''}`}>
        <section className="at-section">
          <div className="at-header">
            <h3>Danh sách tranh chấp</h3>
            <div className="at-toolbar">
              <div className="at-search"><span className="material-symbols-outlined">search</span>
                <input placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && (setPage(0), fetchDisputes(0))} />
              </div>
              <select className="at-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">Tất cả</option><option value="OPEN">Chờ xử lý</option><option value="ADDITIONAL_INFO_REQUESTED">Cần bổ sung</option><option value="VERDICT_GIVEN">Đã phán quyết</option><option value="CLOSED">Đã đóng</option>
              </select>
            </div>
          </div>

          <div className="wallet-table-wrap">
            <table className="wallet-table">
              <thead><tr><th>#</th><th>ĐH</th><th>Người tạo</th><th>Mô tả</th><th>Trạng thái</th><th>Ngày</th><th>Thao tác</th></tr></thead>
              <tbody>
                {filtered.length === 0 && !loading && <tr><td colSpan={7} className="wallet-empty">Không có tranh chấp</td></tr>}
                {filtered.map((d, idx) => (
                  <tr key={d.id}>
                    <td>#{d.id}</td>
                    <td>#{d.orderId}</td>
                    <td>{d.initiatedByName || `#${d.initiatedById}`}</td>
                    <td className="tx-note">{d.description?.slice(0, 50)}{(d.description?.length ?? 0) > 50 ? '...' : ''}</td>
                    <td><span className={`wd-status wd-${d.status === 'OPEN' ? 'pending' : d.status === 'VERDICT_GIVEN' ? 'approved' : d.status === 'CLOSED' ? 'transferred' : 'pending'}`}>{statusLabels[d.status]}</span></td>
                    <td>{d.createdAt ? new Date(d.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                    <td>
                      <div className="wallet-action-btns">
                        <button className="wallet-btn-sm primary" onClick={() => openDetail(d)} title="Xem chi tiết"><span className="material-symbols-outlined">visibility</span></button>
                        {d.status !== 'CLOSED' && d.status !== 'VERDICT_GIVEN' && (
                          <button className="wallet-btn-sm" onClick={() => openVerdictModal(d)} style={{ background: '#fef3c7', color: '#92400e' }} title="Phán quyết"><span className="material-symbols-outlined">gavel</span></button>
                        )}
                        {d.status === 'OPEN' && (
                          <button className="wallet-btn-sm" onClick={() => handleRequestInfo(d)} style={{ background: '#dbeafe', color: '#1e40af' }} title="Y/c bổ sung"><span className="material-symbols-outlined">info</span></button>
                        )}
                        {(d.status === 'VERDICT_GIVEN' || d.status === 'ADDITIONAL_INFO_REQUESTED') && (
                          <button className="wallet-btn-sm" onClick={() => handleClose(d)} style={{ background: '#e2e8f0', color: '#475569' }} title="Đóng"><span className="material-symbols-outlined">lock</span></button>
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
            <div className="wallet-detail-header"><h4>Tranh chấp #{selected.id}</h4>
              <button className="wallet-close-btn" onClick={() => { setShowDetail(false); setSelected(null); }}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="wallet-detail-info">
              <div className="wallet-detail-row"><span>Đơn hàng:</span> #{selected.orderId}</div>
              <div className="wallet-detail-row"><span>Người tạo:</span> {selected.initiatedByName || `#${selected.initiatedById}`}</div>
              <div className="wallet-detail-row"><span>Trạng thái:</span> <span className={`wd-status wd-${selected.status === 'OPEN' ? 'pending' : selected.status === 'VERDICT_GIVEN' ? 'approved' : 'transferred'}`}>{statusLabels[selected.status]}</span></div>
              <div className="wallet-detail-row"><span>Mô tả:</span> {selected.description}</div>
              {selected.verdict && <div className="wallet-detail-row"><span>Phán quyết:</span> {selected.verdict}</div>}
              {selected.refundToCustomer ? <div className="wallet-detail-row"><span>Hoàn KH:</span> <strong className="tx-positive">{formatMoney(selected.refundToCustomer)}</strong></div> : null}
              {selected.transferToFactory ? <div className="wallet-detail-row"><span>Trả xưởng:</span> <strong className="tx-positive">{formatMoney(selected.transferToFactory)}</strong></div> : null}
              {selected.adminNote && <div className="wallet-detail-row"><span>Ghi chú:</span> {selected.adminNote}</div>}
              <div className="wallet-detail-row"><span>Ngày tạo:</span> {selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : '-'}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {selected.status !== 'CLOSED' && selected.status !== 'VERDICT_GIVEN' && (
                <button className="wallet-btn-sm primary" onClick={() => { setShowDetail(false); openVerdictModal(selected); }} style={{ flex: 1, background: '#fef3c7', color: '#92400e', height: 36 }}><span className="material-symbols-outlined" style={{ fontSize: 16 }}>gavel</span> Phán quyết</button>
              )}
              {(selected.status === 'VERDICT_GIVEN' || selected.status === 'ADDITIONAL_INFO_REQUESTED') && (
                <button className="wallet-btn-sm" onClick={() => { handleClose(selected); setShowDetail(false); }} style={{ flex: 1, background: '#e2e8f0', color: '#475569', height: 36 }}><span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock</span> Đóng</button>
              )}
            </div>
          </aside>
        )}
      </div>

      {showVerdict && selected && (
        <div className="wallet-modal-overlay" onClick={() => setShowVerdict(false)}>
          <div className="wallet-modal" onClick={e => e.stopPropagation()}>
            <h3>Phán quyết tranh chấp #{selected.id}</h3>
            <p className="wallet-modal-sub">Đơn hàng #{selected.orderId} — {selected.initiatedByName || `#${selected.initiatedById}`}</p>
            <div className="wallet-form-group"><label>Nội dung phán quyết *</label>
              <textarea rows={3} value={verdictText} onChange={e => setVerdictText(e.target.value)} placeholder="Nhập phán quyết..."
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="wallet-form-group"><label>Hoàn tiền KH (₫)</label><input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} placeholder="0" /></div>
              <div className="wallet-form-group"><label>Trả xưởng (₫)</label><input type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} placeholder="0" /></div>
            </div>
            <div className="wallet-form-group"><label>Ghi chú</label><input value={verdictNote} onChange={e => setVerdictNote(e.target.value)} placeholder="Ghi chú nội bộ..." /></div>
            <div className="wallet-modal-actions">
              <button className="wallet-btn-cancel" onClick={() => setShowVerdict(false)}>Hủy</button>
              <button className="wallet-btn-submit" onClick={submitVerdict}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputesManagement;
