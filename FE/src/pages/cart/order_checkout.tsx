import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import http from "../../services/http.ts"; // Đường dẫn file axios của bạn
import { deleteCartItem } from "../../services/cartService"; // 🌟 Import hàm xóa item giỏ hàng từ service của bạn
import { customerService } from "../../services/customerService";
import "../../styles/order_checkout.css";
import Header from "../../components/Header.tsx";
import Footer from "../../components/Footer.tsx";

const OrderCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // HỨNG DỮ LIỆU TỪ GIỎ HÀNG TRUYỀN SANG
  const { checkoutItems = [], totalAmount = 0, shippingFee = 0 } = location.state || {};

  // STATE QUẢN LÝ PHƯƠNG THỨC THANH TOÁN
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [isProcessing, setIsProcessing] = useState(false);

  // 🌟 STATE QUẢN LÝ THÔNG TIN NHẬN HÀNG (KHÔNG CÒN CỨNG NỮA)
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [note, setNote] = useState("");

  // HÀM ĐẶT HÀNG GỌI API BACKEND
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await customerService.getProfile();
        if (response?.success && response.data) {
          const profile = response.data;
          setReceiverName(profile.fullName || "");
          setReceiverPhone(profile.phone || "");
          setShippingAddress(profile.address || "");
        }
      } catch (error) {
        console.error("Lỗi khi tải hồ sơ người dùng:", error);
      }
    };

    loadUserProfile();
  }, []);

  const handlePlaceOrder = async () => {
    if (checkoutItems.length === 0) {
      alert("Không có sản phẩm nào để thanh toán!");
      return;
    }
    if (!receiverName.trim() || !receiverPhone.trim() || !shippingAddress.trim()) {
      alert("Vui lòng điền đầy đủ Thông tin nhận hàng và Địa chỉ!");
      return;
    }

    setIsProcessing(true);
    try {
      // Chuẩn bị payload động lấy hoàn toàn từ các ô Input
      const orderPayload = {
        factoryId: checkoutItems[0]?.factoryId || 1, 
        orderType: "READY_MADE",
        paymentMethod: paymentMethod, 
        receiverName: receiverName,       // 🌟 Dữ liệu động từ state
        receiverPhone: receiverPhone,     // 🌟 Dữ liệu động từ state
        shippingAddress: shippingAddress, // 🌟 Dữ liệu động từ state
        note: note,                       // 🌟 Dữ liệu động từ state
        items: checkoutItems.map((item: any) => ({
          productId: item.productId || item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          attributes: item.attributes // 🌟 Lấy attributes từ cart sang
        }))
      };

      // 1. Gọi API tạo đơn hàng ở Backend
      const response = await http.post("/orders", orderPayload);
      const orderData = response.data?.data || response.data;

      // 2. 🌟 XÓA SẢN PHẨM KHỎI GIỎ HÀNG SAU KHI ĐẶT THÀNH CÔNG
      try {
        await Promise.all(
          checkoutItems.map((item: any) => deleteCartItem(item.id)) // item.id là ID dòng item trong giỏ
        );
      } catch (cartErr) {
        console.error("Lỗi khi xóa sản phẩm khỏi giỏ hàng:", cartErr);
        // Không chặn luồng chuyển trang của khách nếu xóa giỏ gặp lỗi mạng nhỏ
      }

      // 3. PHÂN NHÁNH ĐIỀU HƯỚNG THEO PHƯƠNG THỨC THANH TOÁN
      if (paymentMethod === "VNPAY" && orderData.paymentUrl) {
        window.location.href = orderData.paymentUrl;
      } else {
        navigate('/payment-result', {
          state: {
            success: true,
            message: "Đặt hàng thành công! Đơn hàng đang chờ xưởng xác nhận.",
            orderId: orderData.id || orderData.orderId,
            orderTotal: totalAmount + shippingFee,
            paymentMethod: paymentMethod
          }
        });
      }

    } catch (error: any) {
      console.error("Lỗi đặt hàng:", error);
      alert(error.response?.data?.message || "Đặt hàng thất bại. Vui lòng thử lại!");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatVND = (value: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  return (
    <div className="ordercheckout-page">
      <Header />
      <div className="ordercheckout-container">
        <h1 className="ordercheckout-title">Thanh Toán Đơn Hàng</h1>
        
        <div className="ordercheckout-grid">
          {/* Cột trái: Thông tin nhận hàng & Phương thức thanh toán */}
          <div className="ordercheckout-left">
            <div className="ordercheckout-card">
              <h3>Thông tin nhận hàng</h3>
              <div className="ordercheckout-form-group">
                <label>Người nhận hàng</label>
                <input 
                  type="text" 
                  value={receiverName} 
                  onChange={(e) => setReceiverName(e.target.value)} // Cho phép gõ nhập liệu
                  placeholder="Nhập tên người nhận" 
                />
              </div>

              <div className="ordercheckout-form-group">
                <label>Số điện thoại</label>
                <input 
                  type="text" 
                  value={receiverPhone} 
                  onChange={(e) => setReceiverPhone(e.target.value)} // Cho phép gõ nhập liệu
                  placeholder="Nhập số điện thoại" 
                />
              </div>

              <div className="ordercheckout-form-group">
                <label>Địa chỉ nhận hàng</label>
                <input 
                  type="text" 
                  value={shippingAddress} 
                  onChange={(e) => setShippingAddress(e.target.value)} // Cho phép gõ nhập liệu
                  placeholder="Nhập địa chỉ giao hàng" 
                />
              </div>
              <div className="ordercheckout-form-group">
                <label>Ghi chú đơn hàng</label>
                <input 
                  type="text" 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)} 
                  placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
                />
              </div>
            </div>

            <div className="ordercheckout-card">
              <h3>Phương thức thanh toán</h3>
              <div className="ordercheckout-payment-options">
                <label className={`ordercheckout-payment-item ${paymentMethod === "COD" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === "COD"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div>
                    <strong>Thanh toán khi nhận hàng (COD)</strong>
                    <p>Thanh toán bằng tiền mặt trực tiếp cho shipper khi nhận hàng</p>
                  </div>
                </label>

                <label className={`ordercheckout-payment-item ${paymentMethod === "VNPAY" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="VNPAY"
                    checked={paymentMethod === "VNPAY"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div>
                    <strong>Cổng thanh toán điện tử VNPay</strong>
                    <p>Thanh toán qua thẻ ATM, Thẻ quốc tế Visa/Master hoặc Quét mã QR</p>
                  </div>
                </label>
              </div>

              <button 
                className="ordercheckout-submit-btn" 
                onClick={handlePlaceOrder}
                disabled={isProcessing || checkoutItems.length === 0}
              >
                {isProcessing ? "Đang xử lý..." : paymentMethod === "VNPAY" ? "Thanh toán qua VNPAY" : "Xác nhận đặt đơn hàng"}
              </button>
            </div>
          </div>

          {/* Cột phải: Tóm tắt đơn hàng */}
          <div className="ordercheckout-right">
            <div className="ordercheckout-card">
              <h3>Chi tiết đơn hàng ({checkoutItems.length} sản phẩm)</h3>

              <div className="ordercheckout-product-list">
                {checkoutItems.map((item: any) => (
                  <div className="ordercheckout-product-item" key={item.id}>
                    <img src={item.productImage || item.image} alt={item.productName} />
                    <div>
                      <p style={{ margin: "0 0 4px 0" }}>{item.productName}</p>
                      {item.attributes && (
                        <span style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                          {item.attributes}
                        </span>
                      )}
                      <span>SL: {item.quantity} x {formatVND(item.price)}</span>
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