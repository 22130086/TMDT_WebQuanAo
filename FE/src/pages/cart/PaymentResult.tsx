import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "../../styles/payment-result.css";

const PaymentResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [success, setSuccess] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");
  const [orderTotal, setOrderTotal] = useState<number | null>(null);
  const [paymentMethod] = useState<string>("VNPAY");
  const [loading, setLoading] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(10);

  const formatVND = (value: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  useEffect(() => {
    // Đọc tham số từ URL Query string do PaymentController của Backend điều hướng về
    const queryParams = new URLSearchParams(location.search);
    const statusParam = queryParams.get("status");
    const idParam = queryParams.get("orderId");
    const amountParam = queryParams.get("amount");
    const reasonParam = queryParams.get("reason");

    if (statusParam) {
      const isSuccess = statusParam === "success";
      setSuccess(isSuccess);
      setOrderId(idParam || "Không rõ");
      
      // VNPAY trả về amount nhân 100 nên ta chia lại cho 100 để hiển thị chuẩn số tiền thực tế
      if (amountParam) {
        setOrderTotal(Number(amountParam) / 100);
      }
      
      if (isSuccess) {
        setMessage("Giao dịch thanh toán trực tuyến qua cổng VNPAY đã được ghi nhận thành công.");
      } else {
        setMessage(`Giao dịch thất bại hoặc bị hủy bỏ. Lý do từ hệ thống: ${reasonParam || "Hủy giữa chừng"}`);
      }
      setLoading(false);
    } else {
      // Dự phòng nếu có luồng chuyển nội bộ bằng State của React Router
      if (location.state) {
        const state = location.state as any;
        setSuccess(!!state.success);
        setMessage(state.message || "");
        setOrderId(state.orderId || "");
        setOrderTotal(state.orderTotal || null);
        setLoading(false);
      } else {
        // Trường hợp truy cập trực tiếp không hợp lệ
        setSuccess(false);
        setMessage("Không tìm thấy thông tin kết quả giao dịch hợp lệ.");
        setLoading(false);
      }
    }
  }, [location]);

  // Luồng đếm ngược tự động chuyển trang
  useEffect(() => {
    if (loading || success === null) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Nếu thành công thì đẩy khách về trang chi tiết đơn hàng, thất bại đưa về lịch sử đơn/giỏ hàng
          if (success && orderId && orderId !== "Không rõ") {
            navigate(`/order-detail/${orderId}`);
          } else {
            navigate("/cart");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, success, orderId, navigate]);

  if (loading) {
    return (
      <div className="payment-result-page">
        <Header />
        <div className="loading-container" style={{ padding: "100px", textAlign: "center" }}>
          <h2>Đang kiểm tra kết quả giao dịch thanh toán...</h2>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="payment-result-page">
      <Header />
      
      <div className="result-container">
        <div className={`result-card ${success ? "card-success" : "card-failure"}`}>
          {/* Biểu tượng trạng thái hình ảnh động */}
          <div className="result-icon-wrapper">
            {success ? (
              <div className="success-icon">
                <svg viewBox="0 0 52 52">
                  <circle className="success-circle" cx="26" cy="26" r="25" fill="none" />
                  <path className="success-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                </svg>
              </div>
            ) : (
              <div className="failure-icon">
                <svg viewBox="0 0 52 52">
                  <circle className="failure-circle" cx="26" cy="26" r="25" fill="none" />
                  <path className="failure-cross" fill="none" d="M16 16 36 36 M36 16 16 36" />
                </svg>
              </div>
            )}
          </div>

          <h2 className="result-title">
            {success ? "Thanh Toán Thành Công!" : "Thanh Toán Thất Bại"}
          </h2>
          
          <p className="result-message">{message}</p>

          {/* Khối chi tiết giao dịch */}
          <div className="result-details">
            <div className="details-row">
              <span className="details-label">Mã đơn hàng:</span>
              <span className="details-value font-mono">#{orderId}</span>
            </div>
            
            {orderTotal !== null && (
              <div className="details-row">
                <span className="details-label">Số tiền đã thanh toán:</span>
                <span className="details-value price-highlight">{formatVND(orderTotal)}</span>
              </div>
            )}

            <div className="details-row">
              <span className="details-label">Phương thức thanh toán:</span>
              <span className="details-value">{paymentMethod}</span>
            </div>

            <div className="details-row">
              <span className="details-label">Trạng thái hệ thống:</span>
              <span className={`status-badge ${success ? "badge-success" : "badge-failure"}`}>
                {success ? "Giao dịch hoàn tất" : "Giao dịch thất bại"}
              </span>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="result-actions">
            {success && orderId !== "Không rõ" ? (
              <Link to={`/order-detail/${orderId}`} className="btn btn-primary">Xem chi tiết đơn hàng</Link>
            ) : (
              <Link to="/cart" className="btn btn-primary">Quay lại giỏ hàng</Link>
            )}
            <Link to="/products" className="btn btn-secondary">Tiếp tục mua sắm</Link>
          </div>

          {/* Dòng đếm ngược tự động điều hướng */}
          <p className="countdown-text">
            Hệ thống sẽ tự động chuyển trang sau <strong className="countdown-num">{countdown}</strong> giây.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PaymentResult;