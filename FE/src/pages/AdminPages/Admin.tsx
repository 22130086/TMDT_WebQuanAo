import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import http from "../../services/http";

export default function Admin() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      http.get('/admin/withdrawals/stats').then(r => r?.data?.data).catch(() => ({})),
      http.get('/admin/disputes?size=1000').then(r => r?.data?.data).catch(() => ({})),
      http.get('/admin/users?size=1').then(r => r?.data?.data).catch(() => ({})),
      http.get('/admin/orders?size=1').then(r => r?.data?.data).catch(() => ({})),
      http.get('/admin/quotations?size=1').then(r => r?.data?.data).catch(() => ({})),
      http.get('/admin/outsourcing-posts?size=1').then(r => r?.data?.data).catch(() => ({})),
      http.get('/admin/factories?size=1000').then(r => r?.data?.data).catch(() => ({})),
      http.get('/admin/reports/revenue').then(r => r?.data?.data).catch(() => ({})),
    ]).then(([w, d, u, o, q, p, f, rev]) => {
      setStats({
        withdrawalPending: w?.pending || 0,
        withdrawalTotal: w?.total || 0,
        disputeOpen: d?.content?.filter((x: any) => x.status === 'OPEN').length || 0,
        disputeTotal: d?.totalElements || 0,
        userTotal: u?.totalElements || 0,
        orderTotal: o?.totalElements || 0,
        quotationTotal: q?.totalElements || 0,
        postTotal: p?.totalElements || 0,
        factoryPending: f?.content?.filter((x: any) => x.verifiedStatus === 'PENDING').length || 0,
        factoryTotal: f?.totalElements || 0,
        revenue: rev?.totalRevenue || 0,
        revenueCount: rev?.totalWithdrawals || 0,
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const formatMoney = (n: number) => n?.toLocaleString('vi-VN') + ' ₫';
  const urgency = (stats.withdrawalPending || 0) + (stats.disputeOpen || 0) + (stats.factoryPending || 0);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Đang tải...</div>;

  const cards = [
    { to: '/admin/withdrawals', icon: 'payments', label: 'Rút tiền', count: stats.withdrawalPending, sub: `${stats.withdrawalTotal} tổng`, color: '#16a34a', bg: '#f0fdf4' },
    { to: '/admin/disputes', icon: 'gavel', label: 'Tranh chấp', count: stats.disputeOpen, sub: `${stats.disputeTotal} tổng`, color: '#ea580c', bg: '#fff7ed' },
    { to: '/admin/factories', icon: 'factory', label: 'Duyệt xưởng', count: stats.factoryPending, sub: `${stats.factoryTotal} tổng`, color: '#8b5cf6', bg: '#f5f3ff' },
    { to: '/admin/complaints', icon: 'report_problem', label: 'Khiếu nại', count: null, sub: 'xem chi tiết', color: '#2563eb', bg: '#eff6ff' },
    { to: '/admin/orders', icon: 'shopping_cart', label: 'Đơn hàng', count: stats.orderTotal, sub: 'toàn hệ thống', color: '#f59e0b', bg: '#fffbeb' },
    { to: '/admin/users', icon: 'group', label: 'Người dùng', count: stats.userTotal, sub: 'tài khoản', color: '#6b7280', bg: '#f3f4f6' },
    { to: '/admin/quotations', icon: 'request_quote', label: 'Báo giá', count: stats.quotationTotal, sub: 'tất cả', color: '#0891b2', bg: '#ecfeff' },
    { to: '/admin/posts', icon: 'post_add', label: 'Bài đăng', count: stats.postTotal, sub: 'tìm xưởng', color: '#d946ef', bg: '#fdf4ff' },
    { to: '/admin/products', icon: 'inventory_2', label: 'Sản phẩm', count: null, sub: 'quản lý', color: '#ca8a04', bg: '#fefce8' },
    { to: '/admin/reports', icon: 'analytics', label: 'Báo cáo', count: null, sub: 'doanh thu', color: '#ef4444', bg: '#fef2f2' },
  ];

  return (
    <div>
      {/* Top Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <div className="stat-card">
          <p>DOANH THU SÀN</p>
          <h3 style={{ color: '#16a34a' }}>{formatMoney(stats.revenue)}</h3>
          <span>{stats.revenueCount} giao dịch</span>
        </div>
        <div className="stat-card">
          <p>ĐƠN HÀNG</p>
          <h3>{stats.orderTotal}</h3>
          <span>toàn hệ thống</span>
        </div>
        <div className="stat-card">
          <p>NGƯỜI DÙNG</p>
          <h3>{stats.userTotal}</h3>
          <span>tài khoản</span>
        </div>
        <div className="stat-card">
          <p>CẦN XỬ LÝ</p>
          <h3 style={{ color: urgency > 0 ? '#dc2626' : '#16a34a' }}>{urgency}</h3>
          <span>Rút tiền + Tranh chấp + Duyệt xưởng</span>
        </div>
      </div>

      {/* Module Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', margin: '1.25rem 0' }}>
        {cards.map(c => (
          <Link key={c.to} to={c.to} style={{
            textDecoration: 'none', background: c.bg, padding: '1rem',
            borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
            transition: 'transform 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = ''}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.75rem', color: c.color }}>{c.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{c.label}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                {c.count !== null ? <><strong style={{ color: c.color, fontSize: '1rem' }}>{c.count}</strong> · </> : ''}
                {c.sub}
              </div>
            </div>
            <span className="material-symbols-outlined" style={{ color: '#94a3b8', fontSize: '1rem' }}>chevron_right</span>
          </Link>
        ))}
      </div>

      {/* Bottom: urgency breakdown */}
      <div className="at-section" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.75rem', color: '#0f172a' }}>📋 Cần xử lý ngay</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: 'Yêu cầu rút tiền chờ duyệt', count: stats.withdrawalPending, to: '/admin/withdrawals' },
            { label: 'Tranh chấp đang mở', count: stats.disputeOpen, to: '/admin/disputes' },
            { label: 'Xưởng chờ duyệt hồ sơ', count: stats.factoryPending, to: '/admin/factories' },
            { label: 'Báo giá trong hệ thống', count: stats.quotationTotal, to: '/admin/quotations' },
            { label: 'Bài đăng tìm xưởng', count: stats.postTotal, to: '/admin/posts' },
          ].map(item => (
            <Link key={item.label} to={item.to} style={{
              textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '0.5rem',
            }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{item.label}</span>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: item.count > 0 ? '#dc2626' : '#16a34a' }}>{item.count}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}