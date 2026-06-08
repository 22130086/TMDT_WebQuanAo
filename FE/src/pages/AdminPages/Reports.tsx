import { useState, useEffect } from 'react';
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

  useEffect(() => {
    http.get('/admin/reports/revenue')
      .then(res => setReport(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatMoney = (n: number) => n?.toLocaleString('vi-VN') + ' ₫';
  const monthLabels: Record<string, string> = {
    '01': 'T1', '02': 'T2', '03': 'T3', '04': 'T4', '05': 'T5', '06': 'T6',
    '07': 'T7', '08': 'T8', '09': 'T9', '10': 'T10', '11': 'T11', '12': 'T12'
  };

  if (loading) return <div className="at-container"><div className="at-loading">Đang tải...</div></div>;
  if (!report) return <div className="at-container"><div className="at-loading">Không có dữ liệu</div></div>;

  const maxRevenue = Math.max(...Object.values(report.monthlyRevenue), 1);

  return (
    <div className="at-container">
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0f172a' }}>
        Báo cáo Doanh thu Sàn
      </h2>

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
          <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>Doanh thu 6 tháng gần nhất</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: 200, paddingTop: '0.5rem' }}>
            {Object.entries(report.monthlyRevenue).map(([key, val]) => {
              const [year, month] = key.split('-');
              const height = maxRevenue > 0 ? (val / maxRevenue) * 160 : 0;
              return (
                <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#0037b0' }}>{formatMoney(val)}</span>
                  <div style={{
                    width: '100%', height: Math.max(height, 4),
                    background: 'linear-gradient(180deg, #0037b0, #3b82f6)',
                    borderRadius: '0.375rem 0.375rem 0 0', transition: 'height 0.3s', minWidth: 30
                  }} />
                  <span style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 600 }}>
                    {monthLabels[month] || month}/{year.slice(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Withdrawals */}
        <div className="at-section">
          <div className="at-header">
            <h3>Giao dịch rút tiền gần đây</h3>
          </div>
          <div className="at-table-wrap">
            <table className="at-table">
              <thead><tr>
                <th>Mã</th><th>Xưởng</th><th className="right">Tiền rút</th><th className="right">Phí sàn</th>
              </tr></thead>
              <tbody>
                {report.recentWithdrawals.length === 0 && <tr><td colSpan={4} className="at-empty">Chưa có giao dịch</td></tr>}
                {report.recentWithdrawals.map(w => (
                  <tr key={w.id}>
                    <td><span className="at-id">#WD-{w.id}</span></td>
                    <td><span className="at-name" style={{ fontSize: '0.8125rem' }}>{w.factoryName}</span></td>
                    <td className="right"><span className="at-money">{formatMoney(w.amount)}</span></td>
                    <td className="right"><span style={{ fontWeight: 700, color: '#16a34a' }}>+{formatMoney(w.commission || 0)}</span></td>
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
          Sàn thu <strong style={{ color: '#16a34a' }}>{report.commissionRate}% phí</strong> trên mỗi giao dịch rút tiền của xưởng.
          Tổng <strong>{report.totalWithdrawals} giao dịch</strong> đã được xử lý, với tổng số tiền xưởng rút là <strong>{formatMoney(report.totalWithdrawn)}</strong>.
          Doanh thu sàn từ phí rút tiền đạt <strong style={{ color: '#0037b0' }}>{formatMoney(report.totalRevenue)}</strong>.
        </p>
      </div>
    </div>
  );
}
