import Header from "../components/Header";
import Footer from "../components/Footer";

import "../styles/custom-order.css";

export default function CustomOrder() {
  return (
    <>
      <Header />

      <div className="custom-order-page">

        {/* HERO */}
        <section className="custom-hero">

          <div className="hero-left">

            <span className="hero-badge">
              DỊCH VỤ IN ÁO CHUYÊN NGHIỆP
            </span>

            <h1>
              Đặt In Áo Theo Yêu Cầu
            </h1>

            <p>
              Kết nối trực tiếp với xưởng may uy tín toàn quốc.
              In logo, đồng phục công ty, lớp học, local brand
              với quy trình chuyên nghiệp.
            </p>

            <div className="hero-rating">
              ⭐ 5.0 • 2K+ đơn hoàn thành
            </div>

          </div>

          <div className="hero-right">

            <img
              src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200"
              alt="custom shirt"
            />

          </div>

        </section>

        {/* PRODUCT TYPE */}
        <section className="custom-card">

          <div className="section-title">
            Kiểu dáng sản phẩm
          </div>

          <div className="type-grid">

            <button className="type-item active">
              <span>👕</span>
              T-Shirt
            </button>

            <button className="type-item">
              <span>👔</span>
              Polo
            </button>

            <button className="type-item">
              <span>🧥</span>
              Hoodie
            </button>

            <button className="type-item">
              <span>🥋</span>
              Oversize
            </button>

          </div>

        </section>

        {/* COLOR */}
        <section className="custom-card">

          <div className="section-title">
            Chọn màu áo
          </div>

          <div className="color-list">

            <button className="color-item blue active"></button>

            <button className="color-item black"></button>

            <button className="color-item white"></button>

            <button className="color-item red"></button>

          </div>

        </section>

        {/* SIZE */}
        <section className="custom-card">

          <div className="section-title">
            Số lượng theo size
          </div>

          <div className="size-table">

            <div className="size-head">S</div>
            <div className="size-head">M</div>
            <div className="size-head">L</div>
            <div className="size-head">XL</div>

            <input type="number" defaultValue={10} />
            <input type="number" defaultValue={15} />
            <input type="number" defaultValue={8} />
            <input type="number" defaultValue={5} />

          </div>

        </section>

        {/* UPLOAD */}
        <section className="custom-card">

          <div className="section-title">
            Upload thiết kế logo
          </div>

          <div className="upload-box">

            <div className="upload-icon">
              ⬆
            </div>

            <h3>
              Tải lên file thiết kế
            </h3>

            <p>
              Hỗ trợ PNG, JPG, PDF, AI
            </p>

            <button>
              Chọn file
            </button>

          </div>

        </section>

        {/* POSITION */}
        <section className="custom-card">

          <div className="section-title">
            Vị trí in logo
          </div>

          <div className="position-grid">

            <button>
              Mặt trước
            </button>

            <button>
              Mặt sau
            </button>

            <button className="active">
              Cả hai mặt
            </button>

          </div>

        </section>

        {/* FACTORY REQUEST */}
        <section className="custom-card">

          <div className="section-title">
            Yêu cầu gửi đến xưởng may
          </div>

          <div className="form-group">

            <label>
              Ghi chú sản xuất
            </label>

            <textarea
              placeholder="VD: Cổ áo may bo dệt, in lụa mềm..."
            ></textarea>

          </div>

          <div className="form-group">

            <label>
              Địa chỉ giao hàng
            </label>

            <input
              type="text"
              placeholder="Nhập địa chỉ của bạn"
            />

          </div>

          <div className="two-col">

            <div className="form-group">

              <label>
                Hạn chót nhận hàng
              </label>

              <input type="date" />

            </div>

            <div className="priority-box">

              <span>
                Ưu tiên gấp
              </span>

              <label className="switch">

                <input type="checkbox" />

                <span className="slider"></span>

              </label>

            </div>

          </div>

        </section>

        {/* MOCKUP */}
        <section className="custom-showcase">

          <div className="showcase-header">

            <h2>
              Dự án đã thực hiện
            </h2>

            <span>
              Xem tất cả →
            </span>

          </div>

          <div className="showcase-list">

            <div className="showcase-card">

              <img
                src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200"
                alt=""
              />

              <div className="showcase-info">

                <h4>
                  Đồng phục công ty
                </h4>

                <p>
                  Cotton 100% - In lụa
                </p>

              </div>

            </div>

            <div className="showcase-card">

              <img
                src="https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1200"
                alt=""
              />

              <div className="showcase-info">

                <h4>
                  Áo local brand
                </h4>

                <p>
                  Oversize - DTG
                </p>

              </div>

            </div>

            <div className="showcase-card">

              <img
                src="https://images.unsplash.com/photo-1527719327859-c6ce80353573?q=80&w=1200"
                alt=""
              />

              <div className="showcase-info">

                <h4>
                  Hoodie nhóm
                </h4>

                <p>
                  Nỉ bông cao cấp
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* CTA */}
        <div className="sticky-cta">

          <button>
            GỬI YÊU CẦU BÁO GIÁ →
          </button>

        </div>

      </div>

      <Footer />
    </>
  );
}