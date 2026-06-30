import React, { useState, useEffect } from "react";
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

  // SỬA LẠI LOGIC XUẤT HÓA ĐƠN TRONG CỬA SỔ MỚI
  const handlePrint = () => {
    if (!selected) return;
    const content = document.getElementById("invoice-content-" + selected.id)?.innerHTML;
    if (!content) return;
    const printWindow = window.open('', '_blank', 'height=800,width=800');
    if (!printWindow) return;
    printWindow.document.write('<html><head><title>In Hóa Đơn #DH-' + selected.id + '</title>');
    printWindow.document.write(`
      <style>
        /* Ép nội dung in luôn nằm giữa và thu nhỏ lại 500px giống như khi xem trên web */
        @page { margin: 0; }
        body { 
          font-family: system-ui, -apple-system, sans-serif; 
          color: #111827; 
          margin: 0; 
          padding: 20px; 
          display: flex; 
          justify-content: center; 
        }
        .print-wrapper { width: 500px; max-width: 100%; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; table-layout: fixed; } 
        th, td { word-wrap: break-word; }
        th { text-align: left; padding: 10px 0; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; text-transform: uppercase; } 
        td { padding: 12px 0; border-bottom: 1px dashed #f3f4f6; } 
        
        /* Ẩn các nút bấm và tiêu đề "Chi tiết hóa đơn" khi in */
        .no-print { display: none !important; } 
        .screen-title { display: none !important; }
        
        /* Hiện tiêu đề "Hóa đơn bán hàng" khi in */
        .print-title { display: block !important; text-align: center; }
        
        .summary { border-top: 2px solid #e5e7eb; padding-top: 20px; text-align: right; }
      </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div class="print-wrapper">'); // Bọc hóa đơn vào thẻ có kích thước 500px
    printWindow.document.write(content);
    printWindow.document.write('</div>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="at-container" style={{ background: "#f8f9fb", minHeight: "100vh", padding: "24px" }}>
      <div className="at-main">
        
        <div className="at-section" style={{ flex: 1, padding: "24px", background: "#fff", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>
          <h2 style={{ marginBottom: 20, fontSize: "22px", color: "#111827" }}>📦 Đơn hàng của xưởng</h2>

          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            <button className={`mode-btn ${tab === "outsourcing" ? "mode-active" : ""}`}
              onClick={() => { setTab("outsourcing"); setSelected(null); }}>Đơn gia công</button>
            <button className={`mode-btn ${tab === "ready" ? "mode-active" : ""}`}
              onClick={() => { setTab("ready"); setSelected(null); }}>Đơn mẫu sẵn</button>
          </div>

          {loading && <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>Đang tải danh sách đơn hàng...</div>}

          <table className="at-table">
            <thead><tr>
              <th>Mã</th><th>Khách</th><th>Tổng</th><th>Trạng thái</th><th>Thanh toán</th><th>Ngày</th><th></th>
            </tr></thead>
            <tbody>
              {orders.map(o => (
                <React.Fragment key={o.id}>
                  <tr className="clickable" onClick={() => viewDetail(o.id)}
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

                  {/* DÒNG HIỂN THỊ CHI TIẾT NGAY BÊN DƯỚI DẠNG HÓA ĐƠN */}
                  {selected?.id === o.id && (
                    <tr>
                      <td colSpan={7} style={{ padding: 0, borderBottom: "none", background: "#f8fafc" }}>
                        <div style={{ padding: "24px", display: "flex", justifyContent: "center" }}>
                          {detailLoading ? <div style={{ padding: 40, color: "#6b7280" }}>Đang tải hóa đơn...</div> : (
                            <div id={`invoice-content-${selected.id}`} style={{ width: "100%", maxWidth: "450px", background: "#fff", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0", position: "relative" }}>
                              
                              <div className="invoice-header" style={{ textAlign: "center", borderBottom: "1px dashed #cbd5e1", paddingBottom: "16px", marginBottom: "20px" }}>
                                {/* 🌟 TIÊU ĐỀ XEM TRÊN WEB */}
                                <h2 className="screen-title" style={{ margin: 0, fontSize: "20px", color: "#111827", textTransform: "uppercase", letterSpacing: "1px" }}>Chi tiết hóa đơn</h2>
                                
                                {/* 🌟 TIÊU ĐỀ KHI IN (Mặc định ẩn) */}
                                <h2 className="print-title" style={{ display: "none", margin: 0, fontSize: "22px", color: "#111827", textTransform: "uppercase", letterSpacing: "1px", paddingBottom: "10px" }}>Hóa đơn bán hàng</h2>
                                
                                <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: "13px" }}>Mã đơn: <strong>#DH-{selected.id}</strong></p>
                                <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "13px" }}>Ngày: {formatDate(selected.createdAt)}</p>
                              </div>

                              <div style={{ marginBottom: "24px", fontSize: "13px", lineHeight: "1.8" }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span style={{ color: "#6b7280" }}>Khách hàng:</span>
                                  <strong style={{ color: "#111827" }}>{selected.customerName || "N/A"}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span style={{ color: "#6b7280" }}>Loại đơn:</span>
                                  <strong style={{ color: "#111827" }}>{selected.orderType === "OUTSOURCING" ? "Đơn gia công" : "Đơn mẫu sẵn"}</strong>
                                </div>
                                {selected.receiverName && (
                                  <>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                      <span style={{ color: "#6b7280" }}>Người nhận:</span>
                                      <strong style={{ color: "#111827" }}>{selected.receiverName} - {selected.receiverPhone}</strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                      <span style={{ color: "#6b7280", flexShrink: 0, marginRight: 8 }}>Giao đến:</span>
                                      <span style={{ color: "#111827", textAlign: "right", wordBreak: "break-word" }}>{selected.shippingAddress}</span>
                                    </div>
                                  </>
                                )}
                              </div>

                              {(selected.designFileUrl || selected.designFileUrlBack) && (
                                <div style={{ marginBottom: "24px" }}>
                                  <div style={{ fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", fontSize: "11px", borderBottom: "1px solid #e5e7eb", paddingBottom: "6px", margin: "0 0 12px 0", textAlign: "center" }}>Ảnh thiết kế</div>
                                  <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                                    {selected.designFileUrl && (
                                      <img src={BASE_IMG + selected.designFileUrl} alt="front" style={{ width: 80, height: 100, objectFit: "contain", borderRadius: 6, border: "1px solid #e2e8f0" }}/>
                                    )}
                                    {selected.designFileUrlBack && (
                                      <img src={BASE_IMG + selected.designFileUrlBack} alt="back" style={{ width: 80, height: 100, objectFit: "contain", borderRadius: 6, border: "1px solid #e2e8f0" }}/>
                                    )}
                                  </div>
                                </div>
                              )}

                              {selected.items && selected.items.length > 0 && (
                                <div style={{ marginBottom: "24px", width: "100%" }}>
                                  <div style={{ fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", fontSize: "11px", borderBottom: "1px solid #e5e7eb", paddingBottom: "6px", margin: "0 0 8px 0" }}>
                                    Danh sách sản phẩm
                                  </div>
                                  
                                  {selected.items.map((it, i) => (
                                    <div key={i} style={{ borderBottom: "1px dashed #f1f5f9", padding: "12px 0", fontSize: "13px" }}>
                                      
                                      {/* Dòng 1: Tên sản phẩm - Dù dài đến mấy cũng sẽ tự rớt xuống dòng, không bao giờ tràn */}
                                      <div style={{ color: "#111827", fontWeight: 600, wordWrap: "break-word", marginBottom: "6px", lineHeight: "1.4" }}>
                                        {it.productName || `SP #${it.id}`}
                                      </div>

                                      {/* Dòng 2: Đơn giá x Số lượng ----------------- Thành tiền */}
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        
                                        {/* Cột trái: Đơn giá và Số lượng */}
                                        <div style={{ color: "#6b7280", fontSize: "12px" }}>
                                          {formatVND(it.unitPrice)} <span style={{ margin: "0 4px" }}>x</span> <strong style={{ color: "#374151", fontSize: "13px" }}>{it.quantity}</strong>
                                        </div>

                                        {/* Cột phải: Tổng tiền của món đó */}
                                        <div style={{ color: "#111827", fontWeight: 700, fontSize: "14px" }}>
                                          {formatVND(it.unitPrice * it.quantity)}
                                        </div>
                                        
                                      </div>
                                      
                                    </div>
                                  ))}
                                </div>
                              )}

                              {selected.note && (
                                <div style={{ marginBottom: "24px", background: "#f9fafb", padding: "12px", borderRadius: "6px", border: "1px dashed #cbd5e1" }}>
                                  <div style={{ fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", fontSize: "11px", margin: "0 0 6px 0" }}>Ghi chú</div>
                                  <div style={{ fontSize: "12px", color: "#4b5563", whiteSpace: "pre-wrap" }}>{selected.note}</div>
                                </div>
                              )}

                              <div className="summary" style={{ borderTop: "1px dashed #cbd5e1", paddingTop: "16px" }}>
                                {selected.depositAmount > 0 && (
                                  <>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px", color: "#4b5563" }}>
                                      <span>Tổng tiền:</span> <strong>{formatVND(selected.totalAmount || selected.finalAmount)}</strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px", color: "#f59e0b" }}>
                                      <span>Đã đặt cọc:</span> <strong>- {formatVND(selected.depositAmount)}</strong>
                                    </div>
                                  </>
                                )}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e5e7eb" }}>
                                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>THANH TOÁN:</span>
                                  <strong style={{ fontSize: "18px", color: "#2563eb" }}>{formatVND((selected.finalAmount || 0) - (selected.depositAmount || 0))}</strong>
                                </div>
                                <div style={{ textAlign: "right", marginTop: "8px", fontSize: "12px", color: selected.paymentStatus === "FULLY_PAID" ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                                  {selected.paymentStatus === "FULLY_PAID" ? "✔ Đã thanh toán đủ" : "⚠ Chưa thanh toán đủ"}
                                </div>
                              </div>

                              <div className="no-print" style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #f1f5f9" }}>
                                {selected.status === "COMPLETED" ? (
                                  <button onClick={handlePrint}
                                    style={{
                                      width: "100%", padding: "12px", border: "none", borderRadius: "8px",
                                      background: "#10b981", color: "white", cursor: "pointer", 
                                      fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                      boxShadow: "0 4px 10px rgba(16, 185, 129, 0.2)", transition: "all 0.2s"
                                    }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>print</span>
                                    IN HÓA ĐƠN
                                  </button>
                                ) : (
                                  <div>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 10, textAlign: "center" }}>CẬP NHẬT TRẠNG THÁI</span>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                                      {STATUS_OPTIONS.map(s => (
                                        <button key={s.v} onClick={() => updateStatus(selected.id, s.v)}
                                          style={{
                                            padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px",
                                            background: selected.status === s.v ? "#2563eb" : "#fff",
                                            color: selected.status === s.v ? "#fff" : "#374151",
                                            cursor: "pointer", fontSize: 12, fontWeight: 600,
                                            display: "flex", alignItems: "center", gap: 4, transition: "all 0.2s"
                                          }}>
                                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{s.icon}</span>
                                          {s.t}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {orders.length === 0 && !loading && <tr><td colSpan={7} style={{ textAlign: "center", padding: 40 }}>Không có đơn</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}