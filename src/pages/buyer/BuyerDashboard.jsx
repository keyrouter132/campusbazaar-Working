import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "./BuyerDashboard.css";

function BuyerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    fetchUser();
    fetchOrders();
  }, []);
  async function fetchRecentlyViewed(userId) {
  const { data, error } = await supabase
    .from("recently_viewed")
    .select("*, products(*)")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(4);

  if (error) console.error(error);
  else setRecentlyViewed(data || []);
}

 async function fetchUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { navigate("/login"); return; }
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();
  setUser(data || { email: user.email });
  fetchRecentlyViewed(user.id); // add this line
}
async function fetchOrders() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, products(*))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) console.error(error);
  else setOrders(data || []);
  setLoading(false);
}

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <div className="dashboard-layout">

      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <h2>CampusBazaar</h2>
        </div>

        <div className="sidebar-avatar">
          <div className="avatar-circle">
            {user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <p className="sidebar-email">{user?.email || "Loading..."}</p>
          <p className="sidebar-role">Buyer</p>
        </div>

<nav className="sidebar-nav">
  <button
    className={`sidebar-btn ${activeTab === "profile" ? "active" : ""}`}
    onClick={() => setActiveTab("profile")}
  >
    👤 My Profile
  </button>
  <button
    className={`sidebar-btn ${activeTab === "orders" ? "active" : ""}`}
    onClick={() => setActiveTab("orders")}
  >
    My Orders
  </button>

  <hr className="sidebar-divider" />

  <button className="sidebar-btn"
    onClick={() => navigate("/buyer/products")}>
    Browse Products
  </button>
  <button className="sidebar-btn"
    onClick={() => navigate("/buyer/cart")}>
    My Cart
  </button>
  <button className="sidebar-btn"
    onClick={() => navigate("/buyer/become-seller")}>
    Become a Seller
  </button>
</nav>



        <hr className="sidebar-divider" />
        <button className="logout-btn" onClick={handleLogout}>
           Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-main">

        {activeTab === "profile" && (
          <div className="dashboard-section">
            <h2>My Profile</h2>

            <div className="profile-card">
              <div className="profile-avatar-large">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="profile-details">
                <div className="profile-row">
                  <span className="profile-label">Email</span>
                  <span className="profile-value">{user?.email || "—"}</span>
                </div>
                <div className="profile-row">
                  <span className="profile-label">College ID</span>
                  <span className="profile-value">{user?.college_id || "—"}</span>
                </div>
                <div className="profile-row">
                  <span className="profile-label">Role</span>
                  <span className="profile-value profile-role-tag">
                    {user?.role || "buyer"}
                  </span>
                </div>
                <div className="profile-row">
                  <span className="profile-label">Member Since</span>
                  <span className="profile-value">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString("en-IN", {
                          year: "numeric", month: "long"
                        })
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="profile-stats">
              <div className="stat-card">
                <h3>{orders.length}</h3>
                <p>Total Orders</p>
              </div>
              
              <div className="stat-card">
                <h3>₹{orders.reduce((sum, o) => sum + (o.total_price || 0), 0)}</h3>
                <p>Total Spent</p>
              </div>
              <div className="stat-card">
                <h3>{orders.filter(o => o.status === "pending").length}</h3>
                <p>Pending Orders</p>
              </div>
            </div>
            {/* RECENTLY VIEWED */}
{recentlyViewed.length > 0 && (
  <div className="recently-viewed-section">
    <h3>Recently Viewed</h3>
    <div className="recently-viewed-grid">
      {recentlyViewed.map((item) => (
        <div
          className="rv-card"
          key={item.id}
          onClick={() => navigate(`/buyer/products/${item.product_id}`)}
        >
          <img
            src={item.products?.image_urls}
            alt={item.products?.name}
            className="rv-img"
          />
          <div className="rv-info">
            <p className="rv-name">{item.products?.name}</p>
            <p className="rv-price">₹{item.products?.price}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="dashboard-section">
            <h2>My Orders</h2>

            {loading ? (
              <p>Loading orders...</p>
            ) : orders.length === 0 ? (
              <div className="empty-orders">
                <p>You haven't placed any orders yet.</p>
                <button className="browse-btn"
                  onClick={() => navigate("/buyer/products")}>
                  Browse Products
                </button>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <div className="order-card" key={order.id}>
                    <div className="order-card-header">
                      <div>
                        <p className="order-id">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="order-date">
                          {new Date(order.created_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "long", year: "numeric"
                          })}
                        </p>
                      </div>
                      <span className={`order-status ${order.status}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="order-items-list">
                      {order.order_items?.map((item) => (
                        <div className="order-item-row" key={item.id}>
                          <img
                            src={item.products?.image_urls}
                            alt={item.products?.name}
                            className="order-item-img"
                          />
                          <div>
                            <p className="order-item-name">{item.products?.name}</p>
                            <p className="order-item-qty">Qty: {item.quantity}</p>
                          </div>
                          <p className="order-item-price">
                            ₹{item.price * item.quantity}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="order-card-footer">
                      <span>Payment: <strong>{order.payment_method}</strong></span>
                      <span className="order-total">Total: ₹{order.total_price}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

export default BuyerDashboard;