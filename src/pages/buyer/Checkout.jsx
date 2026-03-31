import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "./Checkout.css";

function Checkout() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  const [address, setAddress] = useState({
    fullName: "", phone: "", hostel: "", room: "", landmark: ""
  });

  const [payment, setPayment] = useState("upi");

  useEffect(() => {
    fetchCart();
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  async function fetchCart() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("cart")
        .select("*, products(*)")
        .eq("user_id", user.id);

      if (error) {
        console.error("Cart fetch error:", error);
        setLoading(false);
        return;
      }

      console.log("🛒 Cart fetched:", data);
      setCartItems(data || []);
    } catch (err) {
      console.error("Cart fetch exception:", err);
    } finally {
      setLoading(false);
    }
  }

  const total = cartItems.reduce(
    (sum, item) => sum + (item.products?.price ?? 0) * item.quantity, 0
  );

  // ✅ Check if any item in cart is out of stock
  const hasOutOfStock = cartItems.some(
    (item) => (item.products?.stock ?? 0) < item.quantity
  );

  function handleAddressChange(e) {
    setAddress({ ...address, [e.target.name]: e.target.value });
  }

  async function handlePlaceOrder() {
    if (!address.fullName || !address.phone || !address.hostel) {
      alert("Please fill in all required fields.");
      return;
    }
    if (address.phone.length !== 10) {
      alert("Enter valid 10-digit phone number");
      return;
    }
    if (hasOutOfStock) {
      alert("Some items in your cart are out of stock. Please remove them before proceeding.");
      return;
    }

    setPlacing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const buyer_id = user.id;
      const cashfree_order_id = "order_" + Date.now();

      // ✅ STEP 1: Re-check stock live before placing
      for (const item of cartItems) {
        const { data: freshProduct } = await supabase
          .from("products")
          .select("stock, name")
          .eq("id", item.product_id)
          .single();

        if (!freshProduct || freshProduct.stock < item.quantity) {
          alert(`"${item.products.name}" only has ${freshProduct?.stock ?? 0} left in stock. Please update your cart.`);
          setPlacing(false);
          return;
        }
      }

      // ✅ STEP 2: Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          buyer_id,
          user_id: buyer_id,
          status: "pending",
          total_amount: total,
          payment_method: "cashfree",
          cashfree_order_id,
          delivery_address: `${address.hostel}, Room ${address.room}, ${address.landmark}`,
          buyer_name: address.fullName,
          buyer_phone: address.phone,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // ✅ STEP 3: Insert order_items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: item.products.price,
        seller_id: item.products.seller_id || null,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // ✅ STEP 4: Call Cashfree backend
      const res = await fetch("http://localhost:5000/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: cashfree_order_id,
          amount: Number(total),
          customer_id: buyer_id,
          customer_phone: address.phone,
        }),
      });

      const cfData = await res.json();

      if (!res.ok || !cfData.payment_session_id) {
        throw new Error(cfData.error || "Payment session creation failed");
      }

      // ✅ STEP 5: Launch Cashfree
      const cashfree = window.Cashfree({ mode: "sandbox" });
      cashfree.checkout({
        paymentSessionId: cfData.payment_session_id,
        redirectTarget: "_self",
      });

    } catch (err) {
      console.error("Payment Error:", err);
      alert("Payment initiation failed: " + err.message);
      setPlacing(false);
    }
  }

  if (loading) return <div className="checkout-page">Loading...</div>;

  return (
    <div className="checkout-page">
      <h2>Checkout</h2>
      <div className="checkout-layout">

        {/* LEFT */}
        <div className="checkout-left">
          <div className="checkout-section">
            <h3>Delivery Address</h3>
            <input type="text" name="fullName" placeholder="Full Name *"
              value={address.fullName} onChange={handleAddressChange} />
            <input type="tel" name="phone" placeholder="Phone Number *"
              value={address.phone} onChange={handleAddressChange} />
            <input type="text" name="hostel" placeholder="Hostel / Building Name *"
              value={address.hostel} onChange={handleAddressChange} />
            <input type="text" name="room" placeholder="Room / Flat Number"
              value={address.room} onChange={handleAddressChange} />
            <input type="text" name="landmark" placeholder="Landmark (optional)"
              value={address.landmark} onChange={handleAddressChange} />
          </div>

          <div className="checkout-section">
            <h3>Payment Method</h3>
            <div className="payment-options">
              {[
                { value: "upi", label: "UPI", icon: "📱" },
                { value: "card", label: "Card", icon: "💳" },
              ].map((option) => (
                <div key={option.value}
                  className={`payment-option ${payment === option.value ? "selected" : ""}`}
                  onClick={() => setPayment(option.value)}>
                  <span className="payment-icon">{option.icon}</span>
                  <span>{option.label}</span>
                  <span className="payment-radio">{payment === option.value ? "●" : "○"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="checkout-right">
          <div className="checkout-section">
            <h3>Order Summary</h3>
            <div className="summary-items">
              {cartItems.map((item) => {
                const stock = item.products?.stock ?? 0;
                const isOutOfStock = stock === 0;
                const isLowStock = stock > 0 && stock <= 3;
                const isInsufficientStock = stock > 0 && stock < item.quantity;

                return (
                  <div className="summary-item" key={item.id}
                    style={{ opacity: isOutOfStock ? 0.6 : 1 }}>
                    <div style={{ position: "relative" }}>
                      <img
                        src={Array.isArray(item.products?.image_urls)
                          ? item.products.image_urls[0]
                          : item.products?.image_urls}
                        alt={item.products?.name}
                        className="summary-img"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                      {/* ✅ Out of stock overlay on image */}
                      {isOutOfStock && (
                        <div style={{
                          position: "absolute", inset: 0,
                          backgroundColor: "rgba(0,0,0,0.45)",
                          borderRadius: 8,
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>OUT OF STOCK</span>
                        </div>
                      )}
                    </div>

                    <div className="summary-info">
                      <p className="summary-name">{item.products?.name}</p>
                      <p className="summary-qty">Qty: {item.quantity}</p>

                      {/* ✅ Stock status badges */}
                      {isOutOfStock && (
                        <p style={{ color: "#ef4444", fontSize: 11, fontWeight: 600, margin: "2px 0 0" }}>
                          ❌ Out of stock
                        </p>
                      )}
                      {isInsufficientStock && (
                        <p style={{ color: "#f59e0b", fontSize: 11, fontWeight: 600, margin: "2px 0 0" }}>
                          ⚠️ Only {stock} left — reduce quantity
                        </p>
                      )}
                      {isLowStock && !isInsufficientStock && (
                        <p style={{ color: "#f59e0b", fontSize: 11, fontWeight: 600, margin: "2px 0 0" }}>
                          🔥 Only {stock} left!
                        </p>
                      )}
                    </div>

                    <p className="summary-price"
                      style={{ color: isOutOfStock ? "#ccc" : undefined }}>
                      ₹{(item.products?.price ?? 0) * item.quantity}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="summary-totals">
              <div className="summary-row"><span>Subtotal</span><span>₹{total}</span></div>
              <div className="summary-row">
                <span>Delivery</span><span className="free-tag">Free</span>
              </div>
              <div className="summary-row total-row"><span>Total</span><span>₹{total}</span></div>
            </div>

            {/* ✅ Warn if out of stock items present */}
            {hasOutOfStock && (
              <div style={{
                backgroundColor: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 8, padding: "10px 14px", marginBottom: 12,
                color: "#dc2626", fontSize: 13, fontWeight: 500
              }}>
                ❌ Remove out-of-stock items from your cart to proceed.
              </div>
            )}

            <button
              className="place-order-btn"
              onClick={handlePlaceOrder}
              disabled={placing || hasOutOfStock}
              style={{ opacity: hasOutOfStock ? 0.5 : 1, cursor: hasOutOfStock ? "not-allowed" : "pointer" }}
            >
              {placing ? "Processing..." : `Pay Now • ₹${total}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;