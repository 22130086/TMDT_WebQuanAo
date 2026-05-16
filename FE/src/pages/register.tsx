import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/authService";

export default function Register() {
  const [role, setRole] = useState("customer");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!fullName || !email || !password || !confirmPassword) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu và xác nhận mật khẩu không khớp");
      return;
    }

    if (!termsAccepted) {
      setError("Vui lòng chấp nhận điều khoản dịch vụ");
      return;
    }

    setLoading(true);

    try {
      await register({
        email,
        password,
        fullName,
        phone: phone || undefined,
        role: role === "factory" ? "FACTORY" : "CUSTOMER",
      });

      setSuccess("Đăng ký thành công! Vui lòng đăng nhập.");
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi đăng ký"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <header className="top-header">
        <h2>Blueprint Orchestrator</h2>
      </header>

      <main className="register-main">
        <section className="register-left">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBN718DLua2IgkhJQ9ZGq0Hx5uxNXHYBZkBithYgpYDhl5oduGJz4mQCvND19omq0XnelN4G6cudJcsaPebNM1gquAKnmQtWxTvOnFRyHVYJk920GQZc6xuaYuphXZZscMJKQtfPpzROTx9Bsa8vBzp0MyULqC2uNO-WTr8Q253jfoxo357ZXS8yFGApKg3TxCkmjSl3sdJdYRUXVJ_nUEnWR52IKqgOBtt-s1SKN8sEdbT1u7bSl0REIb70VAxQMGIyHJ3cIGhTUmS"
            alt="Factory"
          />

          <div className="overlay"></div>

          <div className="left-content">
            <h1>Kết nối xưởng may với khách hàng</h1>
            <p>
              Thiết kế – sản xuất – giao hàng toàn quốc.
              Hệ thống quản lý sản xuất may mặc thông minh nhất.
            </p>

            <div className="slider-dots">
              <span className="active"></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </section>

        <section className="register-right">
          <div className="register-card">
            <div className="card-header">
              <h2>Đăng ký tài khoản</h2>
              <p>Khởi đầu hành trình sản xuất của bạn</p>
            </div>

            <form className="register-form" onSubmit={handleSubmit}>
              {error && <div className="form-error">{error}</div>}
              {success && <div className="form-success">{success}</div>}

              <div className="role-selection">
                <label
                  className={
                    role === "customer" ? "role-card active" : "role-card"
                  }
                >
                  <input
                    type="radio"
                    name="role"
                    value="customer"
                    checked={role === "customer"}
                    onChange={() => setRole("customer")}
                  />
                  <span className="material-symbols-outlined">person</span>
                  <span>Khách hàng</span>
                </label>

                <label
                  className={
                    role === "factory" ? "role-card active" : "role-card"
                  }
                >
                  <input
                    type="radio"
                    name="role"
                    value="factory"
                    checked={role === "factory"}
                    onChange={() => setRole("factory")}
                  />
                  <span className="material-symbols-outlined">factory</span>
                  <span>Xưởng may</span>
                </label>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    placeholder="0901 234 567"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="email@vi-du.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Mật khẩu</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                  />
                </div>
              </div>

              {role === "factory" && (
                <div className="factory-section">
                  <p>Thông tin xưởng</p>
                  <div className="form-group">
                    <label>Tên xưởng</label>
                    <input type="text" placeholder="Xưởng May Blueprint" />
                  </div>

                  <div className="form-group">
                    <label>Địa chỉ</label>
                    <input
                      type="text"
                      placeholder="123 Đường Công Nghiệp, TP.HCM"
                    />
                  </div>
                </div>
              )}

              <label className="terms">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(event) =>
                    setTermsAccepted(event.target.checked)
                  }
                />
                <span>
                  Tôi đồng ý với
                  <a href="#"> điều khoản dịch vụ </a>
                  và
                  <a href="#"> chính sách bảo mật</a>
                </span>
              </label>

              <button type="submit" className="register-btn" disabled={loading}>
                {loading ? "Đang đăng ký..." : "Đăng ký"}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>

              <div className="login-link">
                <p>
                  Đã có tài khoản?
                  <Link to="/"> Đăng nhập</Link>
                </p>
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Help Center</a>
        </div>
        <p>© 2024 Blueprint Orchestrator. All rights reserved.</p>
      </footer>
    </div>
  );
}
