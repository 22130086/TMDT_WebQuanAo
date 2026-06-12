import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import http from "../../services/http"; // Đường dẫn tới axios/http instance của bạn
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "../../styles/order-detail.css"; // Giữ nguyên file CSS của bạn
import {
  Check,
  Package,
  Truck,
  CircleCheck,
  Verified,
  User,
  Phone,
  MapPin,
  MessageCircle,
  ClipboardCheck,
  XCircle,
  AlertTriangle
} from "lucide-react";

// 1. Định nghĩa Interface khớp dữ liệu thực tế từ Backend
interface OrderItem {
  id: number;
  productId?: number;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
}

interface OrderDetailData {
  factoryId: string | undefined;
  id: number;
  orderType: "READY_MADE" | "OUTSOURCING";
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  depositAmount: number;
  status: "PENDING" | "CONFIRMED" | "IN_PRODUCTION" | "READY_TO_SHIP" | "SHIPPING" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "DISPUTED";
  paymentMethod: "VNPAY" | "MOMO" | "BANK_TRANSFER" | "COD";
  paymentStatus: "UNPAID" | "DEPOSIT_PAID" | "FULLY_PAID";
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  note: string;
  createdAt: string;
  items: OrderItem[];
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>(); // Lấy ID đơn hàng từ URL thanh địa chỉ
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // 2. Gọi API lấy chi tiết một đơn hàng
  useEffect(() => {
    const fetchOrderDetail = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await http.get(`/orders/${id}`);
        // Thường API bọc qua lớp ApiResponse chung (response.data.data)
        if (response.data && response.data.data) {
          setOrder(response.data.data);
        } else {
          setOrder(response.data);
        }
      } catch (err: any) {
        console.error("Lỗi lấy chi tiết đơn hàng:", err);
        setError("Không thể tải thông tin chi tiết đơn hàng này. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrderDetail();
    }
  }, [id]);

  // 3. Các hàm định dạng hiển thị
  const formatVND = (value: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "---";
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "VNPAY": return "Ví VNPAY";
      case "MOMO": return "Ví MoMo";
      case "BANK_TRANSFER": return "Chuyển khoản";
      case "COD": return "Thanh toán khi nhận hàng (COD)";
      default: return method;
    }
  };

  // Ánh xạ badge trạng thái tổng quan
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return { text: "Chờ xử lý", color: "#f59e0b" };
      case "CONFIRMED": return { text: "Đã xác nhận", color: "#3b82f6" };
      case "IN_PRODUCTION": return { text: "Đang sản xuất", color: "#8b5cf6" };
      case "READY_TO_SHIP": return { text: "Chờ giao hàng", color: "#06b6d4" };
      case "SHIPPING": return { text: "Đang giao hàng", color: "#10b981" };
      case "DELIVERED": return { text: "Đã giao hàng", color: "#10b981" };
      case "COMPLETED": return { text: "Hoàn thành", color: "#111827" };
      case "CANCELLED": return { text: "Đã hủy đơn", color: "#ef4444" };
      case "DISPUTED": return { text: "Đang khiếu nại", color: "#b91c1c" };
      default: return { text: status, color: "#6b7280" };
    }
  };

  // 4. Hàm xác định xem bước nào trên Timeline được kích hoạt (Active) theo 5 giai đoạn mới
  const getTimelineStep = (status: string): number => {
    switch (status) {
      case "PENDING": 
        return 1; // Bước 1: Chờ xác nhận
      case "CONFIRMED": 
      case "IN_PRODUCTION": 
        return 2; // Bước 2: Xác nhận đơn & Đang sản xuất
      case "READY_TO_SHIP": 
        return 3; // Bước 3: Chuẩn bị đơn
      case "SHIPPING": 
      case "DELIVERED": 
        return 4; // Bước 4: Giao hàng
      case "COMPLETED": 
        return 5; // Bước 5: Hoàn tất
      default: 
        return 1;
    }
  };

  // Logout callback cho Header
  function handleLogout() {
    localStorage.clear();
    window.location.href = "/";
  }

  // Giao diện khi đang tải
  if (loading) {
    return (
      <div className="order-detail-page">
        <Header onLogout={handleLogout} />
        <div style={{ padding: "100px 20px", textAlign: "center", fontSize: "16px" }}>
          Đang tải dữ liệu chi tiết đơn hàng...
        </div>
        <Footer />
      </div>
    );
  }

  // Giao diện khi xảy ra lỗi hoặc không tìm thấy đơn hàng
  if (error || !order) {
    return (
      <div className="order-detail-page">
        <Header onLogout={handleLogout} />
        <div style={{ padding: "80px 20px", textAlign: "center" }}>
          <p style={{ color: "red", fontSize: "16px", marginBottom: "20px" }}>{error || "Không tìm thấy dữ liệu đơn hàng."}</p>
          <Link to="/order-history" className="btn-outline" style={{ padding: "10px 20px", textDecoration: "none" }}>
            Quay lại lịch sử đơn hàng
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const currentStep = getTimelineStep(order.status);
  const badgeInfo = getStatusBadge(order.status);

  return (
    <div className="order-detail-page">
      <Header onLogout={handleLogout} />
      
      <main className="order-detail-container">
        
        {/* BỌC 2 PHẦN NÀY LẠI BẰNG CLASS order-top-row */}
        <div className="order-top-row">

        {/* HEADER CHI TIẾT ĐƠN HÀNG */}
        <div className="order-detail-header">
          <div>
            <div className="order-detail-meta">
              <span>Hệ thống quản lý đơn hàng</span>
              <span className="priority-badge">
                {order.orderType === "READY_MADE" ? "Mẫu Sẵn Có" : "Đơn Hàng Gia Công"}
              </span>
            </div>

            <h1 className="order-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              Đơn hàng #{order.id}
              <Verified size={20} style={{ color: "#3b82f6" }} />
            </h1>

            <p className="order-date">
              Ngày đặt hàng: {formatDate(order.createdAt)}
            </p>
          </div>

          <span className="status-badge" style={{ backgroundColor: `${badgeInfo.color}15`, color: badgeInfo.color, border: `1px solid ${badgeInfo.color}40` }}>
            <span className="status-dot" style={{ backgroundColor: badgeInfo.color }}></span>
            {badgeInfo.text}
          </span>
        </div>

        {/* TIMELINE THEO DÕI TRẠNG THÁI (Ẩn đi nếu đơn bị hủy/khiếu nại để giao diện chuẩn chỉnh) */}
        {order.status !== "CANCELLED" && order.status !== "DISPUTED" ? (
          <section className="tracking-section">
            <div className="tracking-timeline">
              
              {/* Bước 1: Chờ xác nhận (PENDING) */}
              <div className={`timeline-step ${currentStep >= 1 ? "active" : ""}`}>
                <div className="step-icon">
                  <ClipboardCheck size={20} />
                </div>
                <div className="step-content">
                  <h5>Chờ xác nhận</h5>
                  <p>{order.status === "PENDING" ? "Đang chờ duyệt" : "Đã gửi đơn"}</p>
                </div>
              </div>

              {/* Bước 2: Xác nhận đơn (CONFIRMED / IN_PRODUCTION) */}
              <div className={`timeline-step ${currentStep >= 2 ? "active" : ""}`}>
                <div className="step-icon">
                  <Check size={20} />
                </div>
                <div className="step-content">
                  <h5>Xác nhận đơn</h5>
                  <p>{order.status === "IN_PRODUCTION" ? "Đang sản xuất" : currentStep >= 2 ? "Đã tiếp nhận" : "Chờ xưởng nhận"}</p>
                </div>
              </div>

              {/* Bước 3: Chuẩn bị đơn (READY_TO_SHIP) */}
              <div className={`timeline-step ${currentStep >= 3 ? "active" : ""}`}>
                <div className="step-icon">
                  <Package size={20} />
                </div>
                <div className="step-content">
                  <h5>Chuẩn bị đơn</h5>
                  <p>{currentStep >= 3 ? "Đóng gói hoàn tất" : "Chờ chuẩn bị hàng"}</p>
                </div>
              </div>

              {/* Bước 4: Giao hàng (SHIPPING / DELIVERED) */}
              <div className={`timeline-step ${currentStep >= 4 ? "active" : ""}`}>
                <div className="step-icon">
                  <Truck size={20} />
                </div>
                <div className="step-content">
                  <h5>Giao hàng</h5>
                  <p>{order.status === "SHIPPING" ? "Đang vận chuyển" : order.status === "DELIVERED" ? "Đã giao tới nơi" : "Chờ shipper"}</p>
                </div>
              </div>

              {/* Bước 5: Hoàn tất (COMPLETED) */}
              <div className={`timeline-step ${currentStep >= 5 ? "active" : ""}`}>
                <div className="step-icon">
                  <CircleCheck size={20} />
                </div>
                <div className="step-content">
                  <h5>Hoàn tất</h5>
                  <p>{currentStep === 5 ? "Giao dịch kết thúc" : "Chờ quyết toán"}</p>
                </div>
              </div>

            </div>
          </section>
        ) : (
          /* Khối thông báo đặc biệt nếu đơn hàng bị HỦY hoặc KHIẾU NẠI */
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "20px",
            backgroundColor: order.status === "CANCELLED" ? "#fef2f2" : "#fffbeb",
            borderRadius: "8px",
            marginBottom: "30px",
            border: `1px solid ${order.status === "CANCELLED" ? "#fca5a5" : "#fcd34d"}`
          }}>
            {order.status === "CANCELLED" ? (
              <XCircle size={32} style={{ color: "#ef4444" }} />
            ) : (
              <AlertTriangle size={32} style={{ color: "#d97706" }} />
            )}
            <div>
              <h4 style={{ margin: 0, color: order.status === "CANCELLED" ? "#991b1b" : "#92400e" }}>
                {order.status === "CANCELLED" ? "Đơn hàng này đã bị hủy" : "Đơn hàng đang trong trạng thái khiếu nại / tranh chấp"}
              </h4>
              <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#4b5563" }}>
                Ghi chú hệ thống: {order.note || "Không có lý do chi tiết được cung cấp."}
              </p>
            </div>
          </div>
        )}  
        </div> 
        {/* KẾT THÚC order-top-row */}
        
        {/* PHẦN NỘI DUNG CHÍNH (GRID 2 CỘT) */}
        <div className="order-grid">
          
          {/* CỘT TRÁI: CHI TIẾT SẢN PHẨM SẢN XUẤT */}
          <div className="products-panel">
            <div className="panel-header">
              <h2>Sản phẩm bàn giao</h2>
              <span className="items-count">{order.items?.length || 0} mục</span>
            </div>

            <div className="products-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {order.items && order.items.map((item, index) => (
                <div key={item.id || index} className="product-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "16px", borderBottom: "1px solid #f3f4f6" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <img
                      className="product-thumb"
                      src={item.productImage || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=150"}
                      alt={item.productName}
                      style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                    />
                    <div>
                      <h4 className="product-name" style={{ margin: 0, fontSize: "15px", color: "#1f2937", fontWeight: "600" }}>
                        {item.productName}
                      </h4>
                      <p className="product-spec" style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#6b7280" }}>
                        Mã định danh sản phẩm: #{item.productId || item.id}
                      </p>
                    </div>
                  </div>

                  <div className="product-pricing" style={{ textAlign: "right" }}>
                    <span className="product-qty" style={{ fontSize: "13px", color: "#6b7280", marginRight: "12px" }}>
                      x{item.quantity}
                    </span>
                    <strong className="product-price" style={{ fontSize: "15px", color: "#111827" }}>
                      {formatVND(item.unitPrice)}
                    </strong>
                    <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#9ca3af" }}>
                      Thành tiền: {formatVND(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mục hiển thị ghi chú của khách hàng */}
            {order.note && (
              <div style={{ marginTop: "20px", padding: "16px", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                <h5 style={{ margin: "0 0 6px 0", color: "#374151", fontWeight: "600" }}>Ghi chú từ khách hàng:</h5>
                <p style={{ margin: 0, fontSize: "14px", color: "#4b5563", fontStyle: "italic" }}>"{order.note}"</p>
              </div>
            )}
          </div>

          {/* CỘT PHẢI: SIDEBAR THÔNG TIN KHÁCH HÀNG & THÀNH TIỀN */}
          <div className="info-panel">
            
            {/* Thẻ thông tin người nhận hàng */}
            <div className="client-card">
              <h3>Thông tin nhận hàng</h3>
              
              <div className="info-group">
                <User size={18} />
                <div>
                  <label>Khách hàng người nhận</label>
                  <p>{order.receiverName}</p>
                </div>
              </div>

              <div className="info-group">
                <Phone size={18} />
                <div>
                  <label>Số điện thoại liên hệ</label>
                  <p>{order.receiverPhone}</p>
                </div>
              </div>

              <div className="info-group">
                <MapPin size={18} />
                <div>
                  <label>Địa điểm giao hàng</label>
                  <p>{order.shippingAddress}</p>
                </div>
              </div>
            </div>

            {/* Thẻ hỗ trợ liên hệ xưởng */}
            <div className="support-card">
              <div className="support-icon">
                <MessageCircle size={24} />
              </div>
              <div>
                <h4>Hỗ trợ trực tuyến</h4>
                <p>Mã xưởng đối tác: <div id={order.factoryId}></div></p>
              </div>
              <button onClick={() => alert(`Tính năng kết nối chat với xưởng #${order.factoryId} đang được cập nhật!`)}>
                Chat với Shop Owner
              </button>
            </div>

            {/* BẢNG TỔNG KẾT TÀI CHÍNH ĐƠN HÀNG */}
            <div className="order-summary">
              <div>
                <span>Tạm tính hàng hóa</span>
                <span>{formatVND(order.totalAmount)}</span>
              </div>

              <div>
                <span>Chiết khấu mã giảm giá</span>
                <span className="discount">
                  -{formatVND(order.discountAmount)}
                </span>
              </div>

              <div>
                <span>Phương thức thanh toán</span>
                <span style={{ fontWeight: "500", color: "#4b5563" }}>{getPaymentMethodText(order.paymentMethod)}</span>
              </div>

              <div>
                <span>Trạng thái thanh toán</span>
                <span style={{ 
                  fontWeight: "600", 
                  color: order.paymentStatus === "FULLY_PAID" ? "#10b981" : order.paymentStatus === "DEPOSIT_PAID" ? "#f59e0b" : "#ef4444" 
                }}>
                  {order.paymentStatus === "FULLY_PAID" ? "Đã thanh toán" : order.paymentStatus === "DEPOSIT_PAID" ? "Đã đặt cọc" : "Chưa thanh toán"}
                </span>
              </div>

              {order.depositAmount > 0 && (
                <div>
                  <span>Số tiền đã cọc trước</span>
                  <span style={{ color: "#f59e0b", fontWeight: "500" }}>{formatVND(order.depositAmount)}</span>
                </div>
              )}

              <div className="summary-total">
                <span>Tổng phải thanh toán</span>
                <strong>{formatVND(order.finalAmount)}</strong>
              </div>
            </div>

            <div style={{ marginTop: "16px" }}>
              <Link to="/order-history" style={{ textDecoration: "none" }}>
                <button className="btn-outline" style={{ width: "100%", padding: "12px", cursor: "pointer" }}>
                  ← Quay lại danh sách đơn hàng
                </button>
              </Link>
            </div>

          </div>
        </div>
        
      </main>

      <Footer />
    </div>
  );
}