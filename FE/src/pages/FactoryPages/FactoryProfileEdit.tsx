import { useState, useEffect } from "react";
import http from "../../services/http";
import "../../styles/admin-table.css";

export default function FactoryProfileEdit() {
  const [form, setForm] = useState({
    factoryName: "", description: "", address: "",
    minQuantity: "", maxQuantity: "", leadTimeDays: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    http.get("/factory/profile")
      .then(r => {
        const d = r.data?.data;
        if (d) setForm({
          factoryName: d.factoryName || "",
          description: d.description || "",
          address: d.address || "",
          minQuantity: d.minQuantity?.toString() || "",
          maxQuantity: d.maxQuantity?.toString() || "",
          leadTimeDays: d.leadTimeDays?.toString() || "",
        });
      }).catch(() => {
        // Chưa có hồ sơ -> form trống, không báo lỗi
      });
  }, []);

  const handleSave = async () => {
    if (!form.factoryName.trim()) { setMsg("❌ Vui lòng nhập tên xưởng."); return; }
    setLoading(true);
    try {
      const res = await http.post("/factory/profile", {
        factoryName: form.factoryName.trim(),
        description: form.description.trim() || null,
        address: form.address.trim() || null,
        minQuantity: form.minQuantity ? parseInt(form.minQuantity) : null,
        maxQuantity: form.maxQuantity ? parseInt(form.maxQuantity) : null,
        leadTimeDays: form.leadTimeDays ? parseInt(form.leadTimeDays) : null,
      });
      if (res.data?.message) setMsg("✅ " + res.data.message);
      else setMsg("✅ Cập nhật hồ sơ thành công!");
    } catch (e: any) {
      const errMsg = e.response?.data?.message || e.response?.data?.error || e.message || "Lỗi hệ thống";
      setMsg("❌ " + errMsg);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ marginBottom: 20 }}>🏭 Hồ sơ xưởng</h2>
      {msg && <div style={{ padding: 12, marginBottom: 16, borderRadius: 10, background: msg.startsWith("✅") ? "#f0fdf4" : "#fef2f2", color: msg.startsWith("✅") ? "#16a34a" : "#dc2626" }}>{msg}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ fontWeight: 700, fontSize: 14, display: "block", marginBottom: 4 }}>Tên xưởng *</label>
          <input className="text-input" value={form.factoryName} onChange={e => setForm({ ...form, factoryName: e.target.value })} placeholder="Tên xưởng" />
        </div>
        <div>
          <label style={{ fontWeight: 700, fontSize: 14, display: "block", marginBottom: 4 }}>Mô tả</label>
          <textarea className="text-input post-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Mô tả năng lực xưởng..." rows={3} />
        </div>
        <div>
          <label style={{ fontWeight: 700, fontSize: 14, display: "block", marginBottom: 4 }}>Địa chỉ</label>
          <input className="text-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Địa chỉ xưởng" />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 700, fontSize: 14, display: "block", marginBottom: 4 }}>SL tối thiểu</label>
            <input className="text-input" type="number" value={form.minQuantity} onChange={e => setForm({ ...form, minQuantity: e.target.value })} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 700, fontSize: 14, display: "block", marginBottom: 4 }}>SL tối đa</label>
            <input className="text-input" type="number" value={form.maxQuantity} onChange={e => setForm({ ...form, maxQuantity: e.target.value })} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 700, fontSize: 14, display: "block", marginBottom: 4 }}>TG giao (ngày)</label>
            <input className="text-input" type="number" value={form.leadTimeDays} onChange={e => setForm({ ...form, leadTimeDays: e.target.value })} />
          </div>
        </div>
        <button className="save-btn" onClick={handleSave} disabled={loading} style={{ width: "100%" }}>
          {loading ? "Đang lưu..." : "💾 Lưu hồ sơ"}
        </button>
      </div>
    </div>
  );
}
