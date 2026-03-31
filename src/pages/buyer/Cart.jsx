// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { supabase } from "../../supabaseClient";
// import "./Cart.css";

// function Cart() {
//   const [cartItems, setCartItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     fetchCart();
//   }, []);

// async function fetchCart() {
//   const { data: { user } } = await supabase.auth.getUser();
//   if (!user) { setLoading(false); return; }

//   const { data, error } = await supabase
//     .from("cart")
//     .select("*, products(*)")
//     .eq("user_id", user.id);  // only this user's items

//   if (error) console.error(error);
//   else setCartItems(data);
//   setLoading(false);
// }
  
// async function removeItem(cartId) {
//   await supabase.from("cart").delete().eq("id", cartId);
//   fetchCart();
// }

//   async function updateQuantity(cartId, newQty) {
//     if (newQty < 1) return;
//     await supabase.from("cart").update({ quantity: newQty }).eq("id", cartId);
//     fetchCart();
//   }

//   const total = cartItems.reduce((sum, item) =>
//     sum + item.products.price * item.quantity, 0);

//   if (loading) return <div className="cart-page">Loading...</div>;

//   return (
//     <div className="cart-page">
//       <h2>Your Cart</h2>

//       {cartItems.length === 0 ? (
//         <div className="cart-empty">
//           <p>Your cart is empty.</p>
//           <button className="continue-btn" onClick={() => navigate("/buyer/products")}>
//             Browse Products
//           </button>
//         </div>
//       ) : (
//         <>
//           <div className="cart-list">
//             {cartItems.map((item) => (
//               <div className="cart-item" key={item.id}>
//                 <img
//                   src={item.products.image_urls}
//                   alt={item.products.name}
//                   className="cart-item-img"
//                 />
//                 <div className="cart-item-info">
//                   <h4>{item.products.name}</h4>
//                   <p className="cart-item-category">{item.products.category}</p>
//                   <p className="cart-item-price">₹{item.products.price} each</p>
//                 </div>
//                 <div className="cart-item-right">
//                   <div className="cart-qty">
//                     <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
//                     <span>{item.quantity}</span>
//                     <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
//                   </div>
//                   <p className="cart-item-total">₹{item.products.price * item.quantity}</p>
//                   <button className="remove-btn" onClick={() => removeItem(item.id)}>
//                     Remove
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>

//           <div className="cart-footer">
//             <div>
//               <p className="cart-total-label">Total Amount</p>
//               <h3 className="cart-total">₹{total}</h3>
//             </div>
//             <div className="cart-footer-btns">
//               <button className="continue-btn" onClick={() => navigate("/buyer/products")}>
//                 Continue Shopping
//               </button>
//              <button className="checkout-btn" onClick={() => navigate("/buyer/checkout")}>
//   Proceed to Checkout
// </button>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// export default Cart

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "./Cart.css";

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
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

      setCartItems(data || []);
    } catch (err) {
      console.error("Cart exception:", err);
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(cartId) {
    await supabase.from("cart").delete().eq("id", cartId);
    fetchCart();
  }

  async function updateQuantity(cartId, newQty, maxStock) {
    if (newQty < 1) return;
    // ✅ Hard cap at available stock
    if (newQty > maxStock) {
      alert(`Only ${maxStock} in stock!`);
      return;
    }
    await supabase.from("cart").update({ quantity: newQty }).eq("id", cartId);
    fetchCart();
  }

  const total = cartItems.reduce((sum, item) =>
    sum + (item.products?.price ?? 0) * item.quantity, 0);

  // ✅ Block checkout if any item exceeds stock
  const hasStockIssue = cartItems.some(
    (item) => item.quantity > (item.products?.stock ?? 0)
  );

  if (loading) return <div className="cart-page">Loading...</div>;

  return (
    <div className="cart-page">
      <h2>Your Cart</h2>

      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <p>Your cart is empty.</p>
          <button className="continue-btn" onClick={() => navigate("/buyer/products")}>
            Browse Products
          </button>
        </div>
      ) : (
        <>
          <div className="cart-list">
            {cartItems.map((item) => {
              const stock = item.products?.stock ?? 0;
              const isOutOfStock = stock === 0;
              const isOverStock = item.quantity > stock;
              const isLowStock = stock > 0 && stock <= 3;

              return (
                <div className="cart-item" key={item.id}
                  style={{ opacity: isOutOfStock ? 0.6 : 1 }}>
                  <img
                    src={
                      Array.isArray(item.products?.image_urls)
                        ? item.products.image_urls[0]
                        : item.products?.image_urls
                    }
                    alt={item.products?.name}
                    className="cart-item-img"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                  <div className="cart-item-info">
                    <h4>{item.products?.name}</h4>
                    <p className="cart-item-category">
                      {item.products?.category || item.products?.Category}
                    </p>
                    <p className="cart-item-price">₹{item.products?.price} each</p>

                    {/* ✅ Stock status badges */}
                    {isOutOfStock && (
                      <p style={{ color: "#ef4444", fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                        ❌ Out of stock — please remove
                      </p>
                    )}
                    {isOverStock && !isOutOfStock && (
                      <p style={{ color: "#f59e0b", fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                        ⚠️ Only {stock} available — reduce quantity
                      </p>
                    )}
                    {isLowStock && !isOverStock && (
                      <p style={{ color: "#f59e0b", fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                        🔥 Only {stock} left!
                      </p>
                    )}
                  </div>

                  <div className="cart-item-right">
                    <div className="cart-qty">
                      {/* ✅ Minus button */}
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1, stock)}
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <span style={{ color: isOverStock ? "#ef4444" : undefined }}>
                        {item.quantity}
                      </span>
                      {/* ✅ Plus button disabled at stock limit */}
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1, stock)}
                        disabled={isOutOfStock || item.quantity >= stock}
                        style={{
                          opacity: (isOutOfStock || item.quantity >= stock) ? 0.4 : 1,
                          cursor: (isOutOfStock || item.quantity >= stock) ? "not-allowed" : "pointer"
                        }}
                      >
                        +
                      </button>
                    </div>
                    <p className="cart-item-total"
                      style={{ color: isOverStock ? "#ef4444" : undefined }}>
                      ₹{(item.products?.price ?? 0) * item.quantity}
                    </p>
                    <button className="remove-btn" onClick={() => removeItem(item.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cart-footer">
            <div>
              <p className="cart-total-label">Total Amount</p>
              <h3 className="cart-total">₹{total}</h3>
            </div>
            <div className="cart-footer-btns">
              <button className="continue-btn" onClick={() => navigate("/buyer/products")}>
                Continue Shopping
              </button>

              {/* ✅ Checkout blocked if stock issues */}
              {hasStockIssue ? (
                <div style={{ textAlign: "right" }}>
                  <button className="checkout-btn" disabled
                    style={{ opacity: 0.5, cursor: "not-allowed" }}>
                    Proceed to Checkout
                  </button>
                  <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>
                    Fix stock issues above to continue
                  </p>
                </div>
              ) : (
                <button className="checkout-btn" onClick={() => navigate("/buyer/checkout")}>
                  Proceed to Checkout
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;