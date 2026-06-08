import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import WithdrawalService from '../../services/withdrawalService';
import type { Withdrawal, WithdrawalStats } from '../../services/withdrawalService';
import '../../styles/admin-table.css';

const statusLabels: Record<string, string> = {
  PENDING: 'Đang chờ', APPROVED: 'Đã duyệt', TRANSFERRED: 'Đã chuyển', REJECTED: 'Từ chối'
};

const WithdrawalsManagement: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState<WithdrawalStats>({ total: 0, pending: 0, approved: 0, transferred: 0, rejected: 0 });
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selected, setSelected] = useState<Withdrawal | null>(null);
  const [loading, setLoading] = useState(false);

  const pageSize = 10;

  const fetchData = useCallback(async (p: number, f: string, fd: string, td: string) => {
    setLoading(true);
    try {
      const d = await WithdrawalService.getAll(f || undefined, fd || undefined, td || undefined, p, pageSize);
      if (d?.content) { setData(d.content); setTotalPages(d.totalPages || 1); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchStats = useCallback(() => {
    WithdrawalService.getStats().then(s => { if (s) setStats(s); }).catch(console.error);
  }, []);

  useEffect(() => { fetchData(page, filter, fromDate, toDate); }, [page, filter, fromDate, toDate, fetchData]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const formatMoney = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

  const filteredData = search
    ? data.filter(d =>
        (d.factoryName || d.factoryUserName || '').toLowerCase().includes(search.toLowerCase()) ||
        String(d.id).includes(search) ||
        (d.bankName || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.accountNumber || '').includes(search)
      )
    : data;

  const handleApprove = async (id: number) => {
    await WithdrawalService.approve(id);
    fetchData(page, filter, fromDate, toDate);
    fetchStats();
  };
  const handleReject = async (id: number) => {
    const note = prompt('Lý do từ chối:');
    if (!note) return;
    await WithdrawalService.reject(id, note);
    fetchData(page, filter, fromDate, toDate);
    fetchStats();
  };

  // Navigate to VNPay transfer page
  const openTransferPage = (item: Withdrawal) => {
    navigate(`/admin/withdrawals/${item.id}/transfer`);
  };

  const clearDateFilter = () => {
    setFromDate('');
    setToDate('');
    setPage(0);
  };

  return (
    <div className="at-container">
      {loading && <div className="at-loading">Đang tải...</div>}

      {/* Stats */}
      <div className="at-stats">
        <div className="at-stat primary"><p className="label">Tổng yêu cầu</p><h3 className="number">{stats.total}</h3></div>
        <div className="at-stat warning"><p className="label">Đang chờ</p><h3 className="number">{stats.pending}</h3></div>
        <div className="at-stat info"><p className="label">Đã duyệt</p><h3 className="number">{stats.approved}</h3></div>
        <div className="at-stat success"><p className="label">Đã chuyển</p><h3 className="number">{stats.transferred}</h3></div>
      </div>

      <div className={`at-main ${selected ? 'has-detail' : ''}`}>
        {/* Table */}
        <section className="at-section">
          <div className="at-header">
            <h3>Danh sách yêu cầu rút tiền</h3>
            <div className="at-toolbar">
              <div className="at-search">
                <span className="material-symbols-outlined">search</span>
                <input placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="at-select" value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }}>
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">Đang chờ</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="TRANSFERRED">Đã chuyển</option>
                <option value="REJECTED">Từ chối</option>
              </select>
              <div className="at-date-filter">
                <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(0); }} title="Từ ngày" />
                <span className="sep">→</span>
                <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(0); }} title="Đến ngày" />
                {(fromDate || toDate) && (
                  <button className="at-date-clear" onClick={clearDateFilter} title="Xóa lọc ngày">
                    <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>close</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="at-table-wrap">
            <table className="at-table">
              <thead><tr><th>Mã yêu cầu</th><th>Tên xưởng</th><th className="right">Số tiền</th><th>Ngân hàng</th><th>Ngày</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
              <tbody>
                {filteredData.length === 0 && !loading && <tr><td colSpan={7} className="at-empty">Không có yêu cầu nào</td></tr>}
                {filteredData.map(d => (
                  <tr key={d.id} onClick={() => setSelected(d)} className="clickable">
                    <td><span className="at-id">#WD-{d.id}</span></td>
                    <td><span className="at-name">{d.factoryName || d.factoryUserName || `User #${d.factoryUserId}`}</span></td>
                    <td className="right"><span className="at-money">{formatMoney(d.amount)}</span></td>
                    <td>
                      <div className="at-name" style={{ fontSize: '0.8125rem' }}>{d.bankName}</div>
                      <div className="at-sub" style={{ fontFamily: 'monospace' }}>{d.accountNumber}</div>
                    </td>
                    <td className="at-date">{d.createdAt ? new Date(d.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                    <td><span className={`at-badge ${d.status === 'PENDING' ? 'warning' : d.status === 'APPROVED' ? 'info' : d.status === 'TRANSFERRED' ? 'success' : 'danger'}`}>{statusLabels[d.status]}</span></td>
                    <td>
                      <div className="at-actions">
                        {d.status === 'PENDING' && (
                          <>
                            <button className="at-btn success icon-only" title="Duyệt" onClick={e => { e.stopPropagation(); handleApprove(d.id); }}><span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>check</span></button>
                            <button className="at-btn danger icon-only" title="Từ chối" onClick={e => { e.stopPropagation(); handleReject(d.id); }}><span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span></button>
                          </>
                        )}
                        {d.status === 'APPROVED' && (
                          <button className="at-btn info" title="Chuyển tiền qua VNPay" onClick={e => { e.stopPropagation(); openTransferPage(d); }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>payments</span> VNPay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="at-pagination">
            <span className="info">Hiển thị {data.length} / {stats.total}</span>
            <div className="ctrls">
              <button className="at-page-btn" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}><span className="material-symbols-outlined">chevron_left</span></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                <button key={i} className={`at-page-num ${i === page ? 'active' : ''}`} onClick={() => setPage(i)}>{i + 1}</button>
              ))}
              <button className="at-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}><span className="material-symbols-outlined">chevron_right</span></button>
            </div>
          </div>
        </section>

        {/* Detail Panel */}
        {selected && (
          <aside className="at-detail">
            <div className="at-detail-header">
              <div>
                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#0037b0', textTransform: 'uppercase' }}>Chi tiết yêu cầu</span>
                <h4>{selected.factoryName || selected.factoryUserName || `#${selected.factoryUserId}`}</h4>
              </div>
              <span className="material-symbols-outlined" style={{ color: '#0037b0', fontSize: '2rem' }}>factory</span>
            </div>
            <div className="at-detail-row"><span>Mã yêu cầu</span><strong>#WD-{selected.id}</strong></div>
            <div className="at-detail-row"><span>Số tiền rút</span><strong>{formatMoney(selected.amount)}</strong></div>
            <div className="at-detail-row"><span>Phí sàn (5%)</span><strong style={{ color: '#dc2626' }}>-{formatMoney(selected.amount * 0.05)}</strong></div>
            <div className="at-detail-row"><span>Thực nhận</span><strong style={{ color: '#16a34a' }}>{formatMoney(selected.amount * 0.95)}</strong></div>
            <div className="at-detail-row"><span>Ngân hàng</span><strong>{selected.bankName}</strong></div>
            <div className="at-detail-row"><span>Số tài khoản</span><strong style={{ fontFamily: 'monospace' }}>{selected.accountNumber}</strong></div>
            {selected.accountName && <div className="at-detail-row"><span>Chủ TK</span><strong>{selected.accountName}</strong></div>}
            <div className="at-detail-row"><span>Trạng thái</span><span className={`at-badge ${selected.status === 'PENDING' ? 'warning' : selected.status === 'APPROVED' ? 'info' : selected.status === 'TRANSFERRED' ? 'success' : 'danger'}`}>{statusLabels[selected.status]}</span></div>
            <div className="at-detail-row"><span>Ngày tạo</span><strong>{selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : '-'}</strong></div>
            {selected.adminNote && <div className="at-detail-row"><span>Ghi chú</span><strong style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>{selected.adminNote}</strong></div>}

            <div className="at-detail-actions">
              {selected.status === 'PENDING' && (
                <>
                  <button className="at-btn success" onClick={() => handleApprove(selected.id)}><span className="material-symbols-outlined">check_circle</span> Duyệt yêu cầu</button>
                  <button className="at-btn danger" onClick={() => handleReject(selected.id)}><span className="material-symbols-outlined">cancel</span> Từ chối</button>
                </>
              )}
              {selected.status === 'APPROVED' && (
                <button className="at-btn primary" onClick={() => openTransferPage(selected)}><span className="material-symbols-outlined">payments</span> Chuyển tiền qua VNPay</button>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default WithdrawalsManagement;
