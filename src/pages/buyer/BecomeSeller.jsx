import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "./BecomeSeller.css";

function BecomeSeller() {
  const [formData, setFormData] = useState({
    college_id: "",
    shop_name: "",
    shop_description: "",
    category: "",
  });

  const [existingStatus, setExistingStatus] = useState(null); // null | "pending" | "approved" | "rejected"
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkExistingRequest = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("users")
        .select("college_id, seller_status")
        .eq("id", user.id)
        .single();

      if (!userData) return;

      // Auto-fill college_id from logged in user
      setFormData(prev => ({ ...prev, college_id: userData.college_id }));

      // Check if a seller_request already exists
      const { data: existingReq } = await supabase
        .from("seller_requests")
        .select("status")
        .eq("college_id", userData.college_id)
        .single();

      if (existingReq) {
        setExistingStatus(existingReq.status);
      }
    };

    checkExistingRequest();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!formData.shop_name || !formData.shop_description || !formData.category) {
      setMessage("Please fill in all fields.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("seller_requests")
        .insert([{
          college_id: formData.college_id,
          shop_name: formData.shop_name,
          shop_description: formData.shop_description,
          category: formData.category,
          status: "pending",
        }]);

      if (error) throw error;

      // Update seller_status in users table to "pending"
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from("users")
        .update({ seller_status: "pending" })
        .eq("id", user.id);

      setExistingStatus("pending");

    } catch (err) {
      console.error(err);
      setMessage("Submission failed. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // Already pending — show status only, no form
  if (existingStatus === "pending") {
    return (
      <div className="become-seller-container">
        <div className="become-seller-card">
          <h2>Application Submitted!</h2>
          <p className="intro">
            Your seller application is currently under review by the admin.
            You'll be notified once a decision is made.
          </p>
          <p className="status">Application Status: Pending Admin Approval</p>
          <div className="button-row">
            <Link to="/buyer">
              <button className="cancel-btn">Back to Home</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main form — shown for new applicants OR rejected users reapplying
  return (
    <div className="become-seller-container">
      <div className="become-seller-card">
        <h2>Seller Application</h2>
        <p className="intro">
          Complete this form to apply for seller privileges.
          Your request will be reviewed by the admin before approval.
        </p>

        {existingStatus === "rejected" && (
          <p className="status" style={{ color: "red" }}>
            Your previous application was rejected. You may reapply below.
          </p>
        )}

        {message && (
          <p className={`status ${messageType}`}>{message}</p>
        )}

        <div className="form-group">
          <label>College UID</label>
          <input
            type="text"
            name="college_id"
            value={formData.college_id}
            readOnly
          />
        </div>

        <div className="form-group">
          <label>Shop Name</label>
          <input
            type="text"
            name="shop_name"
            placeholder="Enter your shop name"
            value={formData.shop_name}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Shop Description</label>
          <textarea
            name="shop_description"
            placeholder="Describe your shop and what you sell"
            rows="4"
            value={formData.shop_description}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Product Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="">Select product type</option>
            <option>Food & Beverages</option>
            <option>Gifting</option>
            <option>Thrift Clothing</option>
            <option>Stationery</option>
            <option>Accessories</option>
            <option>Home Decor</option>
            <option>Ceramic Ware</option>
          </select>
        </div>

        <div className="button-row">
          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
          <Link to="/buyer">
            <button className="cancel-btn">Cancel</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default BecomeSeller;