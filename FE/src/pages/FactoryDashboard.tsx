import { useEffect, useState } from "react";
import http from "../services/http";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function FactoryDashboard() {
  const [stats, setStats] = useState({ products: 0, quotes: 0, orders: 0 });
  const [revenueData, setRevenueData] = useState<{ date: string, revenue: number }[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  
  // Default to last 30 days
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0]
  });

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

  useEffect(() => {
    fetchRevenueData();
  }, [dateRange]);

  const fetchRevenueData = () => {
    http.get(`/factory/reports/revenue?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
      .then((res) => {
        const data = res.data?.data;
        if (data) {
          setRevenueData(data.chartData || []);
          setTotalRevenue(data.totalRevenue || 0);
        }
      })
      .catch(() => {});
  };

  const cards = [
    { icon: "account_balance_wallet", label: "Tổng doanh thu", val: totalRevenue.toLocaleString() + " ₫" },
    { icon: "checkroom", label: "Sản phẩm mẫu", val: stats.products },
    { icon: "request_quote", label: "Báo giá đã gửi", val: stats.quotes },
    { icon: "inventory_2", label: "Đơn hàng", val: stats.orders },
  ];

  return (
    <div style={{ paddingTop: 8, paddingBottom: 40 }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: "0 0 4px" }}>Trang tổng quan</h2>
          <p style={{ color: "#6b7280", margin: 0 }}>Chào mừng trở lại! Tóm tắt hoạt động sản xuất.</p>
        </div>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
        {cards.map((c, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 14 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#2563eb", background: "#eff6ff", borderRadius: 14, padding: 10 }}>{c.icon}</span>
            <div><h3 style={{ margin: 0, fontSize: 22 }}>{c.val}</h3><p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>{c.label}</p></div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ margin: 0 }}>Doanh thu</h3>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "#6b7280" }}>Từ ngày:</span>
            <input 
              type="date" 
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", outline: "none", fontFamily: "inherit" }}
            />
            <span style={{ fontSize: 14, color: "#6b7280" }}>Đến ngày:</span>
            <input 
              type="date" 
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", outline: "none", fontFamily: "inherit" }}
            />
          </div>
        </div>

        <div style={{ height: 350, width: "100%" }}>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 30, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#6b7280", fontSize: 12 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                />
                <Tooltip 
                  cursor={{ fill: "#f3f4f6" }}
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontFamily: "inherit" }}
                  formatter={(value: number) => [value.toLocaleString() + " ₫", "Doanh thu"]}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
              Không có dữ liệu trong khoảng thời gian này
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
