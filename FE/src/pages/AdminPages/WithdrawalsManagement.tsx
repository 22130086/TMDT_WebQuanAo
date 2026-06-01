import React, { useState, useEffect, useCallback } from 'react';
import WithdrawalService from '../../services/withdrawalService';
import type { Withdrawal, WithdrawalStats } from '../../services/withdrawalService';
import '../../styles/withdrawals-management.css';

const statusLabels: Record<string, string> = {
  PENDING: 'Đang chờ', APPROVED: 'Đã duyệt', TRANSFERRED: 'Đã chuyển', REJECTED: 'Từ chối'
};

const WithdrawalsManagement: React.FC = () => {
  const [data, setData] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState<WithdrawalStats>({ total: 0, pending: 0, approved: 0, transferred: 0, rejected: 0 });
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Withdrawal | null>(null);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  const fetchData = useCallback(async (p: number, f: string) => {
    setLoading(true);
    try {
      const d = await WithdrawalService.getAll(f || undefined, p, pageSize);
      if (d?.content) { setData(d.content); setTotalPages(d.totalPages || 1); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(page, filter); }, [page, filter, fetchData]);
  useEffect(() => { WithdrawalService.getStats().then(s => { if (s) setStats(s); }).catch(console.error); }, []);

  const formatMoney = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

  const handleApprove = async (id: number) => {
    await WithdrawalService.approve(id);
    fetchData(page, filter);
    WithdrawalService.getStats().then(s => { if (s) setStats(s); });
  };
  const handleReject = async (id: number) => {
    const note = prompt('Lý do từ chối:');
    if (!note) return;
    await WithdrawalService.reject(id, note);
    fetchData(page, filter);
    WithdrawalService.getStats().then(s => { if (s) setStats(s); });
  };
  const handleTransfer = async (id: number) => {
    await WithdrawalService.markTransferred(id);
    fetchData(page, filter);
    WithdrawalService.getStats().then(s => { if (s) setStats(s); });
  };

  return (
    <div className="withdrawals-container">
      {loading && <div className="loading-bar">Đang tải...</div>}

      {/* Stats */}
      <div className="withdrawals-stats">
        <div className="wstat-card primary"><p className="label">Tổng yêu cầu</p><h3 className="number">{stats.total}</h3></div>
        <div className="wstat-card warning"><p className="label">Đang chờ</p><h3 className="number">{stats.pending}</h3></div>
        <div className="wstat-card info"><p className="label">Đã duyệt</p><h3 className="number">{stats.approved}</h3></div>
        <div className="wstat-card success"><p className="label">Đã chuyển</p><h3 className="number">{stats.transferred}</h3></div>
      </div>

      <div className="withdrawals-main">
        {/* Table */}
        <section className="wtable-section">
          <div className="wtable-header">
            <h3>Danh sách yêu cầu rút tiền</h3>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div className="wsearch">
                <span className="material-symbols-outlined">search</span>
                <input placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="wfilter">
                <select value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }}>
                  <option value="">Tất cả</option>
                  <option value="PENDING">Đang chờ</option>
                  <option value="APPROVED">Đã duyệt</option>
                  <option value="TRANSFERRED">Đã chuyển</option>
                  <option value="REJECTED">Từ chối</option>
                </select>
              </div>
            </div>
          </div>
          <div className="wtable-wrapper">
            <table>
              <thead><tr><th>Mã yêu cầu</th><th>Tên xưởng</th><th style={{ textAlign: 'right' }}>Số tiền</th><th>Ngân hàng</th><th>Ngày</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
              <tbody>
                {data.length === 0 && !loading && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Không có yêu cầu nào</td></tr>}
                {data.map(d => (
                  <tr key={d.id} onClick={() => setSelected(d)} style={{ cursor: 'pointer' }}>
                    <td><span className="wid">#WD-{d.id}</span></td>
                    <td><span className="wfactory">{d.factoryName || d.factoryUserName || `User #${d.factoryUserId}`}</span></td>
                    <td className="wamount">{formatMoney(d.amount)}</td>
                    <td><div className="wbank"><div className="name">{d.bankName}</div><div className="stk">{d.accountNumber}</div></div></td>
                    <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{d.createdAt ? new Date(d.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                    <td><span className={`wstatus ${d.status}`}>{statusLabels[d.status]}</span></td>
                    <td>
                      <div className="wactions">
                        {d.status === 'PENDING' && (
                          <>
                            <button className="approve" title="Duyệt" onClick={e => { e.stopPropagation(); handleApprove(d.id); }}><span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>check</span></button>
                            <button className="reject" title="Từ chối" onClick={e => { e.stopPropagation(); handleReject(d.id); }}><span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span></button>
                          </>
                        )}
                        {d.status === 'APPROVED' && (
                          <button className="transfer" title="Đánh dấu đã chuyển" onClick={e => { e.stopPropagation(); handleTransfer(d.id); }}><span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>payments</span></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="wpagination">
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Hiển thị {data.length} / {stats.total}</span>
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              <button className="pagination-btn" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}><span className="material-symbols-outlined">chevron_left</span></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                <button key={i} className={`pagination-page ${i === page ? 'active' : ''}`} onClick={() => setPage(i)}>{i + 1}</button>
              ))}
              <button className="pagination-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}><span className="material-symbols-outlined">chevron_right</span></button>
            </div>
          </div>
        </section>

        {/* Detail Panel */}
        {selected && (
          <aside className="wdetail-panel">
            <div className="wdetail-header">
              <div>
                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#0037b0', textTransform: 'uppercase' }}>Chi tiết yêu cầu</span>
                <h4 className="wdetail-factory">{selected.factoryName || selected.factoryUserName || `#${selected.factoryUserId}`}</h4>
              </div>
              <span className="material-symbols-outlined" style={{ color: '#0037b0', fontSize: '2rem' }}>factory</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div><p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#747686' }}>SỐ DƯ XƯỞNG</p><p style={{ fontWeight: 700, color: '#16a34a' }}>{formatMoney(selected.amount * 2)}</p></div>
              <div><p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#747686' }}>SỐ TIỀN RÚT</p><p style={{ fontWeight: 700 }}>{formatMoney(selected.amount)}</p></div>
            </div>
            <div className="wdetail-bank">
              <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#747686', marginBottom: '0.5rem' }}>THÔNG TIN NHẬN TIỀN</p>
              <p style={{ fontWeight: 700 }}>{selected.bankName}</p>
              <p style={{ fontSize: '0.75rem', color: '#747686', fontFamily: 'monospace' }}>STK: {selected.accountNumber}</p>
              {selected.accountName && <p style={{ fontSize: '0.75rem' }}>{selected.accountName}</p>}
            </div>
            {selected.adminNote && <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', fontStyle: 'italic' }}>Ghi chú: {selected.adminNote}</p>}

            <div className="wdetail-actions">
              {selected.status === 'PENDING' && (
                <>
                  <button className="btn-approve" onClick={() => handleApprove(selected.id)}><span className="material-symbols-outlined">check_circle</span> Duyệt yêu cầu</button>
                  <button className="btn-reject" onClick={() => handleReject(selected.id)}><span className="material-symbols-outlined">cancel</span> Từ chối</button>
                </>
              )}
              {selected.status === 'APPROVED' && (
                <button className="btn-transfer" onClick={() => handleTransfer(selected.id)}><span className="material-symbols-outlined">payments</span> Đánh dấu đã chuyển</button>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default WithdrawalsManagement;
