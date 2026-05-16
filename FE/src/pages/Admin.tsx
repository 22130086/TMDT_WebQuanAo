import "../styles/admin.css";

export default function Admin() {
  const disputes = [
    {
      id: "#DISP-240501",
      date: "12/05/2024, 09:45",
      customer: "Trần Anh Tuấn",
      factory: "May Mặc Việt Thắng",
      content:
        "Sai lệch chất liệu vải lót so với mẫu thiết kế ban đầu 15%...",
      status: "Đang tiếp nhận",
    },
    {
      id: "#DISP-240508",
      date: "10/05/2024, 14:20",
      customer: "Global Uniforms",
      factory: "Dệt Kim Thăng Long",
      content:
        "Trễ hạn giao hàng 14 ngày làm việc, yêu cầu bồi thường...",
      status: "Cần bổ sung",
    },
    {
      id: "#DISP-240492",
      date: "08/05/2024, 16:30",
      customer: "Lê Hoài Nam",
      factory: "Garment Pro 02",
      content:
        "Sản phẩm bị lỗi đường may tại 40% lô hàng áo sơ mi...",
      status: "Đã phán quyết",
    },
  ];

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>FactoryOS</h1>
          <p>Production Unit 01</p>
        </div>

        <nav className="sidebar-menu">
          <a href="#">
            <span className="material-symbols-outlined">dashboard</span>
            Bảng điều khiển
          </a>

          <a href="#">
            <span className="material-symbols-outlined">
              inventory_2
            </span>
            Sản phẩm
          </a>

          <a href="#">
            <span className="material-symbols-outlined">
              shopping_cart
            </span>
            Đơn hàng
          </a>

          <a href="#">
            <span className="material-symbols-outlined">group</span>
            Khách hàng
          </a>

          <a href="#">
            <span className="material-symbols-outlined">
              analytics
            </span>
            Báo cáo
          </a>

          <a href="#">
            <span className="material-symbols-outlined">
              report_problem
            </span>
            Khiếu nại
          </a>

          <a href="#" className="active">
            <span className="material-symbols-outlined">gavel</span>
            Tranh chấp
          </a>
        </nav>

        <button className="new-order-btn">
          <span className="material-symbols-outlined">add</span>
          Lệnh sản xuất mới
        </button>
      </aside>

      {/* MAIN */}
      <main className="admin-main">
        {/* HEADER */}
        <header className="admin-header">
          <div>
            <h2>Quản lý Tranh chấp</h2>
          </div>

          <div className="header-actions">
            <div className="search-box">
              <span className="material-symbols-outlined">
                search
              </span>

              <input
                type="text"
                placeholder="Tìm kiếm mã hồ sơ..."
              />
            </div>

            <button className="icon-btn">
              <span className="material-symbols-outlined">
                notifications
              </span>
            </button>

            <button className="icon-btn">
              <span className="material-symbols-outlined">
                settings
              </span>
            </button>

            <img
              className="avatar"
              src="https://i.pravatar.cc/100"
              alt="avatar"
            />
          </div>
        </header>

        {/* STATS */}
        <section className="stats-grid">
          <div className="stat-card">
            <p>TỔNG HỒ SƠ</p>
            <h3>142</h3>
            <span>+12% so với tháng trước</span>
          </div>

          <div className="stat-card">
            <p>ĐANG XỬ LÝ</p>
            <h3>28</h3>
            <span>Yêu cầu xử lý trong 24h</span>
          </div>

          <div className="stat-card">
            <p>CẦN BỔ SUNG</p>
            <h3>15</h3>
            <span>Chờ phản hồi đối tác</span>
          </div>

          <div className="stat-card">
            <p>ĐÃ GIẢI QUYẾT</p>
            <h3>99</h3>
            <span>98.2% Tỷ lệ hài lòng</span>
          </div>
        </section>

        {/* CONTENT */}
        <div className="content-grid">
          {/* TABLE */}
          <section className="table-section">
            <div className="table-header">
              <div>
                <h3>Danh sách hồ sơ tranh chấp</h3>
                <p>
                  Quản lý và đưa ra phán quyết cho các yêu cầu
                  hiện hành
                </p>
              </div>

              <div className="table-actions">
                <button>Lọc</button>
                <button className="primary">
                  Xuất báo cáo
                </button>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Hồ sơ</th>
                    <th>Các bên liên quan</th>
                    <th>Nội dung</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>

                <tbody>
                  {disputes.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <strong>{item.id}</strong>
                        <span>{item.date}</span>
                      </td>

                      <td>
                        <p>Khách: {item.customer}</p>
                        <p>Xưởng: {item.factory}</p>
                      </td>

                      <td>{item.content}</td>

                      <td>
                        <span className="status">
                          {item.status}
                        </span>
                      </td>

                      <td>
                        <button className="action-btn">
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* SIDEBAR RIGHT */}
          <aside className="right-panel">
            <div className="report-card">
              <h3>Báo cáo vi phạm</h3>

              <div className="report-item">
                <div>
                  <h4>Dệt Kim Thăng Long</h4>
                  <p>8 vi phạm / 3 tháng</p>
                </div>

                <span className="danger">CẢNH BÁO</span>
              </div>

              <div className="report-item">
                <div>
                  <h4>Nguyễn Văn Đại</h4>
                  <p>3 vi phạm / 1 tháng</p>
                </div>

                <span className="warning">THEO DÕI</span>
              </div>

              <div className="report-item">
                <div>
                  <h4>Garment Pro 02</h4>
                  <p>2 vi phạm / 6 tháng</p>
                </div>
              </div>
            </div>

            <div className="assistant-card">
              <h3>Trình phán quyết nhanh</h3>

              <p>
                Xử lý khấu trừ hoặc chuyển tiền tự động dựa
                trên bằng chứng đã xác minh.
              </p>

              <div className="assistant-box">
                <span>Hồ sơ chờ xử lý gấp</span>
                <strong>#DISP-240501</strong>
              </div>

              <button>Bắt đầu thẩm định</button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}  