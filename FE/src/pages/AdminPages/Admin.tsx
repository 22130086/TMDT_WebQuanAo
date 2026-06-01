import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ComplaintService from "../../services/complaintService";
import DisputeService from "../../services/disputeService";
import WithdrawalService from "../../services/withdrawalService";
import type { ComplaintStats } from "../../services/complaintService";
import type { DisputeStats } from "../../services/disputeService";
import AdminProductService from "../../services/adminProductService";
import type { ProductItem } from "../../services/adminProductService";

export default function Admin() {
  const [complaintStats, setComplaintStats] = useState<ComplaintStats>({ totalComplaints: 0, openComplaints: 0, processingComplaints: 0, resolvedComplaints: 0, closedComplaints: 0 });
  const [disputeStats, setDisputeStats] = useState<DisputeStats>({ total: 0, open: 0, infoRequested: 0, verdictGiven: 0, closed: 0 });
  const [withdrawalStats, setWithdrawalStats] = useState<WithdrawalStats>({ total: 0, pending: 0, approved: 0, transferred: 0, rejected: 0 });
  const [pendingProducts, setPendingProducts] = useState(0);
  const [recentDisputes, setRecentDisputes] = useState<any[]>([]);

  useEffect(() => {
    ComplaintService.getComplaintStats().then(d => { if (d) setComplaintStats(d); }).catch(() => {});
    DisputeService.getStats().then(d => { if (d) setDisputeStats(d); }).catch(() => {});
    WithdrawalService.getStats().then(d => { if (d) setWithdrawalStats(d); }).catch(() => {});
    DisputeService.getAll(undefined, 0, 3).then(d => { if (d?.content) setRecentDisputes(d.content); }).catch(() => {});
    AdminProductService.getPending(0, 1).then(d => { if (d?.totalElements !== undefined) setPendingProducts(d.totalElements); }).catch(() => {});
  }, []);

  const totalPending = complaintStats.openComplaints + disputeStats.open + withdrawalStats.pending;

  return (
    <>
      <section className="stats-grid">
        <div className="stat-card">
          <p>TỔNG KHIẾU NẠI</p>
          <h3>{complaintStats.totalComplaints}</h3>
          <span>{complaintStats.openComplaints} đang chờ xử lý</span>
        </div>
        <div className="stat-card">
          <p>TRANH CHẤP</p>
          <h3>{disputeStats.total}</h3>
          <span>{disputeStats.open} đang mở</span>
        </div>
        <div className="stat-card">
          <p>YÊU CẦU RÚT TIỀN</p>
          <h3>{withdrawalStats.total}</h3>
          <span>{withdrawalStats.pending} đang chờ duyệt</span>
        </div>
        <div className="stat-card">
          <p>CẦN XỬ LÝ GẤP</p>
          <h3 style={{ color: '#dc2626' }}>{totalPending}</h3>
          <span>Khiếu nại + Tranh chấp + Rút tiền</span>
        </div>
        <div className="stat-card">
          <p>SẢN PHẨM CHỜ DUYỆT</p>
          <h3 style={{ color: '#f97316' }}>{pendingProducts}</h3>
          <span>Cần phê duyệt</span>
        </div>
      </section>

      <div className="content-grid">
        <section className="table-section">
          <div className="table-header">
            <div>
              <h3>Tổng quan hệ thống</h3>
              <p>Trạng thái các phân hệ quản lý</p>
            </div>
          </div>
          <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
            <Link to="/admin/complaints" style={{ textDecoration: 'none', background: '#eff6ff', padding: '1.5rem', borderRadius: '0.75rem', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#2563eb' }}>report_problem</span>
              <h4 style={{ marginTop: '0.5rem', color: '#1e40af' }}>Khiếu nại</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb' }}>{complaintStats.totalComplaints}</p>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{complaintStats.openComplaints} mở · {complaintStats.resolvedComplaints} đã giải quyết</p>
            </Link>
            <Link to="/admin/disputes" style={{ textDecoration: 'none', background: '#fff7ed', padding: '1.5rem', borderRadius: '0.75rem', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#ea580c' }}>gavel</span>
              <h4 style={{ marginTop: '0.5rem', color: '#9a3412' }}>Tranh chấp</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ea580c' }}>{disputeStats.total}</p>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{disputeStats.open} mở · {disputeStats.verdictGiven} đã xử</p>
            </Link>
            <Link to="/admin/products" style={{ textDecoration: 'none', background: '#fefce8', padding: '1.5rem', borderRadius: '0.75rem', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#ca8a04' }}>inventory_2</span>
              <h4 style={{ marginTop: '0.5rem', color: '#a16207' }}>Sản phẩm</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ca8a04' }}>{pendingProducts}</p>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>đang chờ duyệt</p>
            </Link>
          </div>
          <div style={{ padding: '0 1.5rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
            <Link to="/admin/withdrawals" style={{ textDecoration: 'none', background: '#f0fdf4', padding: '1.5rem', borderRadius: '0.75rem', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#16a34a' }}>payments</span>
              <h4 style={{ marginTop: '0.5rem', color: '#15803d' }}>Rút tiền</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a' }}>{withdrawalStats.total}</p>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{withdrawalStats.pending} chờ · {withdrawalStats.transferred} đã chuyển</p>
            </Link>
            <Link to="/admin/users" style={{ textDecoration: 'none', background: '#f3f4f6', padding: '1.5rem', borderRadius: '0.75rem', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#6b7280' }}>group</span>
              <h4 style={{ marginTop: '0.5rem', color: '#374151' }}>Người dùng</h4>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>Quản lý tài khoản</p>
            </Link>
            <Link to="/admin/factories" style={{ textDecoration: 'none', background: '#eff6ff', padding: '1.5rem', borderRadius: '0.75rem', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#3b82f6' }}>factory</span>
              <h4 style={{ marginTop: '0.5rem', color: '#1e40af' }}>Duyệt xưởng</h4>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>Phê duyệt hồ sơ</p>
            </Link>
          </div>
        </section>

        <aside className="right-panel">
          <div className="report-card">
            <h3>Hoạt động gần đây</h3>
            {recentDisputes.length > 0 ? recentDisputes.map((d: any, i: number) => (
              <div key={i} className="report-item">
                <div>
                  <h4>#DISP-{d.id}</h4>
                  <p>{d.description?.substring(0, 60)}...</p>
                </div>
                <span className={d.status === 'OPEN' ? 'warning' : ''}>{d.status === 'OPEN' ? 'MỚI' : d.status}</span>
              </div>
            )) : (
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', padding: '1rem 0' }}>Chưa có hoạt động nào</p>
            )}
          </div>
          <div className="assistant-card">
            <h3>Thao tác nhanh</h3>
            <Link to="/admin/complaints" className="action-btn" style={{ display: 'block', textAlign: 'center', padding: '0.75rem', marginTop: '0.75rem', background: '#0037b0', color: '#fff', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 700 }}>
              Xem khiếu nại
            </Link>
            <Link to="/admin/disputes" className="action-btn" style={{ display: 'block', textAlign: 'center', padding: '0.75rem', marginTop: '0.5rem', background: '#ea580c', color: '#fff', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 700 }}>
              Xem tranh chấp
            </Link>
            <Link to="/admin/withdrawals" className="action-btn" style={{ display: 'block', textAlign: 'center', padding: '0.75rem', marginTop: '0.5rem', background: '#16a34a', color: '#fff', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 700 }}>
              Duyệt rút tiền
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}