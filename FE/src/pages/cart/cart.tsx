import { useEffect, useState } from "react";
import "../../styles/cart.css";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

import {
  getCart,
  updateQuantity,
  deleteCartItem,
  type CartItem,
} from "../../services/cartService";
import { useNavigate } from "react-router-dom";
const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // STATE MỚI: Lưu danh sách ID các sản phẩm đang được tích chọn
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  // STATE MỚI: Lưu phí ship (Mặc định 0đ cho Standard)
  const [shippingFee, setShippingFee] = useState<number>(0);

  // LOAD CART
  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await getCart();
      const items = Array.isArray(response) ? response : (response?.data || []);
      setCartItems(items);
      // Tự động tích chọn tất cả sản phẩm khi vừa load xong
      setSelectedIds(items.map((item: CartItem) => item.id));
    } catch (error) {
      console.error("Lỗi load cart:", error);
    } finally {
      setLoading(false);
    }
  };

  // UPDATE QUANTITY
  const handleUpdateQuantity = async (id: number, quantity: number) => {
    
    if (quantity <= 0) return;

    const currentItem = cartItems.find(item => item.id === id);
    
    // BẤT NGỜ Ở ĐÂY: Hãy chắc chắn bạn lấy đúng Product ID độc lập với CartItem ID
    // Nếu trong dữ liệu của bạn có item.productName thì khả năng cao productId nằm ở item.productId hoặc item.product.id
    const productId = currentItem?.productId || currentItem?.productId; 
    console.log("Đang gửi lên Backend -> CartItemID:", id, "và ProductID:", productId);
    if (!productId) {
      console.error("Không tìm thấy Product ID!");
      return;
    }

    // Tạm thời tối ưu giao diện
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );

    try {
      // id ở đây phải là ID của dòng giỏ hàng (CartItem ID)
      await updateQuantity(id, quantity, productId); 
      window.dispatchEvent(new Event("cart-updated"));
    } catch (error) {
      console.error("Lỗi khi lưu số lượng xuống DB:", error);
      alert("Cập nhật số lượng thất bại! Đang đồng bộ lại giỏ hàng...");
      fetchCart(); 
    }
  };

  // DELETE ITEM
  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?")) return;
    try {
      await deleteCartItem(id);
      setCartItems((prev) => prev.filter((item) => item.id !== id));
      // Nếu xóa sản phẩm, gỡ luôn ID của nó khỏi danh sách đang chọn
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
      window.dispatchEvent(new Event("cart-updated"));
    } catch (error: any) {
      console.error("Lỗi khi xóa sản phẩm:", error);
      // Hiển thị chi tiết lỗi từ backend nếu có để dễ debug
      alert(
        error.response?.data?.message || 
        "Xóa sản phẩm thất bại! Vui lòng thử lại sau."
      );
    }
  };

  // HÀM MỚI: Xử lý khi bấm nút "Chọn tất cả"
  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedIds(cartItems.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  // HÀM MỚI: Xử lý khi tích/bỏ tích 1 sản phẩm cụ thể
  const handleSelectItem = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id) // Bỏ chọn
        : [...prev, id] // Chọn thêm
    );
  };

  // TÍNH TOÁN TIỀN (Chỉ tính các sản phẩm nằm trong mảng selectedIds)
  const selectedItems = (cartItems || []).filter((item) =>
    selectedIds.includes(item.id)
  );
  
  const totalPrice = selectedItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Nếu không có sản phẩm nào được chọn thì tổng thanh toán = 0 (không cộng phí ship)
  const finalTotal = totalPrice > 0 ? totalPrice + shippingFee : 0;
  
const handleProceedToCheckout = () => {
    // 1. Lọc ra đúng những sản phẩm mà user đã tick chọn
    const checkoutItems = cartItems.filter(item => selectedIds.includes(item.id));

    // 2. Tính tổng tiền của những sản phẩm được tick đó
    const itemsTotal = checkoutItems.reduce(
      (total, item) => total + (item.price * item.quantity), 
      0
    );

    const totalAmount = itemsTotal;
    // 3. Chuyển hướng và xách theo dữ liệu sang OrderCheckout
    navigate("/order-checkout", {
      state: {
        checkoutItems: checkoutItems,
        totalAmount: totalAmount,
        shippingFee: shippingFee
        
      }
    });
  };
  return (
    <main className="cart-page">
      <Header />

      <div className="cart-container">
        <div className="cart-layout">
          {/* LEFT */}
          <div className="cart-left">
            <h1 className="cart-title">GIỎ HÀNG CỦA BẠN</h1>

            <div className="select-all-box">
              <label className="select-all-label">
                <input
                  type="checkbox"
                  // Checked khi số lượng chọn bằng tổng số lượng giỏ hàng
                  checked={
                    selectedIds.length === cartItems.length &&
                    cartItems.length > 0
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <span>Chọn tất cả sản phẩm</span>
              </label>
            </div>

            <div className="cart-items">
              {loading ? (
                <p>Đang tải giỏ hàng...</p>
              ) : !cartItems || cartItems.length === 0 ? (
                <p>Giỏ hàng trống</p>
              ) : (
                cartItems.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <input
                      type="checkbox"
                      className="cart-checkbox"
                      // Trạng thái checkbox phụ thuộc vào việc ID có trong mảng selectedIds không
                      checked={selectedIds.includes(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                    />

                    <div className="cart-image">
                      <img src={item.image} alt={item.productName} />
                    </div>

                    <div className="cart-content">
                      <div className="cart-item-top">
                        <h3>{item.productName}</h3>
                        <span className="price">
                          {item.price.toLocaleString("vi-VN")}đ
                        </span>
                      </div>

                      <div className="cart-actions">
                        <div className="quantity-box">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity - 1)
                            }
                          >
                            -
                          </button>
                          <input type="text" value={item.quantity} readOnly />
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                        
                        {/* HIỂN THỊ TỔNG TIỀN CỦA SẢN PHẨM NÀY (Subtotal) */}
                        <div className="item-subtotal">
                          <strong>
                            Tổng: {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                          </strong>
                        </div>

                        <div className="item-buttons">
                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(item.id)}
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="cart-right">
            <div className="summary-box">
              <h2>TÓM TẮT ĐƠN HÀNG</h2>

              <div className="summary-list">
                <div>
                  <span>Tổng tiền hàng</span>
                  <span>{totalPrice.toLocaleString("vi-VN")}đ</span>
                </div>

                <div>
                  <span>Giảm giá</span>
                  <span className="discount">0đ</span>
                </div>

                <div>
                  <span>Phí vận chuyển</span>
                  <span>{shippingFee.toLocaleString("vi-VN")}đ</span>
                </div>
              </div>

              <div className="total-box">
                <span>Tổng thanh toán:</span>
                <h3>{finalTotal.toLocaleString("vi-VN")}đ</h3>
              </div>

              <div className="voucher-box">
                <label>Mã giảm giá</label>
                <div className="voucher-input">
                  <input type="text" placeholder="Nhập mã giảm giá" />
                  <button>Áp dụng</button>
                </div>
              </div>

              <div className="shipping-box">
                <label className={`shipping-option ${shippingFee === 0 ? "active" : ""}`}>
                  <div>
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingFee === 0}
                      onChange={() => setShippingFee(0)} // Trở về 0đ
                    />
                    <div>
                      <p>Standard</p>
                      <span>3–5 ngày làm việc</span>
                    </div>
                  </div>
                  <strong>Miễn phí</strong>
                </label>

                <label className={`shipping-option ${shippingFee === 50000 ? "active" : ""}`}>
                  <div>
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingFee === 50000}
                      onChange={() => setShippingFee(50000)} // Cộng thêm 50k
                    />
                    <div>
                      <p>Express</p>
                      <span>1–2 ngày làm việc</span>
                    </div>
                  </div>
                  <strong>50,000đ</strong>
                </label>
              </div>

              <button className="checkout-btn" disabled={selectedIds.length === 0} onClick={handleProceedToCheckout}>
                Tiến hành thanh toán
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default Cart;