// import { useEffect, useState } from "react";
// import { supabase } from "../../supabaseClient";

// const Analytics = () => {
//   const [stats, setStats] = useState({
//     totalSales: 0,
//     totalOrders: 0,
//     totalProducts: 0,
//   });

//   const fetchStats = async () => {
//     try {
//       const {
//           data: { user },
//         } = await supabase.auth.getUser();

//         const seller_id = user.id;

//       // 1️⃣ Total Sales
//       const { data: salesData } = await supabase
//         .from("orders")
//         .select("total_amount")
//         .eq("seller_id", seller_id);

//       const totalSales = salesData?.reduce(
//         (sum, o) => sum + o.total_amount,
//         0
//       );

//       // 2️⃣ Total Orders
//       const { count: totalOrders } = await supabase
//         .from("orders")
//         .select("*", { count: "exact", head: true })
//         .eq("seller_id", seller_id);

//       // 3️⃣ Total Products
//       const { count: totalProducts } = await supabase
//         .from("products")
//         .select("*", { count: "exact", head: true })
//         .eq("seller_id", seller_id);

//       setStats({
//         totalSales,
//         totalOrders,
//         totalProducts,
//       });

//     } catch (error) {
//       console.error("Error fetching analytics:", error);
//     }
//   };

//   useEffect(() => {
//     fetchStats();
//   }, []);

//   return (
//     <div style={{ padding: "20px" }}>
//       <h2>Seller Analytics</h2>

//       <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        
//         <div style={cardStyle}>
//           <h3>💰 Total Sales</h3>
//           <p>₹{stats.totalSales}</p>
//         </div>

//         <div style={cardStyle}>
//           <h3>📦 Total Orders</h3>
//           <p>{stats.totalOrders}</p>
//         </div>

//         <div style={cardStyle}>
//           <h3>🛍️ Products</h3>
//           <p>{stats.totalProducts}</p>
//         </div>

//       </div>
//     </div>
//   );
// };

// const cardStyle = {
//   padding: "20px",
//   border: "1px solid #ccc",
//   borderRadius: "10px",
//   width: "200px",
//   textAlign: "center",
// };

// export default Analytics;


import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const COLORS = ["#C0392B", "#3D2B2B", "#E8A87C", "#5C3D3D", "#F5CBA7"];

const StatCard = ({ label, value, sub, color = "#C0392B" }) => (
  <div style={{
    background: "#fff", borderRadius: "12px",
    border: "1px solid #EDE8E3", padding: "18px 20px",
  }}>
    <div style={{ fontSize: "12px", color: "#888", fontWeight: 500, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
    <div style={{ fontSize: "28px", fontWeight: 700, color: "#2C1810" }}>{value}</div>
    {sub && <div style={{ fontSize: "12px", color: color, marginTop: "4px", fontWeight: 500 }}>{sub}</div>}
  </div>
);

const SectionCard = ({ title, children, style = {} }) => (
  <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #EDE8E3", padding: "20px", ...style }}>
    <div style={{ fontWeight: 700, fontSize: "15px", color: "#2C1810", marginBottom: "18px" }}>{title}</div>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label, prefix = "" }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: "#fff", border: "1px solid #EDE8E3", borderRadius: "8px",
        padding: "10px 14px", fontSize: "13px", color: "#2C1810",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)"
      }}>
        <div style={{ fontWeight: 600, marginBottom: "4px" }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color }}>
            {p.name}: {prefix}{typeof p.value === "number" ? p.value.toLocaleString("en-IN") : p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0, totalProducts: 0, avgOrderValue: 0 });
  const [monthlySales, setMonthlySales] = useState([]);
  const [statusDist, setStatusDist] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const sid = user.id;

    const [productsRes, orderItemsRes, ordersRes] = await Promise.all([
      supabase.from("products").select("id, name, price, stock").eq("seller_id", sid),
      supabase.from("order_items").select("order_id, quantity, price_at_purchase, product_id, product:products(name, seller_id)"),
      supabase.from("orders").select("id, status, total_amount, created_at"),
    ]);

    const myItems = (orderItemsRes.data || []).filter(i => i.product?.seller_id === sid);
    const myOrderIds = new Set(myItems.map(i => i.order_id));
    const myOrders = (ordersRes.data || []).filter(o => myOrderIds.has(o.id));

    const totalSales = myItems.reduce((s, i) => s + i.price_at_purchase * i.quantity, 0);
    const totalOrders = myOrders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    setStats({ totalSales, totalOrders, totalProducts: productsRes.data?.length || 0, avgOrderValue });

    // Monthly sales — last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-IN", { month: "short" });
      const ordersThisMonth = myOrders.filter(o => o.created_at?.startsWith(key));
      const salesThisMonth = ordersThisMonth.reduce((s, o) => s + (o.total_amount || 0), 0);
      months.push({ month: label, sales: Math.round(salesThisMonth), orders: ordersThisMonth.length });
    }
    setMonthlySales(months);

    // Status distribution
    const statusMap = {};
    myOrders.forEach(o => { statusMap[o.status] = (statusMap[o.status] || 0) + 1; });
    setStatusDist(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

    // Top products by revenue
    const productRevMap = {};
    myItems.forEach(i => {
      const name = i.product?.name || "Unknown";
      productRevMap[name] = (productRevMap[name] || 0) + i.price_at_purchase * i.quantity;
    });
    const sorted = Object.entries(productRevMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, revenue]) => ({ name: name.length > 20 ? name.slice(0, 18) + "…" : name, revenue: Math.round(revenue) }));
    setTopProducts(sorted);

    setLoading(false);
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px" }}>
      <span style={{ color: "#888", fontSize: "14px" }}>Loading analytics...</span>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        <StatCard label="Total Revenue" value={`₹${stats.totalSales.toLocaleString("en-IN")}`} sub="All time earnings" />
        <StatCard label="Total Orders" value={stats.totalOrders} sub="Across all time" color="#B7791F" />
        <StatCard label="Products" value={stats.totalProducts} sub="Currently listed" color="#22764A" />
        <StatCard label="Avg. Order Value" value={`₹${stats.avgOrderValue.toLocaleString("en-IN")}`} sub="Per order" color="#7C3AED" />
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        <SectionCard title="Monthly Revenue">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlySales} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C0392B" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#C0392B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#888" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#888" }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
              <Tooltip content={<CustomTooltip prefix="₹" />} />
              <Area type="monotone" dataKey="sales" name="Revenue" stroke="#C0392B" strokeWidth={2}
                fill="url(#salesGrad)" dot={{ fill: "#C0392B", r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Order Status">
          {statusDist.length === 0
            ? <div style={{ color: "#aaa", textAlign: "center", paddingTop: "60px" }}>No data</div>
            : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={statusDist} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                  {statusDist.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ color: "#555", textTransform: "capitalize" }}>{s.name}</span>
                      <span style={{ marginLeft: "auto", fontWeight: 600, color: "#2C1810" }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
        </SectionCard>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <SectionCard title="Top Products by Revenue">
          {topProducts.length === 0
            ? <div style={{ color: "#aaa", textAlign: "center", paddingTop: "40px" }}>No sales data yet</div>
            : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topProducts} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F0EBE6" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false}
                    tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#555" }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip content={<CustomTooltip prefix="₹" />} />
                  <Bar dataKey="revenue" name="Revenue" fill="#C0392B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
        </SectionCard>

        <SectionCard title="Orders per Month">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlySales} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#888" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#888" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="orders" name="Orders" fill="#3D2B2B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

    </div>
  );
}