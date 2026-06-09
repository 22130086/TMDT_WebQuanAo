import { useState, useEffect, useCallback } from 'react';
import http from '../../services/http';
import '../../styles/admin-table.css';

interface RevenueReport {
  totalRevenue: number;
  totalWithdrawals: number;
  totalWithdrawn: number;
  commissionRate: number;
  monthlyRevenue: Record<string, number>;
  recentWithdrawals: Array<{
    id: number;
    factoryName: string;
    amount: number;
    commission: number;
    handledAt: string;
  }>;
}

export default function Reports() {
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');

  const fetchReport = useCallback(async (fd?: string, td?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (fd) params.startDate = fd;
      if (td) params.endDate = td;
      const res = await http.get('/admin/reports/revenue', { params });
      setReport(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchReport(fromDate, toDate); }, [fromDate, toDate, fetchReport]);

  const formatMoney = (n: number) => n?.toLocaleString('vi-VN') + ' ₫';
  const monthLabels: Record<string, string> = {
    '01': 'T1', '02': 'T2', '03': 'T3', '04': 'T4', '05': 'T5', '06': 'T6',
    '07': 'T7', '08': 'T8', '09': 'T9', '10': 'T10', '11': 'T11', '12': 'T12'
  };

  const clearDate = () => { setFromDate(''); setToDate(''); };

  if (loading) return <div className="at-container"><div className="at-loading">Đang tải...</div></div>;
  if (!report) return <div className="at-container"><div className="at-loading">Không có dữ liệu</div></div>;

  const maxRevenue = Math.max(...Object.values(report.monthlyRevenue), 1);

  const filteredWithdrawals = search
    ? report.recentWithdrawals.filter(w =>
        (w.factoryName || '').toLowerCase().includes(search.toLowerCase()) ||
        String(w.id).includes(search)
      )
    : report.recentWithdrawals;

  const monthEntries = Object.entries(report.monthlyRevenue);
  const hasData = monthEntries.some(([, v]) => v > 0) || report.totalWithdrawals > 0;

  return (
    <div className="at-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
          Báo cáo Doanh thu Sàn
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="at-date-filter">
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} title="Từ ngày" />
            <span className="sep">→</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} title="Đến ngày" />
            {(fromDate || toDate) && (
              <button className="at-date-clear" onClick={clearDate} title="Xóa lọc">
                <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>close</span>
              </button>
            )}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {fromDate || toDate ? `Từ ${fromDate || '...'} → ${toDate || '...'}` : 'Tất cả thời gian'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="at-stats">
        <div className="at-stat success">
          <p className="label">Tổng doanh thu sàn</p>
          <h3 className="number">{formatMoney(report.totalRevenue)}</h3>
        </div>
        <div className="at-stat primary">
          <p className="label">Tổng tiền xưởng đã rút</p>
          <h3 className="number">{formatMoney(report.totalWithdrawn)}</h3>
        </div>
        <div className="at-stat info">
          <p className="label">Số giao dịch đã chuyển</p>
          <h3 className="number">{report.totalWithdrawals}</h3>
        </div>
        <div className="at-stat warning">
          <p className="label">Phí sàn hiện tại</p>
          <h3 className="number">{report.commissionRate}%</h3>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Revenue Chart */}
        <div className="at-section" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>
            Doanh thu theo tháng {monthEntries.length > 6 ? `(${monthEntries.length} tháng)` : ''}
          </h3>
          {hasData ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: monthEntries.length > 8 ? '0.25rem' : '0.75rem', height: 200, paddingTop: '0.5rem', overflowX: 'auto' }}>
              {monthEntries.map(([key, val]) => {
                const [, month] = key.split('-');
                const height = maxRevenue > 0 ? (val / maxRevenue) * 160 : 0;
                return (
                  <div key={key} style={{ flex: '0 0 auto', minWidth: monthEntries.length > 8 ? 36 : 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                    {val > 0 && <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#0037b0' }}>{formatMoney(val)}</span>}
                    <div style={{
                      width: '100%', height: Math.max(height, 4),
                      background: val > 0 ? 'linear-gradient(180deg, #0037b0, #3b82f6)' : '#e2e8f0',
                      borderRadius: '0.375rem 0.375rem 0 0', transition: 'height 0.3s',
                    }} />
                    <span style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 600 }}>
                      {monthLabels[month] || month}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
              Chưa có dữ liệu trong khoảng thời gian này
            </div>
          )}
        </div>

        {/* Recent Withdrawals */}
        <div className="at-section">
          <div className="at-header">
            <h3>Giao dịch rút tiền ({filteredWithdrawals.length})</h3>
            <div className="at-search" style={{ maxWidth: 200 }}>
              <span className="material-symbols-outlined">search</span>
              <input placeholder="Tìm xưởng..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="at-table-wrap">
            <table className="at-table">
              <thead><tr>
                <th>Mã</th><th>Xưởng</th><th className="right">Tiền rút</th><th className="right">Phí sàn</th><th>Ngày</th>
              </tr></thead>
              <tbody>
                {filteredWithdrawals.length === 0 && <tr><td colSpan={5} className="at-empty">Chưa có giao dịch</td></tr>}
                {filteredWithdrawals.map(w => (
                  <tr key={w.id}>
                    <td><span className="at-id">#WD-{w.id}</span></td>
                    <td><span className="at-name" style={{ fontSize: '0.8125rem' }}>{w.factoryName}</span></td>
                    <td className="right"><span className="at-money">{formatMoney(w.amount)}</span></td>
                    <td className="right"><span style={{ fontWeight: 700, color: '#16a34a' }}>+{formatMoney(w.commission || 0)}</span></td>
                    <td className="at-date">{w.handledAt ? new Date(w.handledAt).toLocaleDateString('vi-VN') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="at-section" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem' }}>Tóm tắt</h3>
        <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
          {fromDate || toDate ? (
            <>Trong khoảng <strong>{fromDate || '...'} → {toDate || '...'}</strong>, </>
          ) : 'Tất cả thời gian, '}
          sàn thu <strong style={{ color: '#16a34a' }}>{report.commissionRate}% phí</strong> trên mỗi giao dịch rút tiền của xưởng.
          Tổng <strong>{report.totalWithdrawals} giao dịch</strong> đã được xử lý, với tổng số tiền xưởng rút là <strong>{formatMoney(report.totalWithdrawn)}</strong>.
          Doanh thu sàn từ phí rút tiền đạt <strong style={{ color: '#0037b0' }}>{formatMoney(report.totalRevenue)}</strong>.
        </p>
      </div>
    </div>
  );
}
