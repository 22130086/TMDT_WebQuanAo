import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import http from "../../services/http";
import { getImageUrl } from "../../services/http";
import { reviewService } from "../../services/reviewService";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "../../styles/order-detail.css";
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
  AlertTriangle,
  Gavel,
  FileWarning
} from "lucide-react";

// 1. Định nghĩa Interface khớp dữ liệu thực tế từ Backend
interface OrderItem {
  id: number;
  productId?: number;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  attributes?: string;
}

interface OrderDetailData {
  factoryId: string | undefined;
  factoryName?: string;
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
  designFileUrl?: string;
  designFileUrlBack?: string;
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>(); // Lấy ID đơn hàng từ URL thanh địa chỉ
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Review modal
  const [reviewModal, setReviewModal] = useState<{ productId: number; productName: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<number>>(() => {
    // Load from localStorage on mount
    try {
      const saved = localStorage.getItem(`reviewed_order_${id}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  // Dispute & Complaint state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeDesc, setDisputeDesc] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintReason, setComplaintReason] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showActionMsg = (type: 'success' | 'error', text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 4000);
  };

  // Save to localStorage whenever it changes
  useEffect(() => {
    if (reviewedProductIds.size > 0) {
      localStorage.setItem(`reviewed_order_${id}`, JSON.stringify([...reviewedProductIds]));
    }
  }, [reviewedProductIds, id]);

  // Load already-reviewed products from backend on mount
  useEffect(() => {
    if (!id) return;
    reviewService.getMyReviewsForOrder(Number(id)).then(res => {
      if (res.success && Array.isArray(res.data)) {
        const ids = new Set(res.data.map((r: any) => r.productId).filter(Boolean));
        if (ids.size > 0) setReviewedProductIds(ids);
      }
    }).catch(() => {});
  }, [id]);

  const handleSubmitReview = async () => {
    if (!reviewModal || !reviewComment.trim()) return;
    try {
      setSubmittingReview(true);
      const res = await reviewService.addProductReview({
        productId: reviewModal.productId,
        rating: reviewRating,
        comment: reviewComment.trim(),
        orderId: Number(id),
      });
      if (res.success) {
        showActionMsg('success', 'Đánh giá thành công!');
        setReviewedProductIds(prev => new Set(prev).add(reviewModal.productId));
        setReviewModal(null);
      }
    } catch (err: any) {
      showActionMsg('error', err.response?.data?.message || 'Bạn đã đánh giá sản phẩm này rồi');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSubmitDispute = async () => {
    if (!disputeDesc.trim()) return;
    setSubmittingDispute(true);
    try {
      await http.post('/disputes', { orderId: Number(id), description: disputeDesc.trim() });
      showActionMsg('success', 'Tạo tranh chấp thành công! Admin sẽ xem xét.');
      setShowDisputeModal(false);
      setDisputeDesc('');
    } catch (e: any) {
      showActionMsg('error', e?.response?.data?.message || 'Tạo tranh chấp thất bại');
    } finally { setSubmittingDispute(false); }
  };

  const handleSubmitComplaint = async () => {
    if (!complaintReason.trim()) return;
    setSubmittingComplaint(true);
    try {
      await http.post('/complaints', { orderId: Number(id), reason: complaintReason.trim() });
      showActionMsg('success', 'Tạo khiếu nại thành công! Xưởng sẽ xem xét.');
      setShowComplaintModal(false);
      setComplaintReason('');
    } catch (e: any) {
      showActionMsg('error', e?.response?.data?.message || 'Tạo khiếu nại thất bại');
    } finally { setSubmittingComplaint(false); }
  };

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
          
          {/* CỘT TRÁI: CHI TIẾT */}
          <div className="products-panel">
            <div className="panel-header">
              <h2>{order.orderType === "OUTSOURCING" ? "Chi tiết đơn gia công" : "Sản phẩm bàn giao"}</h2>
              {order.orderType !== "OUTSOURCING" && <span className="items-count">{order.items?.length || 0} mục</span>}
            </div>

            {order.orderType === "OUTSOURCING" ? (
              <div style={{ padding: 16 }}>
                {(order.designFileUrl || order.designFileUrlBack) && (
                  <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                    {order.designFileUrl && (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Mặt trước</div>
                        <img src={getImageUrl(order.designFileUrl)} alt="Mặt trước"
                          style={{ width: 140, height: 160, objectFit: "contain", borderRadius: 12, border: "1px solid #e5e7eb", background: "#f9fafb" }} />
                      </div>
                    )}
                    {order.designFileUrlBack && (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Mặt sau</div>
                        <img src={getImageUrl(order.designFileUrlBack)} alt="Mặt sau"
                          style={{ width: 140, height: 160, objectFit: "contain", borderRadius: 12, border: "1px solid #e5e7eb", background: "#f9fafb" }} />
                      </div>
                    )}
                  </div>
                )}
                <div style={{ marginBottom: 12 }}>
                  <span style={{ color: "#6b7280", fontSize: 13 }}><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>factory</span> Xưởng: </span>
                  <strong>{order.factoryName || "Đang cập nhật"}</strong>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ color: "#6b7280", fontSize: 13 }}>💰 Đơn giá: </span>
                  <strong>{formatVND(order.totalAmount)} / {order.items?.[0]?.quantity || "—"} áo</strong>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ color: "#6b7280", fontSize: 13 }}>💵 Đã cọc (30%): </span>
                  <strong style={{ color: "#f59e0b" }}>{formatVND(order.depositAmount)}</strong>
                </div>
                <div style={{ marginBottom: 12, padding: 12, background: "#fef3c7", borderRadius: 8 }}>
                  <span style={{ color: "#92400e", fontSize: 13 }}>Còn phải thanh toán: </span>
                  <strong style={{ color: "#d97706", fontSize: 18 }}>{formatVND((order.finalAmount || order.totalAmount) - (order.depositAmount || 0))}</strong>
                </div>
                {order.note && (
                  <div style={{ marginTop: 12, padding: 12, background: "#f9fafb", borderRadius: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>Ghi chú: </span>
                    <span style={{ fontSize: 14, color: "#4b5563" }}>{order.note}</span>
                  </div>
                )}
              </div>
            ) : (
            <div className="products-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {order.items && order.items.map((item, index) => (
                <div key={item.id || index} className="product-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "16px", borderBottom: "1px solid #f3f4f6" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <img
                      className="product-thumb"
                      src={getImageUrl(item.productImage) || "https://placehold.co/60x60?text=No+Img"}
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
                      {item.attributes && (
                        <span style={{ display: "block", fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                          {item.attributes}
                        </span>
                      )}
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
                    {order.status === "COMPLETED" && item.productId && (
                      reviewedProductIds.has(item.productId) ? (
                        <span style={{
                          marginTop: 6, padding: "4px 12px", background: "#d1fae5", color: "#065f46",
                          borderRadius: 6, fontSize: 12, fontWeight: 500, display: "inline-block"
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span> Đã đánh giá
                        </span>
                      ) : (
                        <button
                          onClick={() => setReviewModal({ productId: item.productId!, productName: item.productName })}
                          style={{
                            marginTop: 6, padding: "4px 12px", background: "#f59e0b", color: "white",
                            border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 500
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>star</span> Đánh giá
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
            )}

            {/* Ghi chú (cho ready-made) */}
            {order.orderType !== "OUTSOURCING" && order.note && (
              <div style={{ marginTop: "20px", padding: "16px", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                <h5 style={{ margin: "0 0 6px 0", color: "#374151", fontWeight: "600" }}>Ghi chú từ khách hàng:</h5>
                <p style={{ margin: 0, fontSize: "14px", color: "#4b5563", fontStyle: "italic" }}>"{order.note}"</p>
              </div>
            )}

            {/* ── TRANH CHẤP & KHIẾU NẠI ── */}
            <div style={{ marginTop: "24px", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "#1e293b", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                <Gavel size={18} style={{ color: "#475569" }} /> Hành động bổ sung
              </h4>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  onClick={() => setShowDisputeModal(true)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "8px 16px", background: "#fef2f2", color: "#991b1b",
                    border: "1px solid #fecaca", borderRadius: "8px", cursor: "pointer",
                    fontSize: "13px", fontWeight: "500"
                  }}
                >
                  <Gavel size={16} /> Tạo tranh chấp
                </button>
                <button
                  onClick={() => setShowComplaintModal(true)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "8px 16px", background: "#fffbeb", color: "#92400e",
                    border: "1px solid #fcd34d", borderRadius: "8px", cursor: "pointer",
                    fontSize: "13px", fontWeight: "500"
                  }}
                >
                  <FileWarning size={16} /> Tạo khiếu nại
                </button>
              </div>
              <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
                Tranh chấp → Admin giải quyết. Khiếu nại → Xưởng & Admin giải quyết.
              </p>
            </div>
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

            {/* Thẻ thông tin xưởng may */}
            {order.factoryId && (
              <div className="support-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                  <div className="support-icon">
                    <MessageCircle size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}><span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle' }}>factory</span> {order.factoryName || 'Xưởng may'}</h4>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>Xưởng sản xuất đơn hàng này</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <Link
                    to={`/factory-profile/${order.factoryId}`}
                    style={{
                      flex: 1, textAlign: 'center', padding: '8px 0', background: '#0037b0',
                      color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 500
                    }}
                  >
                    📋 Xem hồ sơ xưởng
                  </Link>
                  <button
                    onClick={() => alert(`Tính năng chat với xưởng đang được cập nhật!`)}
                    style={{
                      flex: 1, padding: '8px 0', background: 'white', color: '#0037b0',
                      border: '1px solid #0037b0', borderRadius: '8px', cursor: 'pointer', fontSize: '14px'
                    }}
                  >
                    💬 Chat với xưởng
                  </button>
                </div>
              </div>
            )}

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
              {order.depositAmount > 0 && (
                <div>
                  <span>Còn phải thanh toán</span>
                  <span style={{ color: "#d97706", fontWeight: "700" }}>
                    {formatVND((order.finalAmount || order.totalAmount) - (order.depositAmount || 0))}
                  </span>
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

      {/* Review Modal */}
      {reviewModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setReviewModal(null)}>
          <div style={{ background: "white", borderRadius: 16, padding: 32, width: "100%", maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 20px" }}>Đánh giá: {reviewModal.productName}</h3>
            <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} style={{ fontSize: 32, cursor: "pointer" }} onClick={() => setReviewRating(s)}>
                  {s <= reviewRating ? <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#f59e0b' }}>star</span> : <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#d1d5db' }}>star</span>}
                </span>
              ))}
            </div>
            <textarea placeholder="Chia sẻ trải nghiệm của bạn..." value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)} rows={4}
              style={{ width: "100%", padding: 12, border: "1px solid #ddd", borderRadius: 8, fontFamily: "inherit", resize: "vertical" }} />
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button onClick={handleSubmitReview} disabled={submittingReview || !reviewComment.trim()}
                style={{ padding: "10px 24px", background: "#ee4d2d", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
                {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
              <button onClick={() => setReviewModal(null)}
                style={{ padding: "10px 24px", background: "white", color: "#666", border: "1px solid #ccc", borderRadius: 8, cursor: "pointer" }}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Message Toast */}
      {actionMsg && (
        <div style={{
          position: "fixed", top: 16, right: 16, zIndex: 9999, padding: "12px 20px", borderRadius: 10,
          fontWeight: 500, fontSize: "0.9rem", boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          background: actionMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
          color: actionMsg.type === 'success' ? '#065f46' : '#991b1b',
          border: actionMsg.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca'
        }}>
          {actionMsg.text}
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowDisputeModal(false)}>
          <div style={{ background: "white", borderRadius: 16, padding: 32, width: "100%", maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 8px", display: "flex", alignItems: "center", gap: 8 }}>
              <Gavel size={20} style={{ color: "#dc2626" }} /> Tạo tranh chấp
            </h3>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px" }}>
              Đơn hàng #{id} - Tranh chấp sẽ được Admin xem xét và đưa ra phán quyết.
            </p>
            <textarea placeholder="Mô tả vấn đề tranh chấp..." value={disputeDesc}
              onChange={(e) => setDisputeDesc(e.target.value)} rows={4}
              style={{ width: "100%", padding: 12, border: "1px solid #ddd", borderRadius: 8, fontFamily: "inherit", resize: "vertical" }} />
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button onClick={handleSubmitDispute} disabled={submittingDispute || !disputeDesc.trim()}
                style={{ padding: "10px 24px", background: "#dc2626", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
                {submittingDispute ? "Đang gửi..." : "Gửi tranh chấp"}
              </button>
              <button onClick={() => setShowDisputeModal(false)}
                style={{ padding: "10px 24px", background: "white", color: "#666", border: "1px solid #ccc", borderRadius: 8, cursor: "pointer" }}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Modal */}
      {showComplaintModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowComplaintModal(false)}>
          <div style={{ background: "white", borderRadius: 16, padding: 32, width: "100%", maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 8px", display: "flex", alignItems: "center", gap: 8 }}>
              <FileWarning size={20} style={{ color: "#d97706" }} /> Tạo khiếu nại
            </h3>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px" }}>
              Đơn hàng #{id} - Khiếu nại sẽ được xưởng và Admin cùng giải quyết.
            </p>
            <textarea placeholder="Mô tả lý do khiếu nại..." value={complaintReason}
              onChange={(e) => setComplaintReason(e.target.value)} rows={4}
              style={{ width: "100%", padding: 12, border: "1px solid #ddd", borderRadius: 8, fontFamily: "inherit", resize: "vertical" }} />
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button onClick={handleSubmitComplaint} disabled={submittingComplaint || !complaintReason.trim()}
                style={{ padding: "10px 24px", background: "#d97706", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
                {submittingComplaint ? "Đang gửi..." : "Gửi khiếu nại"}
              </button>
              <button onClick={() => setShowComplaintModal(false)}
                style={{ padding: "10px 24px", background: "white", color: "#666", border: "1px solid #ccc", borderRadius: 8, cursor: "pointer" }}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}