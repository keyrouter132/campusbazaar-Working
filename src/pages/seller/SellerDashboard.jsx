// // import "./SellerDashboard.css";
// // import { useNavigate } from "react-router-dom";

// // function SellerDashboard() {
// //   const navigate = useNavigate();

// //   return (
// //     <div className="seller-container">
// //       <h2 className="dashboard-title">Seller Dashboard</h2>

// //       <div className="dashboard-grid">

// //         <div className="dashboard-box">
// //           <h3>📦 My Products</h3>
// //           <p>View, edit or delete your products</p>
// //           <button
// //             className="primary-btn"
// //             onClick={() => navigate("/seller/products")}
// //           >
// //             Manage Products
// //           </button>
// //         </div>

// //         <div className="dashboard-box">
// //           <h3>➕ Add Product</h3>
// //           <p>Add new items to your shop</p>
// //           <button
// //             className="primary-btn"
// //             onClick={() => navigate("/seller/add-product")}
// //           >
// //             Add Product
// //           </button>
// //         </div>

// //         <div className="dashboard-box">
// //           <h3>📑 Orders</h3>
// //           <p>View and manage customer orders</p>
// //           <button
// //             className="primary-btn"
// //             onClick={() => navigate("/seller/orders")}
// //           >
// //             View Orders
// //           </button>
// //         </div>

// //         <div className="dashboard-box">
// //           <h3>📊 Analytics</h3>
// //           <p>Track your sales performance</p>
// //           <button
// //             className="primary-btn"
// //             onClick={() => navigate("/seller/analytics")}
// //           >
// //             View Analytics
// //           </button>
// //         </div>

// //       </div>
// //     </div>
// //   );
// // }

// // export default SellerDashboard;
// // SellerLayout.jsx (or update SellerDashboard.jsx)


// import { useState } from 'react';
// import { useNavigate, Outlet } from 'react-router-dom';
// import { supabase } from "../../supabaseClient";
// import "./SellerDashboard.css";

// export default function SellerLayout() {
//   const navigate = useNavigate();
//   const [isProfileOpen, setIsProfileOpen] = useState(false);

//   return (
//     <div className="seller-dashboard-layout">
//       {/* SIDEBAR */}
//       <aside className="seller-sidebar">
//         <div className="sidebar-logo">CampusBazaar</div>
//         <nav className="sidebar-nav">
//           <div className="nav-item" onClick={() => navigate("/seller/dashboard")}>📊 Dashboard</div>
//           <div className="nav-item" onClick={() => navigate("/seller/orders")}>📑 Orders</div>
//           <div className="nav-item" onClick={() => navigate("/seller/products")}>📦 My Products</div>
//           <div className="nav-item" onClick={() => navigate("/seller/settings")}>⚙️ Shop Settings</div>
//         </nav>
//       </aside>

//       {/* MAIN CONTENT AREA */}
//       <main className="seller-main">
//         <header className="seller-top-nav">
//           <div className="profile-trigger" onClick={() => setIsProfileOpen(true)}>
//             <div className="avatar-circle">S</div>
//           </div>
//         </header>

//         <section className="content-container">
//           <Outlet /> {/* This renders the specific page like Orders or Settings */}
//         </section>
//       </main>

//       {/* PROFILE SLIDE-IN (Matches Admin UI) */}
//       <div className={`profile-slideout ${isProfileOpen ? 'active' : ''}`}>
//         <div className="slideout-header">
//           <h3>My Profile</h3>
//           <button className="close-btn" onClick={() => setIsProfileOpen(false)}>×</button>
//         </div>
//         <div className="slideout-body">
//           <p className="profile-label">Role: <span>Seller</span></p>
//           <button className="signout-btn" onClick={() => supabase.auth.signOut()}>Sign Out</button>
//         </div>
//       </div>
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const Card = ({ children, style = {} }) => (
  <div style={{
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #EDE8E3",
    padding: "20px",
    ...style,
  }}>{children}</div>
);

const StatCard = ({ label, value, sub, accent = "#C0392B", icon }) => (
  <div style={{
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #EDE8E3",
    padding: "20px 20px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <span style={{ fontSize: "13px", color: "#888", fontWeight: 500 }}>{label}</span>
      <div style={{
        width: "36px", height: "36px", borderRadius: "8px",
        background: accent + "1A",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "18px"
      }}>{icon}</div>
    </div>
    <div style={{ fontSize: "26px", fontWeight: 700, color: "#2C1810", lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: "12px", color: "#888" }}>{sub}</div>}
  </div>
);

const QuickAction = ({ icon, label, desc, onClick, accent = "#3D2B2B" }) => (
  <div
    onClick={onClick}
    style={{
      display: "flex", alignItems: "center", gap: "14px",
      padding: "14px 16px", borderRadius: "10px",
      border: "1px solid #EDE8E3", background: "#fff",
      cursor: "pointer", transition: "all 0.15s",
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = "#C0392B"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(192,57,43,0.08)"; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = "#EDE8E3"; e.currentTarget.style.boxShadow = "none"; }}
  >
    <div style={{
      width: "42px", height: "42px", borderRadius: "10px",
      background: accent + "15", display: "flex",
      alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0,
    }}>{icon}</div>
    <div>
      <div style={{ fontWeight: 600, fontSize: "14px", color: "#2C1810" }}>{label}</div>
      <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>{desc}</div>
    </div>
    <svg style={{ marginLeft: "auto", flexShrink: 0 }} width="16" height="16" fill="none" stroke="#C0392B" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" d="M9 5l7 7-7 7" />
    </svg>
  </div>
);

export default function SellerDashboardHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0, totalProducts: 0, pendingOrders: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const sid = user.id;

    const [shopRes, ordersRes, productsRes, orderItemsRes] = await Promise.all([
      supabase.from("shops").select("*").eq("seller_id", sid).single(),
      supabase.from("orders").select("id, status, total_amount, created_at, buyer_name").order("created_at", { ascending: false }).limit(5),
      supabase.from("products").select("id, name, stock, price").eq("seller_id", sid),
      supabase.from("order_items").select("order_id, price_at_purchase, quantity, product:products(seller_id)").eq("product.seller_id", sid),
    ]);

    setShop(shopRes.data);

    const products = productsRes.data || [];
    setLowStock(products.filter(p => p.stock <= 5).sort((a, b) => a.stock - b.stock).slice(0, 4));

    // Calc total sales from order_items for this seller
    const totalSales = (orderItemsRes.data || []).reduce((sum, i) => sum + (i.price_at_purchase * i.quantity), 0);
    const myOrderIds = new Set((orderItemsRes.data || []).map(i => i.order_id));
    const allOrders = ordersRes.data || [];
    const myOrders = allOrders.filter(o => myOrderIds.has(o.id));
    const pending = myOrders.filter(o => o.status === "pending").length;

    setStats({
      totalSales,
      totalOrders: myOrders.length,
      totalProducts: products.length,
      pendingOrders: pending,
    });
    setRecentOrders(myOrders.slice(0, 4));
    setLoading(false);
  }

  const statusBadge = (status) => {
    const map = {
      pending: { bg: "#FEF9EC", color: "#B7791F" },
      completed: { bg: "#EDFBF3", color: "#22764A" },
      cancelled: { bg: "#FEF0EE", color: "#C0392B" },
    };
    const s = map[status] || map.pending;
    return (
      <span style={{
        background: s.bg, color: s.color,
        fontSize: "11px", fontWeight: 600,
        padding: "3px 9px", borderRadius: "20px", textTransform: "capitalize",
      }}>{status}</span>
    );
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px" }}>
      <div style={{ color: "#888", fontSize: "14px" }}>Loading dashboard...</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Shop info banner */}
      {shop && (
        <div style={{
          background: "linear-gradient(135deg, #3D2B2B 0%, #5C3D3D 100%)",
          borderRadius: "14px", padding: "20px 24px",
          display: "flex", alignItems: "center", gap: "16px",
        }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "12px",
            background: shop.shop_urls ? "transparent" : "#C0392B",
            flexShrink: 0, overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {shop.shop_urls
              ? <img src={shop.shop_urls} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ color: "#fff", fontWeight: 700, fontSize: "20px" }}>{shop.name?.[0]}</span>}
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: "18px" }}>{shop.name}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginTop: "2px" }}>{shop.description}</div>
          </div>
          <button
            onClick={() => navigate("/seller/settings")}
            style={{
              marginLeft: "auto", padding: "8px 16px",
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: "8px", color: "#fff", fontWeight: 600, fontSize: "13px", cursor: "pointer",
            }}>
            Edit Shop
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        <StatCard label="Total Revenue" value={`₹${stats.totalSales.toLocaleString("en-IN")}`} sub="All time" icon="💰" accent="#22764A" />
        <StatCard label="Total Orders" value={stats.totalOrders} sub={`${stats.pendingOrders} pending`} icon="📦" accent="#C0392B" />
        <StatCard label="Products Listed" value={stats.totalProducts} sub={`${lowStock.length} low stock`} icon="🛍️" accent="#B7791F" />
        <StatCard label="Pending Orders" value={stats.pendingOrders} sub="Needs attention" icon="⏳" accent="#7C3AED" />
      </div>

      {/* Middle row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px" }}>

        {/* Recent Orders */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontWeight: 700, fontSize: "15px", color: "#2C1810" }}>Recent Orders</span>
            <button onClick={() => navigate("/seller/orders")} style={{
              background: "none", border: "none", color: "#C0392B", fontWeight: 600,
              fontSize: "13px", cursor: "pointer",
            }}>View all →</button>
          </div>
          {recentOrders.length === 0
            ? <div style={{ color: "#aaa", fontSize: "14px", padding: "20px 0", textAlign: "center" }}>No orders yet</div>
            : recentOrders.map(order => (
              <div key={order.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 0", borderBottom: "1px solid #F5F0EC",
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13.5px", color: "#2C1810" }}>
                    {order.buyer_name || "Customer"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#aaa", marginTop: "2px" }}>
                    {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontWeight: 700, fontSize: "14px", color: "#2C1810" }}>
                    ₹{order.total_amount?.toLocaleString("en-IN")}
                  </span>
                  {statusBadge(order.status)}
                </div>
              </div>
            ))}
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <div style={{ fontWeight: 700, fontSize: "15px", color: "#2C1810", marginBottom: "16px" }}>
            ⚠️ Low Stock
          </div>
          {lowStock.length === 0
            ? <div style={{ color: "#aaa", fontSize: "13px" }}>All products well-stocked!</div>
            : lowStock.map(p => (
              <div key={p.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "9px 0", borderBottom: "1px solid #F5F0EC",
              }}>
                <div style={{ fontSize: "13px", color: "#2C1810", fontWeight: 500, flex: 1, marginRight: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.name}
                </div>
                <span style={{
                  background: p.stock === 0 ? "#FEF0EE" : "#FEF9EC",
                  color: p.stock === 0 ? "#C0392B" : "#B7791F",
                  fontWeight: 700, fontSize: "12px", padding: "3px 8px", borderRadius: "6px",
                }}>{p.stock === 0 ? "Out" : `${p.stock} left`}</span>
              </div>
            ))}
          <button onClick={() => navigate("/seller/products")} style={{
            marginTop: "12px", width: "100%", padding: "9px",
            background: "none", border: "1.5px solid #EDE8E3",
            borderRadius: "8px", color: "#3D2B2B", fontWeight: 600,
            fontSize: "13px", cursor: "pointer",
          }}>
            Manage Products
          </button>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <div style={{ fontWeight: 700, fontSize: "15px", color: "#2C1810", marginBottom: "14px" }}>Quick Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          <QuickAction icon="➕" label="Add New Product" desc="List a new item in your shop" onClick={() => navigate("/seller/add-product")} />
          <QuickAction icon="📋" label="Manage Orders" desc="View and update order statuses" onClick={() => navigate("/seller/orders")} />
          <QuickAction icon="🏪" label="Edit Shop" desc="Update logo, name, description" onClick={() => navigate("/seller/settings")} />
          <QuickAction icon="📊" label="View Analytics" desc="Sales charts and performance" onClick={() => navigate("/seller/analytics")} />
          <QuickAction icon="📦" label="My Products" desc="Edit, delete, manage stock" onClick={() => navigate("/seller/products")} />
        </div>
      </div>

    </div>
  );
}