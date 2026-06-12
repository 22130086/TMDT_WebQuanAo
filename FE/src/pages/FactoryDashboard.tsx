import { useEffect, useState } from "react";
import http from "../services/http";

export default function FactoryDashboard() {
  const [stats, setStats] = useState({ products: 0, quotes: 0, orders: 0 });

  useEffect(() => {
    Promise.all([
      http.get("/factory/products?size=1"),
      http.get("/factory/quotations?size=1"),
      http.get("/factory/orders/outsourcing?size=1"),
    ]).then(([p, q, o]) => {
      setStats({
        products: p.data?.data?.totalElements || 0,
        quotes: q.data?.data?.totalElements || 0,
        orders: o.data?.data?.totalElements || 0,
      });
    }).catch(() => {});
  }, []);

  const cards = [
    { icon: "checkroom", label: "Sản phẩm mẫu", val: stats.products },
    { icon: "request_quote", label: "Báo giá đã gửi", val: stats.quotes },
    { icon: "inventory_2", label: "Đơn hàng", val: stats.orders },
    { icon: "star", label: "Đánh giá", val: "—" },
  ];

  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 4px" }}>Trang tổng quan</h2>
        <p style={{ color: "#6b7280", margin: 0 }}>Chào mừng trở lại! Tóm tắt hoạt động sản xuất.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {cards.map((c, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 14 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#2563eb", background: "#eff6ff", borderRadius: 14, padding: 10 }}>{c.icon}</span>
            <div><h3 style={{ margin: 0, fontSize: 24 }}>{c.val}</h3><p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>{c.label}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}
