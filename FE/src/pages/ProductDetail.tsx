// product_detail.tsx
import "../styles/product-detail.css";

import Header from "../components/Header";
import Footer from "../components/Footer";

const ProductDetail = () => {
    return (
        <main className="product-page">
            <Header />
            {/* Breadcrumbs */}
            <nav className="breadcrumbs">
                <a href="#">Trang chủ</a>
                <span>›</span>
                <a href="#">Đồng phục công ty</a>
                <span>›</span>
                <span className="active">Áo thun in logo</span>
            </nav>

            {/* Product Main */}
            <div className="product-layout">
                {/* Gallery */}
                <div className="gallery-section">
                    <div className="main-image">
                        <img
                            src="https://image.hm.com/assets/hm/3a/c8/3ac881ff5e620230769ddd60e0c06e91d358d2d8.jpg?imwidth=2160"
                            alt="Main product"
                        />
                    </div>

                    <div className="thumbnail-grid">
                        <img
                            src="https://image.hm.com/assets/hm/3a/c8/3ac881ff5e620230769ddd60e0c06e91d358d2d8.jpg?imwidth=2160"
                            alt=""
                        />
                        <img
                            src="https://image.hm.com/assets/hm/79/4f/794f4bfa8602e34ca5474266fbe78f38a17965b9.jpg?imwidth=2160"
                            alt=""
                        />
                        <img
                            src="https://image.hm.com/assets/hm/60/70/6070e02134457c87e7ec92ced08ef3f5328cec19.jpg?imwidth=2160"
                            alt=""
                        />
                        <img
                            src="https://image.hm.com/assets/hm/79/4f/794f4bfa8602e34ca5474266fbe78f38a17965b9.jpg?imwidth=2160"
                            alt=""
                        />
                        <img
                            src="https://image.hm.com/assets/hm/60/70/6070e02134457c87e7ec92ced08ef3f5328cec19.jpg?imwidth=2160"
                            alt=""
                        />
                    </div>
                </div>

                {/* Product Info */}
                <div className="product-info">
                    <div>
                        <h1>
                            Áo thun đồng phục in logo theo yêu cầu – Xưởng giá gốc
                        </h1>

                        <div className="rating-row">
                            <span className="rating">⭐ 4.9</span>
                            <span>320 đánh giá</span>
                            <span>1.2k đã bán</span>
                        </div>
                    </div>

                    <div className="price-box">
                        <h2>95.000đ – 150.000đ</h2>
                    </div>

                    {/* Shirt Types */}
                    <div className="section">
                        <label>Loại áo</label>

                        <div className="shirt-grid">
                            <div className="shirt-card active">
                                <img
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxVg5SDRVJsKwuLFldCAROK610G5g4PBgdpwakShOZlYm9jgYZMA2wBoWakL2gtFoSzpVA0_TZirZHqZKCGvrqCj3FONJooyGmqmcYayiPKAXWbA9tHReqJekTJNLRpbyWL4VQj6VsXnu-NjULf_zSiTJrfhwoMGL5ujsiD3O9uRYxKLS6PDK0T6Jiw15H2Dezwg3lm7pd0KYEruZwQSVPKZXCv5bdpVvUrppbjys_j-yoYETcmX_DuW43Z94J1_cN19Azl01NSaTh"
                                    alt=""
                                />
                                <p>T-shirt</p>
                            </div>

                            <div className="shirt-card">
                                <img
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZGs5aN0dmN5hg6n_UDdnPyPQB2rP1yJ15omuUmoiWuBcAaQ3CVQjpN5Kgm18Uu4NixrX0XFJqZjf2STpjX4YjCuJCeTjAPYMNvL40ycC3gcaYLUPecHQB0y9F-6n7BsKb4Z205zvLsrN2gyioz093ey9ch7xEsdKYST8kUIddklyfLfFVEODNNm65KtcFjAIEnYx8xcbTcxsKZERdUwQLM_Aaav3sTGgaIl5vFHalCRhdOCwYPiJBOtmEB6nVeUfIU4vdz2N9Gz6_"
                                    alt=""
                                />
                                <p>Polo</p>
                            </div>

                            <div className="shirt-card">
                                <img
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC87zXiEyZzNB3k_OVt-EZUFTUjKYCMQLCXFk0aE8IA-HKZxEpd1k7xUorQk01UxIxjfj65brjGyXSo6ogvOVAeXzatCEn1pqfUypDbmsF1_44qRe4uJoZFZAvZlh2uc-U2gfF357HjlagspPtn_NHbmBCGMo7NYSc9Wkf5b_uUCqLO1iJiv0gwygNlgmyTzAH8Xs7wZLU9mYFRKZTW1OnnXfXYLH0eW00I7ISylhwyFT-CEy_EWaOWF8qO54UdFvoyzkdZCWbDP6Gm"
                                    alt=""
                                />
                                <p>Hoodie</p>
                            </div>

                            <div className="shirt-card">
                                <img
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRSIKYcAnBCr0Z94YyztabPyljz4S0F8qAwsgjbY-t2YPJDqCfAht5Y60p0xzlnY4PU9jRaSgOP88_tPSxtbWHs9Ri2Sbuh8MbAU3qu55ngArgDX6-BZQJlxl6ogqpaX-miECv4pMyM_VluX6fV2vqJI2AXdok9ZBPWzce9IYh8QVXfncgRsI6r-Agr39N3J8GghlQrLxqZ-x0ULyjUJwwNQV_LEihpNTM8cfXgjUJyHbszqfbsWs5eyGnCZPt6rKh1XZjyNYyBRjB"
                                    alt=""
                                />
                                <p>Oversize</p>
                            </div>
                        </div>
                    </div>

                    {/* Colors */}
                    <div className="section">
                        <label>Màu sắc</label>

                        <div className="color-list">
                            <button className="color blue active"></button>
                            <button className="color black"></button>
                            <button className="color white"></button>
                            <button className="color red"></button>
                        </div>
                    </div>

                    {/* Quantity */}
                    <div className="section">
                        <label>Kích thước & Số lượng</label>

                        <table className="size-table">
                            <thead>
                            <tr>
                                <th>Size</th>
                                <th>S</th>
                                <th>M</th>
                                <th>L</th>
                                <th>XL</th>
                            </tr>
                            </thead>

                            <tbody>
                            <tr>
                                <td>Số lượng</td>
                                <td><input type="number" defaultValue={10} /></td>
                                <td><input type="number" defaultValue={10} /></td>
                                <td><input type="number" defaultValue={5} /></td>
                                <td><input type="number" defaultValue={5} /></td>
                            </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Actions */}
                    <div className="action-buttons">
                        <button className="outline-btn">
                            Thêm vào giỏ hàng
                        </button>

                        <button className="primary-btn">
                            Mua ngay
                        </button>
                    </div>
                </div>
            </div>

            {/* Detail + Reviews */}
<div className="content-grid">
  {/* Left Content: Product Details */}
  <div className="left-content">
    <section className="card">
      <h2>Chi tiết sản phẩm</h2>
      <ul>
        <li>Chất liệu 100% Cotton cao cấp.</li>
        <li>In lụa, in decal hoặc thêu vi tính hiện đại.</li>
        <li>Form áo chuẩn, đường may tinh tế.</li>
        <li>Hơn 30 màu sắc chuẩn Pantone.</li>
        <li>Giá tận xưởng, ưu đãi cho đơn số lượng lớn.</li>
      </ul>
    </section>

    {/* Customer Reviews */}
    <section>
      <h2 className="review-title">Đánh giá từ khách hàng</h2>

      <div className="review-card">
        <h4>Trần Hoàng Nam</h4>
        <p>⭐ ⭐ ⭐ ⭐ ⭐</p>
        <span>12/05/2024</span>
        <p className="review-text">
          "Áo vải rất đẹp, logo in sắc nét và dịch vụ tư vấn cực tốt."
        </p>
      </div>

      <div className="review-card">
        <h4>Nguyễn Thị Mai</h4>
        <p>⭐ ⭐ ⭐ ⭐</p>
        <span>08/05/2024</span>
        <p className="review-text">
          "Giao hàng nhanh, form áo mặc rất thoải mái."
        </p>
      </div>
    </section>
  </div>

  {/* Integrated Sidebar Content */}
  <div className="horizontal-section">
    <div className="factory-card">
      <h3>Minh Anh Garment</h3>
      <p className="factory-tag">NHÀ MÁY SẢN XUẤT TRỰC TIẾP</p>
      <div className="factory-stats">
        <div>
          <h4>4.9</h4>
          <span>Đánh giá</span>
        </div>
        <div>
          <h4>5k+</h4>
          <span>Sản phẩm/tháng</span>
        </div>
      </div>
      <button>Xem trang xưởng</button>
    </div>

    <div className="badge-card">
      <p>✔ Cam kết chất lượng 100%</p>
      <p>✔ Giao hàng toàn quốc</p>
      <p>✔ Đổi trả nếu lỗi sản xuất</p>
    </div>
  </div>
</div>
            <Footer />
        </main>
    );
};

export default ProductDetail;