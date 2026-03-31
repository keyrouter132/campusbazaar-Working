// function SellerApprovals() {
//   return (
//     <div style={{ display: 'flex',minHeight: '100vh',width: '100vw',color: 'black',
//       }}
//     >
//       {/* Sidebar */}
//       <div style={{ width: '220px',padding: '10px',minHeight: '100vh',backgroundColor: 'rgb(196 161 161)',borderRight: '8px solid rgb(56 48 48 / 33%)',
//         }}
//       >
//         <h3>Admin Panel</h3>
//         <p>Dashboard</p>
//         <p>Seller Approvals</p>
//       </div>

//       {/* Main Content */}
//       <div style={{padding: '20px',backgroundColor: 'white',flex: 1,
//         }}
//       >
//         <h1>Pending Seller Approvals</h1>

//         {/* Dummy seller card */}
//         <div
//           style={{ padding: '15px', marginBottom: '15px', border: '1px solid #ccc',borderRadius: '8px',boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
//           }}
//         >
//           <p><b>UID:</b> 2305034</p>
//           <p><b>Name:</b> Sample User</p>
//           <p><b>Class/Position:</b>Student</p>
//           <p><b>Category:</b> Bakery</p>
//           <p><b>Shop Name:</b>Bakehouse</p>
//           <p><b>Shop Description:</b>Serves fresh cookies, cupcakes,bombolonies and chocoloate delicacies</p>
//           <button>Approve</button>
//         </div> 
//          {/* Another dummy seller */}
//         <div
//           style={{ padding: '15px', marginBottom: '15px', border: '1px solid #ccc',borderRadius: '8px',boxShadow: '0 2px 6px rgba(0,0,0,0.1)',transition: 'transform 0.2s ease, box-shadow 0.2s ease'
//           }}
//         >
//           <p><b>UID:</b> 2305036</p>
//           <p><b>Name:</b> Sample User2</p>
//           <p><b>Class/Position:</b>Faculty</p>
//           <p><b>Category:</b> Study Notes</p>
//           <p><b>Shop Name:</b>EasyMath</p>
//           <p><b>Shop Description:</b>Easy math solutions and notes to crack the End Sems </p>
//           <button>Approve</button>
//         </div> 
//          <div
//           style={{ padding: '15px', marginBottom: '15px', border: '1px solid #ccc',borderRadius: '8px',boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
//           }}
//         >
//           <p><b>UID:</b> 2305036</p>
//           <p><b>Name:</b> Sample User2</p>
//           <p><b>Class/Position:</b>Faculty</p>
//           <p><b>Category:</b> Study Notes</p>
//           <p><b>Shop Name:</b>EasyMath</p>
//           <p><b>Shop Description:</b>Easy math solutions and notes to crack the End Sems </p>
//           <button>Approve</button>
//         </div> 


       
        
//       </div>
//     </div>
//   );
// }

// export default SellerApprovals;

import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { AdminLayout } from "./AdminLayout";
import './AdminDashboard.css';

function SellerApprovals() {
  const [sellers, setSellers] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from("seller_requests")
      .select("status");

    if (!error) {
      let pending = 0, approved = 0, rejected = 0;
      data.forEach(item => {
        if (item.status === "pending")  pending++;
        if (item.status === "approved") approved++;
        if (item.status === "rejected") rejected++;
      });
      setStats({ pending, approved, rejected });
    }
  };

  const fetchSellerRequests = async () => {
    const { data, error } = await supabase
      .from("seller_requests")
      .select(`
        id,
        college_id,
        shop_name,
        shop_description,
        category,
        college_users (
          name,
          class_or_designation
        )
      `)
      .eq("status", "pending");

    if (error) {
      console.error("Fetch error:", error);
    } else {
      setSellers(data || []);
    }
  };
  useEffect(() => {
    fetchSellerRequests();
    fetchStats();
  }, []);

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleApprove = async (seller) => {
    if (!window.confirm(`Approve ${seller.shop_name}?`)) return;

    try {
      // 1. Get the user's UUID from the users table
      const { data: userData, error: userErr } = await supabase
        .from("users")
        .select("id")
        .eq("college_id", seller.college_id)
        .single();

      if (userErr || !userData) {
        showMessage("User account not found for this College ID", "error");
        return;
      }

      const userUuid = userData.id;

      // 2. Update seller_request status to approved
      const { error: reqErr } = await supabase
        .from("seller_requests")
        .update({ status: "approved" })
        .eq("id", seller.id);

      if (reqErr) throw reqErr;

      // 3. Update user role and seller_status
      const { error: userUpdateErr } = await supabase
        .from("users")
        .update({ role: "seller", seller_status: "approved" })
        .eq("id", userUuid);

      if (userUpdateErr) throw userUpdateErr;

      // 4. Create the shop record — DO NOT touch products here at all.
      //    Products are added by the seller themselves after approval.
      const { error: shopErr } = await supabase
        .from("shops")
        .insert([{
          seller_id: userUuid,
          name: seller.shop_name,
          description: seller.shop_description,
          Category: seller.category,   // matches your schema column name
        }]);

      if (shopErr) throw shopErr;

      setSellers(prev => prev.filter(item => item.id !== seller.id));
      showMessage("Seller approved! Shop created successfully.", "success");
      fetchStats();

    } catch (err) {
      console.error("Approval Error:", err);
      showMessage("Approval failed. Check console.", "error");
    }
  };

  const handleReject = async (requestId, college_id) => {
    if (!window.confirm("Reject this seller?")) return;

    const { error: r } = await supabase
      .from("seller_requests")
      .update({ status: "rejected" })
      .eq("id", requestId);

    const { error: u } = await supabase
      .from("users")
      .update({ seller_status: "rejected" })
      .eq("college_id", college_id);

    if (r || u) {
      showMessage("Error rejecting seller", "error");
    } else {
      setSellers(prev => prev.filter(s => s.id !== requestId));
      showMessage("Seller rejected successfully", "success");
      fetchStats();
    }
  };

  return (
    <AdminLayout pageTitle="Seller Approvals">
      <h1>Seller Approvals</h1>

      {/* Stats Row */}
      <div className="approval-stats-row">
        <div className="approval-stat pending">
          <span className="stat-num">{stats.pending}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="approval-stat approved">
          <span className="stat-num">{stats.approved}</span>
          <span className="stat-label">Approved</span>
        </div>
        <div className="approval-stat rejected">
          <span className="stat-num">{stats.rejected}</span>
          <span className="stat-label">Rejected</span>
        </div>
      </div>

      {/* Toast */}
      {message && (
        <div className={`toast-message ${messageType}`}>
          {message}
        </div>
      )}

      {/* Empty State */}
      {sellers.length === 0 && (
        <div className="empty-state-card">
          <p>No pending seller approvals.</p>
        </div>
      )}

      {/* Seller Cards */}
      <div className="seller-cards-list">
        {sellers.map((seller) => (
          <div className="seller-card" key={seller.id}>
            <div className="seller-card-header">
              <div className="seller-avatar">
                {seller.college_users?.name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div className="seller-card-header-info">
                <p className="seller-name">{seller.college_users?.name ?? "N/A"}</p>
                <p className="seller-meta">
                  {seller.college_users?.class_or_designation ?? "N/A"} · ID: {seller.college_id}
                </p>
              </div>
              <span className="badge-pending">Pending</span>
            </div>

            <div className="seller-card-body">
              <div className="seller-field">
                <span className="field-key">Shop Name</span>
                <span className="field-val">{seller.shop_name}</span>
              </div>
              <div className="seller-field">
                <span className="field-key">Category</span>
                <span className="field-val">{seller.category}</span>
              </div>
              <div className="seller-field full">
                <span className="field-key">Description</span>
                <span className="field-val">{seller.shop_description}</span>
              </div>
            </div>

            <div className="seller-card-footer">
              <button
                className="approve-btn"
                onClick={() => handleApprove(seller)}
              >
                Approve
              </button>
              <button
                className="reject-btn"
                onClick={() => handleReject(seller.id, seller.college_id)}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}

export default SellerApprovals;