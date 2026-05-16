import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, saveAuthToken } from "../services/authService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu");
      return;
    }

    setLoading(true);

    try {
      const data = await login({ email, password });
      saveAuthToken(data.token);
      setSuccess("Đăng nhập thành công!");
      setTimeout(() => navigate("/home"), 800);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi đăng nhập"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      {/* LEFT */}
      <section className="login-left">
        <div className="overlay"></div>

        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBl5HQC5Ai03oHcLKPGXT_ITZXhlXepgtOQtbmuRk04iUPQRMuVJHcP1OjMJuonWXqsEqiF0ALTdxXtp4StGXaFiP-2B_Qmro0exsEPPNSjBz1opksFIFcF-tOzrbqUy5EIklLp-lqiSlXrRevWkiAxV-M4NT5Z1_fgjI6enoazhFAL7W7rXSBghfbFIsPV_MiX7sO0G9brH7KzfBeTtsgY0xQV19SLTUvY63AJhCJqahYa5rqKkp5NQoiLonkuLjrweX--vRv9qbB4"
          alt="Factory"
        />

        <div className="left-content">
          <div className="brand">
            <span className="material-symbols-outlined filled">
              precision_manufacturing
            </span>
            <span className="brand-name">Blueprint Orchestrator</span>
          </div>

          <h1>Kết nối xưởng may với khách hàng</h1>

          <p className="subtitle">
            Thiết kế – sản xuất – giao hàng toàn quốc
          </p>

          <div className="users">
            <div className="avatars">
              <div>JD</div>
              <div>MS</div>
              <div>AK</div>
            </div>
            <span>Hơn 500+ xưởng may đã tham gia</span>
          </div>
        </div>
      </section>

      {/* RIGHT */}
      <section className="login-right">
        <div className="login-card">
          <div className="card-header">
            <h2>Đăng nhập</h2>
            <p>Chào mừng bạn quay lại với hệ thống quản lý Blueprint.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}

            <div className="form-group">
              <label>Email</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  placeholder="example@blueprint.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <span className="material-symbols-outlined icon">person</span>
              </div>
            </div>

            <div className="form-group">
              <label>Mật khẩu</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined icon">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="remember">
                <input type="checkbox" />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <a href="#">Quên mật khẩu?</a>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </form>

          <div className="divider">
            <span>Hoặc</span>
          </div>

          <div className="social-buttons">
            <button className="social-btn" type="button">
              Google
            </button>
            <button className="social-btn" type="button">
              Facebook
            </button>
          </div>

          <div className="register">
            <p>
              Chưa có tài khoản?
              <Link to="/register"> Đăng ký ngay</Link>
            </p>
          </div>
        </div>

        <footer className="footer">
          <p>© 2024 Blueprint Orchestrator. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Help Center</a>
          </div>
        </footer>
      </section>
    </main>
  );
}
