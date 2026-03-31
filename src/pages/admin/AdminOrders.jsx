import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { AdminLayout } from "./AdminLayout";
import './AdminDashboard.css';

/*
  ORDERS PAGE — Add your logic here when your orders table is ready.

  Expected Supabase table structure (adjust to match yours):
    orders (
      id, buyer_id, seller_id, item_id, status, total_price, created_at
    )

  To populate this page:
  1. Replace the mock data below with a real supabase.from("orders").select(...)
  2. Join with users/items tables as needed
  3. Add filter/sort controls if needed
*/

// ── Placeholder until real orders table exists ──
const MOCK_ORDERS = [
  // Uncomment and adapt once your orders table is live:
  // { id: "1", buyer: "Alice", item: "Notebook", status: "delivered", price: 120, date: "2024-03-01" },
];

const STATUS_STYLES = {
  pending:   { bg: "#fff5e6", color: "#b97a10", label: "Pending"   },
  delivered: { bg: "#edf7f1", color: "#2e7d52", label: "Delivered" },
  cancelled: { bg: "#fdf0f0", color: "#b03030", label: "Cancelled" },
};

function AdminOrders() {
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    /*
      REPLACE THIS with your real fetch once orders table is set up.
      Example:
        const { data, error } = await supabase
          .from("orders")
          .select("id, status, total_price, created_at, users(name), items(name)")
          .order("created_at", { ascending: false });
        if (!error) setOrders(data);
    */
    setLoading(false);
  }, []);

  return (
    <AdminLayout pageTitle="Orders">
      <h1>Orders</h1>

      {loading && <p className="muted-text">Loading orders...</p>}

      {!loading && orders.length === 0 && (
        <div className="empty-state-card">
          <p className="empty-state-title">No orders yet</p>
          <p className="empty-state-sub">
            Orders will appear here once your orders table is connected.
          </p>
        </div>
      )}

      {orders.length > 0 && (
        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Buyer</th>
                <th>Item</th>
                <th>Status</th>
                <th>Price</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const style = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
                return (
                  <tr key={order.id}>
                    <td className="order-id">#{order.id}</td>
                    <td>{order.buyer}</td>
                    <td>{order.item}</td>
                    <td>
                      <span
                        className="order-status-badge"
                        style={{ background: style.bg, color: style.color }}
                      >
                        {style.label}
                      </span>
                    </td>
                    <td>₹{order.price}</td>
                    <td className="order-date">{order.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminOrders;
