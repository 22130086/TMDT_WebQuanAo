import "../styles/factory.css";

const Factory = () => {
  return (
    <div className="factory-page">
      {/* Sidebar */}
      <aside className="factory-sidebar">
        <div className="sidebar-header">
          <h2>Industrial Admin</h2>
          <p>Xưởng May Azure</p>
        </div>

        <nav className="sidebar-nav">
          <a href="#" className="active">
            <span className="material-symbols-outlined">dashboard</span>
            Tổng quan
          </a>

          <a href="#">
            <span className="material-symbols-outlined">checkroom</span>
            Sản phẩm mẫu
          </a>

          <a href="#">
            <span className="material-symbols-outlined">
              precision_manufacturing
            </span>
            Yêu cầu gia công
          </a>

          <a href="#">
            <span className="material-symbols-outlined">request_quote</span>
            Báo giá
          </a>

          <a href="#">
            <span className="material-symbols-outlined">inventory_2</span>
            Đơn hàng
          </a>

          <a href="#">
            <span className="material-symbols-outlined">star_rate</span>
            Đánh giá
          </a>

          <a href="#">
            <span className="material-symbols-outlined">factory</span>
            Hồ sơ xưởng
          </a>
        </nav>

        <div className="sidebar-footer">
          <button className="new-request-btn">Tạo yêu cầu mới</button>

          <div className="sidebar-links">
            <a href="#">
              <span className="material-symbols-outlined">
                support_agent
              </span>
              Hỗ trợ
            </a>

            <a href="#" className="logout">
              <span className="material-symbols-outlined">logout</span>
              Đăng xuất
            </a>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="factory-main">
        {/* Header */}
        <header className="factory-header">
          <div className="header-left">
            <h1>Azure Industrial</h1>
          </div>

          <div className="header-right">
            <div className="search-box">
              <span className="material-symbols-outlined">search</span>
              <input
                type="text"
                placeholder="Tìm kiếm đơn hàng..."
              />
            </div>

            <button className="icon-btn">
              <span className="material-symbols-outlined">
                notifications
              </span>
            </button>

            <button className="icon-btn">
              <span className="material-symbols-outlined">settings</span>
            </button>

            <div className="profile">
              <div>
                <h4>Admin Azure</h4>
                <p>Quản lý xưởng</p>
              </div>

              <img
                src="https://i.pravatar.cc/100"
                alt="avatar"
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <section className="factory-content">
          <div className="page-title">
            <h2>Trang tổng quan</h2>
            <p>
              Chào mừng trở lại! Đây là tóm tắt hoạt động
              sản xuất hôm nay.
            </p>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="material-symbols-outlined">
                checkroom
              </span>
              <h3>45</h3>
              <p>Tổng số sản phẩm mẫu</p>
            </div>

            <div className="stat-card">
              <span className="material-symbols-outlined">
                request_quote
              </span>
              <h3>128</h3>
              <p>Báo giá đã gửi</p>
            </div>

            <div className="stat-card">
              <span className="material-symbols-outlined">
                precision_manufacturing
              </span>
              <h3>12</h3>
              <p>Đơn hàng đang sản xuất</p>
            </div>

            <div className="stat-card">
              <span className="material-symbols-outlined">
                star
              </span>
              <h3>4.8/5</h3>
              <p>Điểm đánh giá trung bình</p>
            </div>
          </div>

          {/* Layout */}
          <div className="factory-grid">
            {/* Table */}
            <div className="table-card">
              <div className="card-header">
                <div>
                  <h3>Yêu cầu gia công mới</h3>
                  <p>Cần xử lý ngay</p>
                </div>

                <button>Xem tất cả</button>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Tên sản phẩm</th>
                    <th>Số lượng</th>
                    <th>Thời hạn</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td>Áo thun Cotton Premium</td>
                    <td>500 cái</td>
                    <td>20/11/2023</td>
                    <td>
                      <button>Chi tiết</button>
                    </td>
                  </tr>

                  <tr>
                    <td>Áo khoác Kaki công sở</td>
                    <td>200 cái</td>
                    <td>15/11/2023</td>
                    <td>
                      <button>Chi tiết</button>
                    </td>
                  </tr>

                  <tr>
                    <td>Quần Jean Denim Wash</td>
                    <td>1,200 cái</td>
                    <td>01/12/2023</td>
                    <td>
                      <button>Chi tiết</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Quote */}
            <div className="quote-card">
              <div className="card-header">
                <div>
                  <h3>Báo giá gần đây</h3>
                  <p>Theo dõi phản hồi</p>
                </div>
              </div>

              <div className="quote-item">
                <div>
                  <h4>Đồng phục học sinh</h4>
                  <span className="pending">Đang chờ</span>
                </div>

                <strong>85.000đ</strong>
              </div>

              <div className="quote-item">
                <div>
                  <h4>Sơ mi Oxford Nam</h4>
                  <span className="success">
                    Đã chấp nhận
                  </span>
                </div>

                <strong>145.000đ</strong>
              </div>

              <div className="quote-item">
                <div>
                  <h4>Túi Canvas Logo</h4>
                  <span className="danger">
                    Đã từ chối
                  </span>
                </div>

                <strong>32.000đ</strong>
              </div>
            </div>

            {/* Progress */}
            <div className="progress-card">
              <div className="card-header">
                <div>
                  <h3>Tiến độ đơn hàng</h3>
                  <p>Hoạt động sản xuất</p>
                </div>
              </div>

              <div className="progress-item">
                <div className="progress-info">
                  <span>
                    #ORD-2023-098 — Vest công sở
                  </span>
                  <span>75%</span>
                </div>

                <div className="progress-bar">
                  <div style={{ width: "75%" }}></div>
                </div>
              </div>

              <div className="progress-item">
                <div className="progress-info">
                  <span>
                    #ORD-2023-102 — Áo Hoodie Nỉ
                  </span>
                  <span>15%</span>
                </div>

                <div className="progress-bar">
                  <div style={{ width: "15%" }}></div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="review-card">
              <div className="card-header">
                <div>
                  <h3>Đánh giá mới nhất</h3>
                  <p>Phản hồi khách hàng</p>
                </div>
              </div>

              <div className="review-item">
                <div className="stars">★★★★★</div>

                <p>
                  Đường may cực kỳ sắc sảo, giao hàng đúng
                  hẹn.
                </p>

                <span>
                  Lê Tuấn - Fashion Brand
                </span>
              </div>

              <div className="review-item">
                <div className="stars">★★★★☆</div>

                <p>
                  Sản phẩm mẫu làm rất nhanh, hỗ trợ tốt.
                </p>

                <span>
                  Minh Hà - Uniform Co.
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Factory;