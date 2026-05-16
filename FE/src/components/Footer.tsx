import "../styles/footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-brand">
          <h3>AZURE INDUSTRIAL</h3>

          <p>
            Nền tảng kết nối xưởng may và khách hàng
            hiện đại nhất Việt Nam.
          </p>
        </div>

        <div className="footer-links">
          <div>
            <h4>Hệ thống</h4>
            <a href="#">Trang chủ</a>
            <a href="#">Xưởng may</a>
            <a href="#">Sản phẩm</a>
          </div>

          <div>
            <h4>Hỗ trợ</h4>
            <a href="#">Điều khoản</a>
            <a href="#">Bảo mật</a>
            <a href="#">Liên hệ</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 AZURE INDUSTRIAL. All rights reserved.
      </div>
    </footer>
  );
}