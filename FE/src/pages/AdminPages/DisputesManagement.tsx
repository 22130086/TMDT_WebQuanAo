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
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerdict, setShowVerdict] = useState(false);
  const [verdictTarget, setVerdictTarget] = useState<Dispute | null>(null);
  const [verdictText, setVerdictText] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [verdictNote, setVerdictNote] = useState('');

  const fetchDisputes = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const d = search ? await DisputeService.search(search, p, 10) : await DisputeService.getAll(p, 10);
      if (d?.content) { setDisputes(d.content); setTotalPages(d.totalPages || 1); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search]);

  const fetchStats = useCallback(async () => {
    try { const d = await DisputeService.getStats(); if (d) setStats(d); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchDisputes(page); }, [page, fetchDisputes]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleSearch = () => { setPage(0); fetchDisputes(0); };
  const clearDate = () => { setFromDate(''); setToDate(''); };

  const filtered = disputes.filter(d => {
    const matchStatus = !statusFilter || d.status === statusFilter;
    const matchDate = (!fromDate || (d.createdAt && d.createdAt >= fromDate)) && (!toDate || (d.createdAt && d.createdAt <= toDate + 'T23:59:59'));
    return matchStatus && matchDate;
  });

  const openVerdict = (d: Dispute) => { setVerdictTarget(d); setVerdictText(''); setRefundAmount(''); setTransferAmount(''); setVerdictNote(''); setShowVerdict(true); };
  const submitVerdict = async () => {
    if (!verdictTarget || !verdictText.trim()) return;
    await DisputeService.giveVerdict(verdictTarget.id, { verdict: verdictText, refundToCustomer: refundAmount ? Number(refundAmount) : 0, transferToFactory: transferAmount ? Number(transferAmount) : 0, adminNote: verdictNote });
    setShowVerdict(false); fetchDisputes(page); fetchStats();
  };
  const handleRequestInfo = async (d: Dispute) => {
    const note = prompt('Yêu cầu bổ sung thông tin gì?'); if (!note) return;
    await DisputeService.requestInfo(d.id, note); fetchDisputes(page); fetchStats();
  };

  return (
    <div className="at-container">
      {loading && <div className="at-loading">Đang tải...</div>}

      <div className="at-stats">
        <div className="at-stat primary"><p className="label">Tổng hồ sơ</p><h3 className="number">{stats.total}</h3></div>
        <div className="at-stat warning"><p className="label">Đang xử lý</p><h3 className="number">{stats.open}</h3></div>
        <div className="at-stat info"><p className="label">Cần bổ sung</p><h3 className="number">{stats.infoRequested}</h3></div>
        <div className="at-stat success"><p className="label">Đã phán quyết</p><h3 className="number">{stats.verdictGiven + stats.closed}</h3></div>
      </div>

      <div className="at-section">
        <div className="at-header">
          <h3>Danh sách tranh chấp</h3>
          <div className="at-toolbar">
            <div className="at-search">
              <span className="material-symbols-outlined">search</span>
              <input placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
            </div>
            <select className="at-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Tất cả trạng thái</option>
              <option value="OPEN">Chờ xử lý</option>
              <option value="ADDITIONAL_INFO_REQUESTED">Cần bổ sung</option>
              <option value="VERDICT_GIVEN">Đã phán quyết</option>
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
              <th>Hồ sơ</th><th>Người khởi tạo</th><th>Mô tả</th><th>Ngày tạo</th><th>Trạng thái</th><th className="center">Hành động</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 && !loading && <tr><td colSpan={6} className="at-empty">Không có tranh chấp nào</td></tr>}
              {filtered.map(d => (
                <tr key={d.id}>
                  <td><span className="at-id">#DISP-{d.id}</span><br /><span className="at-sub">ĐH #ORD-{d.orderId}</span></td>
                  <td><span className="at-name">{d.initiatedByName || `User #${d.initiatedById}`}</span></td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.description}</td>
                  <td className="at-date">{d.createdAt ? new Date(d.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                  <td><span className={`at-badge ${statusBadge[d.status] || 'neutral'}`}>{statusLabels[d.status] || d.status}</span></td>
                  <td className="center">
                    {(d.status === 'VERDICT_GIVEN' || d.status === 'CLOSED') ? (
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontStyle: 'italic' }}>Hoàn thành</span>
                    ) : (
                      <div className="at-actions" style={{ opacity: 1, justifyContent: 'center', gap: '0.25rem' }}>
                        <button className="at-btn primary" onClick={() => openVerdict(d)}>Phán quyết</button>
                        {d.status === 'OPEN' && <button className="at-btn warn" onClick={() => handleRequestInfo(d)}>Y/c bổ sung</button>}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="at-pagination">
          <span className="info">Hiển thị {filtered.length} / {stats.total} hồ sơ</span>
          <div className="ctrls">
            <button className="at-page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}><span className="material-symbols-outlined">chevron_left</span></button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
              <button key={i} className={`at-page-num ${i === page ? 'active' : ''}`} onClick={() => setPage(i)}>{i + 1}</button>
            ))}
            <button className="at-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><span className="material-symbols-outlined">chevron_right</span></button>
          </div>
        </div>
      </div>

      {/* Verdict Modal */}
      {showVerdict && verdictTarget && (
        <div className="at-modal-overlay" onClick={() => setShowVerdict(false)}>
          <div className="at-modal" onClick={e => e.stopPropagation()}>
            <div className="at-modal-header">
              <h3>Phán quyết #DISP-{verdictTarget.id}</h3>
              <button className="at-modal-close" onClick={() => setShowVerdict(false)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="at-modal-body">
              <div className="at-summary">
                <div className="at-summary-row"><span>Đơn hàng</span><strong>#ORD-{verdictTarget.orderId}</strong></div>
                <div className="at-summary-row"><span>Người khởi tạo</span><strong>{verdictTarget.initiatedByName || `User #${verdictTarget.initiatedById}`}</strong></div>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1rem' }}>{verdictTarget.description}</p>

              <div className="at-form-group">
                <label>Nội dung phán quyết <span className="req">*</span></label>
                <textarea rows={3} value={verdictText} onChange={e => setVerdictText(e.target.value)} placeholder="Nhập phán quyết..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="at-form-group">
                  <label>Hoàn tiền khách (₫)</label>
                  <input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} placeholder="0" />
                </div>
                <div className="at-form-group">
                  <label>Chuyển cho xưởng (₫)</label>
                  <input type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="at-form-group">
                <label>Ghi chú admin</label>
                <input value={verdictNote} onChange={e => setVerdictNote(e.target.value)} placeholder="Ghi chú nội bộ..." />
              </div>
            </div>
            <div className="at-modal-footer">
              <button className="at-btn outline" onClick={() => setShowVerdict(false)}>Hủy</button>
              <button className="at-btn primary" onClick={submitVerdict}>Xác nhận phán quyết</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputesManagement;
