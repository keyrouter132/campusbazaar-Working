// import { useEffect, useState } from "react";
// import { supabase } from "../../supabaseClient";
// import { getOrdersBySeller, updateOrderStatus } from "../../services/orderService";

// const Orders = () => {
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // Fetch orders
//   const fetchOrders = async () => {
//     try {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();

//       if (!user) {
//         alert("User not logged in");
//         return;
//       }

//       const data = await getOrdersBySeller(user.id);
//       setOrders(data);
//     } catch (error) {
//       console.error(error);
//       alert("Error fetching orders");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchOrders();
//   }, []);

//   // Update status
//   const handleStatusChange = async (orderId, newStatus) => {
//     try {
//       await updateOrderStatus(orderId, newStatus);
//       alert("Order updated!");
//       fetchOrders(); // refresh
//     } catch (error) {
//       alert("Failed to update order");
//     }
//   };

//   if (loading) return <p>Loading orders...</p>;

//   return (
//     <div style={{ padding: "20px" }}>
//       <h2>Seller Orders</h2>

//       {orders.length === 0 ? (
//         <p>No orders yet</p>
//       ) : (
//         orders.map((order) => (
//           <div key={order.id} style={{ border: "1px solid #ccc", marginBottom: "15px", padding: "10px" }}>
            
//             <p><strong>Order ID:</strong> {order.id}</p>
//             <p><strong>Status:</strong> {order.status}</p>
//             <p><strong>Total:</strong> ₹{order.total_amount}</p>

//             <h4>Items:</h4>
//             {order.order_items.map((item, index) => (
//               <div key={index}>
//                 <p>
//                   {item.product?.name} — {item.quantity} × ₹{item.price_at_purchase}
//                 </p>
//               </div>
//             ))}

//             <br />

//             {/* Status buttons */}
//             {order.status === "pending" && (
//               <>
//                 <button onClick={() => handleStatusChange(order.id, "completed")}>
//                   Mark Completed
//                 </button>

//                 <button onClick={() => handleStatusChange(order.id, "cancelled")}>
//                   Cancel
//                 </button>
//               </>
//             )}
//           </div>
//         ))
//       )}
//     </div>
//   );
// };

// export default Orders;

import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { getOrdersBySeller, updateOrderStatus } from "../../services/orderService";

const STATUS_OPTIONS = ["all", "pending", "completed", "cancelled"];

const statusStyle = {
  pending: { bg: "#FEF9EC", color: "#B7791F" },
  completed: { bg: "#EDFBF3", color: "#22764A" },
  cancelled: { bg: "#FEF0EE", color: "#C0392B" },
};

const Badge = ({ status }) => {
  const s = statusStyle[status] || statusStyle.pending;
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: "11px", fontWeight: 600,
      padding: "4px 10px", borderRadius: "20px", textTransform: "capitalize",
    }}>{status}</span>
  );
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const data = await getOrdersBySeller(user.id);
      setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatus(orderId, status) {
    setUpdating(orderId);
    try {
      await updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (err) {
      alert("Failed to update");
    } finally {
      setUpdating(null);
    }
  }

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px" }}>
      <span style={{ color: "#888", fontSize: "14px" }}>Loading orders...</span>
    </div>
  );

  const summaryCount = (s) => orders.filter(o => o.status === s).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
        {["pending", "completed", "cancelled"].map(s => (
          <div key={s} style={{
            background: "#fff", borderRadius: "12px", border: "1px solid #EDE8E3",
            padding: "16px 20px", cursor: "pointer",
            outline: filter === s ? "2px solid #C0392B" : "none",
          }} onClick={() => setFilter(filter === s ? "all" : s)}>
            <div style={{ fontSize: "12px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{s}</div>
            <div style={{ fontSize: "26px", fontWeight: 700, color: statusStyle[s].color }}>{summaryCount(s)}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "6px" }}>
        {STATUS_OPTIONS.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: "7px 16px", borderRadius: "20px",
            border: "1px solid #EDE8E3",
            background: filter === s ? "#3D2B2B" : "#fff",
            color: filter === s ? "#fff" : "#555",
            fontSize: "13px", fontWeight: 600, cursor: "pointer",
            textTransform: "capitalize",
          }}>{s === "all" ? `All (${orders.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${summaryCount(s)})`}</button>
        ))}
      </div>

      {/* Orders Table */}
      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #EDE8E3", overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#aaa", fontSize: "14px" }}>
            No {filter === "all" ? "" : filter} orders found.
          </div>
        ) : filtered.map((order, idx) => (
          <div key={order.id}>
            {/* Order Row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 120px 140px 120px",
                gap: "12px",
                alignItems: "center",
                padding: "14px 20px",
                borderBottom: "1px solid #F5F0EC",
                cursor: "pointer",
                background: expanded === order.id ? "#FDFAF8" : "transparent",
                transition: "background 0.15s",
              }}
              onClick={() => setExpanded(expanded === order.id ? null : order.id)}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "13.5px", color: "#2C1810" }}>
                  {order.buyer_name || "Customer"}
                </div>
                <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px", fontFamily: "monospace" }}>
                  #{order.id.slice(0, 8)}
                </div>
              </div>
              <div style={{ fontSize: "12px", color: "#888" }}>
                {order.delivery_address || "—"}
              </div>
              <div>
                <Badge status={order.status} />
              </div>
              <div style={{ fontWeight: 700, fontSize: "15px", color: "#2C1810" }}>
                ₹{order.total_amount?.toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: "12px", color: "#aaa" }}>
                {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
              </div>
            </div>

            {/* Expanded detail */}
            {expanded === order.id && (
              <div style={{ padding: "0 20px 16px 20px", background: "#FDFAF8", borderBottom: "1px solid #F0EBE6" }}>
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px", fontWeight: 600 }}>ORDER ITEMS</div>
                  {order.order_items?.map((item, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "7px 0", borderBottom: "1px solid #F0EBE6",
                      fontSize: "13.5px",
                    }}>
                      <span style={{ color: "#2C1810" }}>{item.product?.name || "Product"}</span>
                      <span style={{ color: "#888" }}>×{item.quantity}</span>
                      <span style={{ fontWeight: 600, color: "#2C1810" }}>₹{(item.price_at_purchase * item.quantity).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>

                {order.payment_method && (
                  <div style={{ fontSize: "12px", color: "#888", marginBottom: "10px" }}>
                    Payment: <span style={{ color: "#3D2B2B", fontWeight: 600 }}>{order.payment_method}</span>
                  </div>
                )}

                {/* Actions */}
                {order.status === "pending" && (
                  <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                    <button
                      disabled={updating === order.id}
                      onClick={(e) => { e.stopPropagation(); handleStatus(order.id, "completed"); }}
                      style={{
                        padding: "8px 18px", borderRadius: "8px",
                        background: "#22764A", color: "#fff", border: "none",
                        fontWeight: 600, fontSize: "13px", cursor: "pointer",
                        opacity: updating === order.id ? 0.6 : 1,
                      }}>
                      ✓ Mark Completed
                    </button>
                    <button
                      disabled={updating === order.id}
                      onClick={(e) => { e.stopPropagation(); handleStatus(order.id, "cancelled"); }}
                      style={{
                        padding: "8px 18px", borderRadius: "8px",
                        background: "none", color: "#C0392B",
                        border: "1.5px solid #C0392B",
                        fontWeight: 600, fontSize: "13px", cursor: "pointer",
                        opacity: updating === order.id ? 0.6 : 1,
                      }}>
                      Cancel Order
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}