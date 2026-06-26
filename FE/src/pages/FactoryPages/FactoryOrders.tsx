import { useState, useEffect } from "react";
import http from "../../services/http";
import "../../styles/admin-table.css";
import "../../styles/custom-order.css";

interface OrderData {
  id: number; orderType: string; totalAmount: number; finalAmount: number;
  depositAmount: number; status: string; paymentStatus: string;
  customerName?: string; factoryName?: string; customerEmail?: string;
  receiverName?: string; receiverPhone?: string; shippingAddress?: string;
  note?: string; designFileUrl?: string; designFileUrlBack?: string;
  items?: { id: number; productName?: string; quantity: number; unitPrice: number }[];
  createdAt?: string; updatedAt?: string;
}

const BASE_IMG = "http://localhost:8080";
const STATUS_OPTIONS = [
  { v: "CONFIRMED", t: "Xác nhận", icon: "thumb_up" },
  { v: "IN_PRODUCTION", t: "Đang sản xuất", icon: "precision_manufacturing" },
  { v: "READY_TO_SHIP", t: "Chờ giao", icon: "inventory_2" },
  { v: "SHIPPING", t: "Đang giao", icon: "local_shipping" },
  { v: "DELIVERED", t: "Đã giao", icon: "package_2" },
  { v: "COMPLETED", t: "Hoàn thành", icon: "check_circle" },
];

const STATUS_LABEL: Record<string, string> = {
  PENDING: "⏳ Chờ", CONFIRMED: "✅ Đã XN",
  IN_PRODUCTION: "🔧 Đang SX", READY_TO_SHIP: "📦 Chờ giao",
  SHIPPING: "🚚 Đang giao", DELIVERED: "📬 Đã giao",
  COMPLETED: "🎉 Xong", CANCELLED: "❌ Hủy"
};

export default function FactoryOrders() {
  const [tab, setTab] = useState<"ready" | "outsourcing">("outsourcing");
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<OrderData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchOrders = () => {
    setLoading(true);
    const url = tab === "ready" ? "/factory/orders/ready-made" : "/factory/orders/outsourcing";
    http.get(url + "?size=50")
      .then(r => setOrders(r.data?.data?.content ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [tab]);

  const viewDetail = async (orderId: number) => {
    setDetailLoading(true);
    try {
      const r = await http.get(`/orders/${orderId}`);
      setSelected(r.data?.data || r.data);
    } catch { setSelected(null); }
    finally { setDetailLoading(false); }
  };

  const updateStatus = async (orderId: number, newStatus: string) => {
    await http.patch(`/factory/orders/${orderId}/status?status=${newStatus}`);
    fetchOrders();
    viewDetail(orderId);
  };

  const confirmOrder = async (orderId: number) => {
    await http.patch(`/factory/orders/${orderId}/confirm`);
    fetchOrders();
    viewDetail(orderId);
  };

  const deleteOrder = async (orderId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đơn hàng này không? (Số lượng tồn kho sẽ được hoàn lại)")) return;
    try {
      await http.delete(`/factory/orders/${orderId}`);
      alert("Đã xóa đơn hàng");
      fetchOrders();
      if (selected?.id === orderId) setSelected(null);
    } catch (e: any) {
      alert(e.response?.data?.message || "Không thể xóa đơn hàng");
    }
  };

  const formatVND = (n: number) => n?.toLocaleString("vi-VN") + "đ";
  const formatDate = (d?: string) => d ? new Date(d).toLocaleString("vi-VN") : "—";

  return (
    <div className="at-container">
      <div className={`at-main ${selected ? "has-detail" : ""}`}>
        <div style={{ flex: 1 }}>
          <h2 style={{ marginBottom: 16 }}>📦 Đơn hàng của xưởng</h2>

          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <button className={`mode-btn ${tab === "outsourcing" ? "mode-active" : ""}`}
              onClick={() => { setTab("outsourcing"); setSelected(null); }}>Đơn gia công</button>
            <button className={`mode-btn ${tab === "ready" ? "mode-active" : ""}`}
              onClick={() => { setTab("ready"); setSelected(null); }}>Đơn mẫu sẵn</button>
          </div>

          {loading && <div style={{ textAlign: "center", padding: 40 }}>Đang tải...</div>}

          <table className="at-table">
            <thead><tr>
              <th>Mã</th><th>Khách</th><th>Tổng</th><th>Trạng thái</th><th>Thanh toán</th><th>Ngày</th><th></th>
            </tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="clickable" onClick={() => viewDetail(o.id)}
                  style={{ background: selected?.id === o.id ? "#eff6ff" : undefined, cursor: "pointer" }}>
                  <td><strong>#DH-{o.id}</strong></td>
                  <td>{o.customerName || "N/A"}</td>
                  <td>{formatVND(o.finalAmount)}</td>
                  <td><span className={`at-badge ${o.status === "PENDING" ? "warning" : o.status === "COMPLETED" ? "success" : "info"}`}>
                    {STATUS_LABEL[o.status] || o.status}</span></td>
                  <td><span style={{ color: o.paymentStatus === "DEPOSIT_PAID" ? "#f59e0b" : "#10b981", fontWeight: 700 }}>
                    {o.paymentStatus === "DEPOSIT_PAID" ? "Đã cọc" : o.paymentStatus === "FULLY_PAID" ? "Đã TT" : "Chưa TT"}</span></td>
                  <td style={{ fontSize: 13, color: "#6b7280" }}>{formatDate(o.createdAt)}</td>
                  <td>
                    {o.status === "PENDING" && (
                      <button className="at-btn info" onClick={e => { e.stopPropagation(); confirmOrder(o.id); }}
                        style={{ fontSize: 12, padding: "4px 10px" }}>✓ Xác nhận</button>
                    )}
                    {o.status === "PENDING" && o.paymentStatus === "UNPAID" && (
                      <button className="at-btn" onClick={e => { e.stopPropagation(); deleteOrder(o.id); }}
                        style={{ fontSize: 12, padding: "4px 10px", background: "#ef4444", color: "white", border: "none", borderRadius: "6px", marginLeft: "6px" }}>Xóa</button>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && !loading && <tr><td colSpan={7} style={{ textAlign: "center", padding: 40 }}>Không có đơn</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <aside className="at-detail" style={{ width: 400, overflow: "auto" }}>
          {detailLoading ? <div style={{ padding: 20 }}>Đang tải...</div> : (
            <>
              <div className="at-detail-header">
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#0037b0", textTransform: "uppercase" }}>Chi tiết đơn hàng</span>
                  <h4>#DH-{selected.id}</h4>
                </div>
                <span className="at-badge" style={{ fontSize: 13 }}>{STATUS_LABEL[selected.status] || selected.status}</span>
              </div>

              <div className="at-detail-row"><span>Loại</span><strong>{selected.orderType === "OUTSOURCING" ? "Đơn gia công" : "Mẫu sẵn"}</strong></div>
              <div className="at-detail-row"><span>Khách</span><strong>{selected.customerName || "N/A"}</strong></div>
              <div className="at-detail-row"><span>Email</span><strong>{selected.customerEmail || "N/A"}</strong></div>
              <div className="at-detail-row"><span>Tổng tiền</span><strong style={{ fontSize: 18, color: "#2563eb" }}>{formatVND(selected.finalAmount)}</strong></div>
              {selected.depositAmount > 0 && (
                <>
                  <div className="at-detail-row"><span>Đã cọc</span><strong style={{ color: "#f59e0b" }}>{formatVND(selected.depositAmount)}</strong></div>
                  <div className="at-detail-row"><span>Còn lại</span><strong style={{ color: "#d97706" }}>{formatVND((selected.finalAmount || 0) - (selected.depositAmount || 0))}</strong></div>
                </>
              )}
              <div className="at-detail-row">
                <span>Thanh toán</span>
                <span style={{ color: selected.paymentStatus === "DEPOSIT_PAID" ? "#f59e0b" : "#10b981", fontWeight: 700 }}>
                  {selected.paymentStatus === "DEPOSIT_PAID" ? "Đã đặt cọc" : selected.paymentStatus === "FULLY_PAID" ? "Đã thanh toán" : "Chưa TT"}</span>
              </div>
              <div className="at-detail-row"><span>Ngày tạo</span><strong>{formatDate(selected.createdAt)}</strong></div>

              {(selected.designFileUrl || selected.designFileUrlBack) && (
                <div style={{ padding: "12px 20px" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Ảnh thiết kế</span>
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    {selected.designFileUrl && (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Mặt trước</div>
                        <img src={BASE_IMG + selected.designFileUrl} alt="front"
                          style={{ width: 130, height: 150, objectFit: "contain", borderRadius: 10, border: "1px solid #e5e7eb", background: "#f9fafb" }} />
                      </div>
                    )}
                    {selected.designFileUrlBack && (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Mặt sau</div>
                        <img src={BASE_IMG + selected.designFileUrlBack} alt="back"
                          style={{ width: 130, height: 150, objectFit: "contain", borderRadius: 10, border: "1px solid #e5e7eb", background: "#f9fafb" }} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selected.receiverName && (
                <>
                  <div className="at-detail-row"><span>Người nhận</span><strong>{selected.receiverName}</strong></div>
                  <div className="at-detail-row"><span>SĐT</span><strong>{selected.receiverPhone}</strong></div>
                  <div className="at-detail-row"><span>Địa chỉ</span><strong style={{ fontSize: 13 }}>{selected.shippingAddress}</strong></div>
                </>
              )}
              {selected.note && (
                <div className="at-detail-row" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                  <span>Ghi chú</span>
                  <strong style={{ fontSize: 13, marginTop: 4, whiteSpace: "pre-wrap" }}>{selected.note}</strong>
                </div>
              )}

              {selected.items && selected.items.length > 0 && (
                <div style={{ padding: "12px 20px" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Sản phẩm ({selected.items.length})</span>
                  {selected.items.map((it, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
                      <span>{it.productName || `SP #${it.id}`} ×{it.quantity}</span>
                      <strong>{formatVND(it.unitPrice * it.quantity)}</strong>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ padding: "16px 20px" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 8 }}>Cập nhật trạng thái</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {STATUS_OPTIONS.map(s => (
                    <button key={s.v} onClick={() => updateStatus(selected.id, s.v)}
                      style={{
                        padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 10,
                        background: selected.status === s.v ? "#2563eb" : "#fff",
                        color: selected.status === s.v ? "#fff" : "#374151",
                        cursor: "pointer", fontSize: 12, fontWeight: 600,
                        display: "flex", alignItems: "center", gap: 4
                      }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{s.icon}</span>
                      {s.t}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </aside>
      )}
    </div>
  );
}
