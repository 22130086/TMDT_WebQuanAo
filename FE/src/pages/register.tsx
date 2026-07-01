import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { register, sendOtp } from "../services/authService";

const API_BASE = "http://localhost:8080/api";

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
  const [otp, setOtp] = useState("");
  const [showOtpStep, setShowOtpStep] = useState(false);

  // Factory fields
  const [factoryName, setFactoryName] = useState("");
  const [factoryAddress, setFactoryAddress] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();

  async function handleRequestOtp(event: FormEvent<HTMLFormElement>) {
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
      await sendOtp(email);
      setSuccess("Mã xác nhận đã được gửi đến email của bạn!");
      setShowOtpStep(true);
    } catch (err: any) {
      console.error('Send OTP error:', err);
      setError(err?.message || 'Đã xảy ra lỗi khi gửi mã OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleFinalRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!otp) {
      setError("Vui lòng nhập mã OTP");
      return;
    }

    setLoading(true);
    let certImageUrl = "";

    try {
      if (role === "factory" && certFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", certFile);
        const uploadRes = await axios.post(API_BASE + "/upload", formData);
        certImageUrl = uploadRes.data?.data?.url || "";
        setUploading(false);
      }

      await register({
        email,
        password,
        fullName,
        phone: phone || undefined,
        role: role === "factory" ? "FACTORY" : "CUSTOMER",
        factoryName: role === "factory" ? factoryName : undefined,
        factoryAddress: role === "factory" ? factoryAddress : undefined,
        certImageUrl: certImageUrl || undefined,
      }, otp);

      setSuccess("Đăng ký thành công! Vui lòng đăng nhập.");
      setTimeout(() => navigate("/"), 1500);
    } catch (err: any) {
      console.error('Register error:', err);
      const msg = err?.response?.data?.message 
        || (err?.response?.data?.errors && Array.isArray(err.response.data.errors) 
            ? err.response.data.errors.join(', ') : null)
        || err?.response?.data?.error
        || err?.message 
        || 'Đã xảy ra lỗi khi đăng ký';
      setError(msg);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }

  return (
    <main className="register-page">
      <section className="register-left">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBN718DLua2IgkhJQ9ZGq0Hx5uxNXHYBZkBithYgpYDhl5oduGJz4mQCvND19omq0XnelN4G6cudJcsaPebNM1gquAKnmQtWxTvOnFRyHVYJk920GQZc6xuaYuphXZZscMJKQtfPpzROTx9Bsa8vBzp0MyULqC2uNO-WTr8Q253jfoxo357ZXS8yFGApKg3TxCkmjSl3sdJdYRUXVJ_nUEnWR52IKqgOBtt-s1SKN8sEdbT1u7bSl0REIb70VAxQMGIyHJ3cIGhTUmS"
            alt="Factory"
          />

          <div className="overlay"></div>

          <div className="left-content">
            <div className="brand">
              <span className="material-symbols-outlined filled">
                precision_manufacturing
              </span>
              <span className="brand-name">Azure</span>
            </div>

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

            {!showOtpStep ? (
            <form className="register-form" onSubmit={handleRequestOtp}>
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
                    <input type="text" placeholder="Xưởng May Blueprint" value={factoryName} onChange={e => setFactoryName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Địa chỉ</label>
                    <input type="text" placeholder="123 Đường Công Nghiệp, TP.HCM" value={factoryAddress} onChange={e => setFactoryAddress(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Ảnh giấy phép kinh doanh</label>
                    <input type="file" accept="image/*" onChange={(e) => setCertFile(e.target.files?.[0] || null)} />
                    {certFile && <p style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem' }}>✅ {certFile.name}</p>}
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

              <button type="submit" className="register-btn" disabled={loading || uploading}>
                {uploading ? "Đang tải ảnh..." : loading ? "Đang đăng ký..." : "Đăng ký"}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>

              <div className="login-link">
                <p>
                  Đã có tài khoản?
                  <Link to="/"> Đăng nhập</Link>
                </p>
              </div>
            </form>
            ) : (
            <form className="register-form otp-form" onSubmit={handleFinalRegister}>
              {error && <div className="form-error">{error}</div>}
              {success && <div className="form-success">{success}</div>}
              
              <h3 style={{ marginBottom: "1rem" }}>Xác thực Email</h3>
              <p style={{ marginBottom: "1.5rem" }}>
                Vui lòng nhập mã OTP gồm 6 chữ số vừa được gửi đến email <strong>{email}</strong>
              </p>
              
              <div className="form-group">
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="Nhập mã OTP..." 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)} 
                  style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.5rem" }}
                />
              </div>

              <button type="submit" className="register-btn" disabled={loading || uploading}>
                {uploading ? "Đang tải ảnh..." : loading ? "Đang xác thực..." : "Xác nhận & Đăng ký"}
                <span className="material-symbols-outlined">check_circle</span>
              </button>
              
              <button type="button" onClick={() => setShowOtpStep(false)} className="register-btn" style={{ background: "transparent", color: "var(--text)", border: "1px solid var(--border)", marginTop: "1rem" }}>
                Quay lại
              </button>
            </form>
            )}
            
          </div>
          
          
        </section>
    </main>
  );
}
