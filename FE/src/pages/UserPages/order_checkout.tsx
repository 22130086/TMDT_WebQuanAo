import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import http from "../../services/http.ts"; // Thay bằng đường dẫn file axios của bạn
import "../../styles/order_checkout.css";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const OrderCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. HỨNG DỮ LIỆU TỪ GIỎ HÀNG TRUYỀN SANG
  // Nếu user vào thẳng link /checkout mà không qua giỏ hàng, ta gán mảng rỗng để chống lỗi
  const { checkoutItems = [], totalAmount = 0 } = location.state || {};

  // Giả lập logic tính toán (tùy vào nghiệp vụ của bạn: thanh toán 100% hay tạm ứng)
  const advancePayment = totalAmount; // Giả sử thanh toán 100% khi đặt hàng
  const shippingFee = 0;

  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [isProcessing, setIsProcessing] = useState(false);

  // 2. HÀM ĐẶT HÀNG GỌI API BACKEND
  const handlePlaceOrder = async () => {
    if (checkoutItems.length === 0) {
      alert("Không có sản phẩm nào để thanh toán!");
      return;
    }

    setIsProcessing(true);
    try {
      // Dữ liệu gửi xuống Backend dựa theo OrderRequest của bạn.
      // Lưu ý: Cần điều chỉnh object này cho khớp 100% với các trường trong file OrderRequest.java
      const orderPayload = {
        paymentMethod: paymentMethod,
        note: "Đơn hàng từ website",
        // Nếu API tự đọc giỏ hàng của user đang đăng nhập thì không cần truyền mảng items.
        // Nếu API bắt buộc truyền list sản phẩm, bạn map từ checkoutItems ra đây.
      };

      const response = await http.post("/api/orders", orderPayload);

      if (response.data.success) {
        alert("Đặt hàng thành công!");
        navigate("/orders"); // Chuyển về trang lịch sử đơn hàng
      }
    } catch (error) {
      console.error("Lỗi khi đặt hàng:", error);
      alert("Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại!");
    } finally {
      setIsProcessing(false);
    }
  };

  // Hàm format tiền tệ VNĐ
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  return (
    <div className="ordercheckout-page">
      <Header />
      <div className="ordercheckout-container">
        {/* Status Banner */}
        <div className="ordercheckout-status-banner">
          <div className="ordercheckout-status-left">
            <div className="ordercheckout-status-icon">
              <span className="material-symbols-outlined">shopping_cart_checkout</span>
            </div>
            <div>
              <h2>Xác nhận đặt hàng</h2>
              <p>Vui lòng kiểm tra lại thông tin sản phẩm và chọn phương thức thanh toán.</p>
            </div>
          </div>
        </div>

        <div className="ordercheckout-grid">
          {/* Left - Payment Methods */}
          <div className="ordercheckout-left">
            <div className="ordercheckout-summary-grid">
              <div className="ordercheckout-summary-card">
                <p>Tổng giá trị đơn hàng</p>
                <h3>{formatVND(totalAmount)}</h3>
              </div>
              <div className="ordercheckout-highlight">
                <div>
                  <p>Số tiền cần thanh toán</p>
                  <h2>{formatVND(advancePayment + shippingFee)}</h2>
                </div>
                <span className="material-symbols-outlined ordercheckout-highlight-icon">
                  payments
                </span>
              </div>
            </div>

            <div className="ordercheckout-payment-box">
            <h3>
                <span className="material-symbols-outlined">account_balance_wallet</span>
                Phương thức thanh toán
            </h3>

            <div className="ordercheckout-method-list">
                {/* 1. Phương thức Chuyển khoản (Có sẵn) */}
                <label className={`ordercheckout-method ${paymentMethod === "BANK_TRANSFER" ? "active" : ""}`}>
                <input type="radio" name="payment" 
                    checked={paymentMethod === "BANK_TRANSFER"} 
                    onChange={() => setPaymentMethod("BANK_TRANSFER")} 
                />
                <div className="ordercheckout-method-content">
                    <div className="ordercheckout-method-icon">
                    <span className="material-symbols-outlined">qr_code_2</span>
                    </div>
                    <div>
                    <p>Chuyển khoản / QR Code</p>
                    <span>Xử lý tự động trong 30 giây</span>
                    </div>
                </div>
                </label>
                
                {/* 2. Phương thức Thanh toán khi nhận hàng (COD) */}
                <label className={`ordercheckout-method ${paymentMethod === "COD" ? "active" : ""}`}>
                <input type="radio" name="payment" 
                    checked={paymentMethod === "COD"} 
                    onChange={() => setPaymentMethod("COD")} 
                />
                <div className="ordercheckout-method-content">
                    <div className="ordercheckout-method-icon">
                    <span className="material-symbols-outlined">local_shipping</span>
                    </div>
                    <div>
                    <p>Thanh toán khi nhận hàng (COD)</p>
                    <span>Thanh toán bằng tiền mặt khi giao hàng</span>
                    </div>
                </div>
                </label>
            </div>

            <button 
                className="ordercheckout-confirm-btn" 
                onClick={handlePlaceOrder}
                disabled={isProcessing}
            >
                {isProcessing ? "Đang xử lý..." : `Xác nhận ${paymentMethod === "COD" ? "Đặt hàng" : "Thanh toán"} ${formatVND(advancePayment + shippingFee)}`}
            </button>
            </div>
          </div>

          {/* Right - Order Details */}
          <div className="ordercheckout-right">
            <div className="ordercheckout-detail-card">
              <h3>Chi tiết đơn hàng ({checkoutItems.length} sản phẩm)</h3>

              <div className="ordercheckout-product-list">
                {/* 3. ĐỔ DỮ LIỆU ĐỘNG TỪ MẢNG CHECKOUT ITEMS */}
                {checkoutItems.map((item: any) => (
                  <div className="ordercheckout-product-item" key={item.id}>
                    <img src={item.productImage || item.image} alt={item.productName} />
                    <div>
                      <p>{item.productName}</p>
                      <span>SL: {item.quantity}</span>
                      <h4>{formatVND(item.price * item.quantity)}</h4>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ordercheckout-price-summary">
                <div>
                  <span>Tổng tiền hàng</span>
                  <strong>{formatVND(totalAmount)}</strong>
                </div>
                <div>
                  <span>Phí vận chuyển</span>
                  <strong>{formatVND(shippingFee)}</strong>
                </div>
                <div className="ordercheckout-final-total">
                  <span>Cần thanh toán</span>
                  <strong>{formatVND(totalAmount + shippingFee)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OrderCheckout;