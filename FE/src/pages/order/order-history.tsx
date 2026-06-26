import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import http from "../../services/http";
import { getImageUrl } from "../../services/http";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "../../styles/order-history.css";

// Khai báo Interface dữ liệu theo cấu trúc thực tế từ Backend
interface OrderItem {
  id: number;
  productId?: number;
  quantity: number;
  unitPrice: number;
  productName?: string;
  productImage?: string; 
}

interface Order {
  id: number;
  orderType: "READY_MADE" | "OUTSOURCING";
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  depositAmount: number;
  paymentMethod: "VNPAY" | "MOMO" | "BANK_TRANSFER" | "COD";
  paymentStatus: "UNPAID" | "DEPOSIT_PAID" | "FULLY_PAID";
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  note: string;
  status: "PENDING" | "CONFIRMED" | "IN_PRODUCTION" | "READY_TO_SHIP" | "SHIPPING" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "DISPUTED";
  createdAt?: string;
  items: OrderItem[];
  designFileUrl?: string;
  factoryName?: string;
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("ALL"); // ALL, PROCESSING, COMPLETED, CANCELLED

  // 1. Hàm gọi API lấy danh sách đơn hàng từ Backend
  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await http.get("/orders?page=0&size=50");
      if (response.data && response.data.data) {
        setOrders(response.data.data.content || []);
      }
    } catch (err: any) {
      console.error("Lỗi lấy đơn hàng:", err);
      setError("Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // 2. Hàm hỗ trợ hủy đơn hàng (Call API PATCH /api/orders/{id}/cancel)
  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${orderId} không?`)) return;

    try {
      const response = await http.patch(`/orders/${orderId}/cancel`);
      if (response.status === 200) {
        alert("Hủy đơn hàng thành công!");
        loadOrders(); 
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Không thể hủy đơn hàng này.");
    }
  };

  // 3. Logic lọc đơn hàng theo các Tab trên giao diện
  const filteredOrders = orders.filter((order) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "PROCESSING") {
      // Đang xử lý bao gồm các bước sản xuất luân chuyển và đang vận chuyển
      return ["PENDING", "CONFIRMED", "IN_PRODUCTION", "READY_TO_SHIP", "SHIPPING", "DELIVERED"].includes(order.status);
    }
    if (activeTab === "COMPLETED") return order.status === "COMPLETED"; // 🌟 Sửa thành COMPLETED khớp backend
    if (activeTab === "CANCELLED") return ["CANCELLED", "DISPUTED"].includes(order.status); // Gom nhóm hủy/khiếu nại vào tab này
    return true;
  });

  // 4. Các hàm Helper định dạng hiển thị
  const formatVND = (value: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  // Định dạng hiển thị chuỗi phương thức thanh toán thân thiện
  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case "VNPAY": return "Ví VNPAY";
      case "MOMO": return "Ví MoMo";
      case "BANK_TRANSFER": return "Chuyển khoản ngân hàng";
      case "COD": return "Thanh toán khi nhận hàng (COD)";
      default: return method;
    }
  };

  // 🌟 ÁNH XẠ TOÀN BỘ 9 TRẠNG THÁI ĐƠN HÀNG TỪ BACKEND
  const getStatusMeta = (status: string) => {
    switch (status) {
      case "PENDING":
        return { className: "processing", badgeClass: "status-pending", text: "Chờ xử lý", icon: "schedule" };
      case "CONFIRMED":
        return { className: "processing", badgeClass: "status-confirmed", text: "Đã xác nhận", icon: "thumb_up" };
      case "IN_PRODUCTION":
        return { className: "processing", badgeClass: "status-production", text: "Đang sản xuất", icon: "precision_manufacturing" };
      case "READY_TO_SHIP":
        return { className: "processing", badgeClass: "status-ready", text: "Chờ giao hàng", icon: "inventory_2" };
      case "SHIPPING":
        return { className: "processing", badgeClass: "status-shipping", text: "Đang giao hàng", icon: "local_shipping" };
      case "DELIVERED":
        return { className: "processing", badgeClass: "status-delivered", text: "Đã giao hàng", icon: "package_2" };
      case "COMPLETED":
        return { className: "delivered", badgeClass: "delivered-status", text: "Hoàn thành", icon: "check_circle" };
      case "CANCELLED":
        return { className: "cancelled", badgeClass: "cancelled-status", text: "Đã hủy", icon: "cancel" };
      case "DISPUTED":
        return { className: "disputed", badgeClass: "disputed-status", text: "Khiếu nại", icon: "report" };
      default:
        return { className: "processing", badgeClass: "processing-status", text: status, icon: "help" };
    }
  };

  // 🌟 ÁNH XẠ TRẠNG THÁI THANH TOÁN (PAYMENT STATUS) RA STYLE & TEXT UI
  const getPaymentStatusMeta = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "UNPAID":
        return { text: "Chưa thanh toán", icon: "credit_card_off", textColor: "#ef4444", bgColor: "#fef2f2" };
      case "DEPOSIT_PAID":
        return { text: "Đã đặt cọc", icon: "hourglass_top", textColor: "#f59e0b", bgColor: "#fffbeb" };
      case "FULLY_PAID":
        return { text: "Đã tất toán", icon: "verified_user", textColor: "#10b981", bgColor: "#ecfdf5" };
      default:
        return { text: paymentStatus, icon: "payments", textColor: "#6b7280", bgColor: "#f3f4f6" };
    }
  };

  function handleLogout() {
    localStorage.clear();
    window.location.href = "/";
  }

  return (
    <main className="order-history-page">
      <Header onLogout={handleLogout} />

      <div className="order-history-container">
        
        {/* HEADER TRANG */}
        <div className="order-history-header">
          <div>
            <h1>Đơn hàng của tôi</h1>
            <p>Quản lý và theo dõi trạng thái các đơn hàng bạn đã đặt</p>
          </div>

          {/* BỘ LỌC TABS */}
          <div className="order-filter-tabs">
            <button className={activeTab === "ALL" ? "active" : ""} onClick={() => setActiveTab("ALL")}>
              Tất cả ({orders.length})
            </button>
            <button className={activeTab === "PROCESSING" ? "active" : ""} onClick={() => setActiveTab("PROCESSING")}>
              Đang xử lý
            </button>
            <button className={activeTab === "COMPLETED" ? "active" : ""} onClick={() => setActiveTab("COMPLETED")}>
              Hoàn thành
            </button>
            <button className={activeTab === "CANCELLED" ? "active" : ""} onClick={() => setActiveTab("CANCELLED")}>
              Hủy / Khiếu nại
            </button>
          </div>
        </div>

        {/* HIỂN THỊ TRẠNG THÁI LOADING / LỖI / TRỐNG */}
        {loading && <div className="loading-state" style={{padding: '40px', textAlign: 'center'}}>Đang tải danh sách đơn hàng...</div>}
        {error && <div className="list-error" style={{color: 'red', margin: '20px 0'}}>{error}</div>}
        
        {!loading && filteredOrders.length === 0 && (
          <div className="empty-state" style={{padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '12px', marginTop: '24px'}}>
            Không tìm thấy đơn hàng nào phù hợp.
          </div>
        )}

        {/* DANH SÁCH ĐƠN HÀNG */}
        {!loading && filteredOrders.map((order) => {
          const statusMeta = getStatusMeta(order.status);
          const payMeta = getPaymentStatusMeta(order.paymentStatus); // 🌟 Lấy data payment status
          
          return (
            <div key={order.id} className={`order-card ${statusMeta.className}`}>
              
              {/* KHỐI TRÁI: THÔNG TIN CHUNG */}
              <div className="order-left">
                <div>
                  <h3>Đơn hàng #{order.id}</h3>
                  <p>Loại: {order.orderType === "READY_MADE" ? "Mẫu sẵn" : "Gia công"}</p>
                  <p style={{ fontSize: "12px" }}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "Gần đây"}
                  </p>
                </div>
                <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "12px" }}>
                  PTTT: <strong>{formatPaymentMethod(order.paymentMethod)}</strong>
                </p>
              </div>

              {/* KHỐI GIỮA: DANH SÁCH SẢN PHẨM / ẢNH THIẾT KẾ */}
              <div className="order-middle" style={{ flex: 1.3, display: "flex", flexDirection: "column", gap: "10px" }}>
                {order.orderType === "OUTSOURCING" ? (
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {order.designFileUrl ? (
                      <img src={getImageUrl(order.designFileUrl)} alt="Thiết kế"
                        style={{ width: 80, height: 90, objectFit: "contain", borderRadius: 10, border: "1px solid #e5e7eb", background: "#f9fafb" }} />
                    ) : (
                      <div style={{ width: 80, height: 90, borderRadius: 10, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👕</div>
                    )}
                    <div>
                      <strong style={{ fontSize: 14 }}>{order.factoryName || "Đơn gia công"}</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
                        {formatVND(order.totalAmount)} / đơn
                      </p>
                      {order.depositAmount > 0 && (
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#f59e0b" }}>
                          Đã cọc: {formatVND(order.depositAmount)}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                <>
                <h4 style={{ margin: "0 0 8px 0", color: "#4b5563", borderBottom: "1px solid #f3f4f6", paddingBottom: "4px" }}>
                  Sản phẩm ({order.items?.length || 0})
                </h4>
                
                <div className="order-items-list" style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "240px", overflowY: "auto" }}>
                  {order.items && order.items.map((item, index) => (
                    <div 
                      key={item.id || index} 
                      className="order-item-row" 
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px dashed #e5e7eb" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <img 
                          src={getImageUrl(item.productImage) || "https://placehold.co/45x45?text=No+Img"} 
                          alt={item.productName || "Product"} 
                          style={{ width: "45px", height: "45px", borderRadius: "6px", objectFit: "cover", border: "1px solid #e5e7eb" }}
                        />
                        <div>
                          <p style={{ margin: 0, fontWeight: "500", color: "#1f2937", fontSize: "14px" }}>
                            {item.productName || `Sản phẩm mã #${item.id}`}
                          </p>
                          <p style={{ margin: 0, fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                            Số lượng: <strong style={{ color: "#111827" }}>{item.quantity}</strong>
                          </p>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, fontWeight: "500", color: "#374151", fontSize: "14px" }}>
                          {formatVND(item.unitPrice)}
                        </p>
                        <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>
                          Tổng: {formatVND(item.unitPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                </>
              )}
              </div>

              {/* KHỐI PHẢI */}
              <div className="order-right" style={{ flex: 0.5, minWidth: "200px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px" }}>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, color: "#6b7280", fontSize: "13px" }}>Tổng tiền thanh toán</p>
                  <h3 style={{ margin: "4px 0 0 0", color: "#111827", fontSize: "20px", fontWeight: "700" }}>{formatVND(order.finalAmount)}</h3>
                </div>

                {/* 🌟 Khối bọc chung đảm bảo 2 badge luôn luôn xếp hàng ngang, căn sát lề phải */}
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: "8px", width: "100%" }}>
                  
                  {/* 🌟 1. Badge Trạng thái Đơn hàng */}
                  <div className={`order-status ${statusMeta.badgeClass}`} style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0, whiteSpace: "nowrap" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                      {statusMeta.icon}
                    </span>
                    <span>{statusMeta.text}</span>
                  </div>

                  {/* 🌟 2. Badge Trạng thái Thanh toán */}
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "12px",
                    fontWeight: "500",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    color: payMeta.textColor,
                    backgroundColor: payMeta.bgColor,
                    border: `1px solid ${payMeta.textColor}22`,
                    whiteSpace: "nowrap" // Giữ chữ trên một dòng
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>
                      {payMeta.icon}
                    </span>
                    <span>{payMeta.text}</span>
                  </div>

                </div>

                {/* Các nút bấm hành động */}
                <div className="order-actions" style={{ width: "100%", marginTop: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Link to={`/order-detail/${order.id}`} style={{ textDecoration: 'none', width: '100%' }}>
                    <button className="btn-outline" style={{ width: "100%" }}>Xem chi tiết</button>
                  </Link>

                  {order.status === "PENDING" && (
                    <button 
                      className="btn-primary" 
                      style={{ background: "#ef4444", width: "100%" }} 
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      Hủy đơn hàng
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}

      </div>

      <Footer />
    </main>
  );
}