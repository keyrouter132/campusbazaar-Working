import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "./ProductDetails.css";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [cartMsg, setCartMsg] = useState("");
  const [shop, setShop] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState({ rating: 5, comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  useEffect(() => {
    async function fetchProduct() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) console.error(error);
      else {
        setProduct(data);
        // ✅ use whichever column name exists
        const cat = data.category || data.Category;
        if (cat) fetchRelated(cat, data.id);
        saveRecentlyViewed(data.id);
        fetchReviews(data.id);

        if (data.shop_id) {
          const { data: shopData } = await supabase
            .from("shops")
            .select("*")
            .eq("id", data.shop_id)
            .single();
          if (shopData) setShop(shopData);
        }
      }
      setLoading(false);
    }
    fetchProduct();
  }, [id]);

  async function fetchReviews(productId) {
    const { data, error } = await supabase
      .from("reviews")
      .select("*, users(email)")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    else setReviews(data || []);
  }

  async function saveRecentlyViewed(productId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("recently_viewed")
      .upsert({
        user_id: user.id,
        product_id: productId,
        viewed_at: new Date().toISOString()
      }, { onConflict: "user_id,product_id" });
  }

  async function fetchRelated(category, currentId) {
    // ✅ try both column name casings
    let { data } = await supabase
      .from("products")
      .select("*")
      .eq("category", category)
      .neq("id", currentId)
      .limit(3);

    if (!data || data.length === 0) {
      const res = await supabase
        .from("products")
        .select("*")
        .eq("Category", category)
        .neq("id", currentId)
        .limit(3);
      data = res.data;
    }
    if (data) setRelated(data);
  }

  async function handleAddToCart() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }

    const stock = product.stock ?? 0;

    // ✅ Check if already out of stock
    if (stock === 0) {
      setCartMsg("❌ This item is out of stock.");
      return;
    }

    // ✅ Check existing cart quantity for this user+product
    const { data: existing } = await supabase
      .from("cart")
      .select("*")
      .eq("product_id", product.id)
      .eq("user_id", user.id)
      .single();

    const alreadyInCart = existing?.quantity ?? 0;
    const totalRequested = alreadyInCart + quantity;

    if (totalRequested > stock) {
      const canAdd = stock - alreadyInCart;
      if (canAdd <= 0) {
        setCartMsg(`⚠️ You already have all ${stock} in your cart.`);
      } else {
        setCartMsg(`⚠️ Only ${canAdd} more can be added (stock: ${stock}).`);
      }
      return;
    }

    if (existing) {
      await supabase
        .from("cart")
        .update({ quantity: totalRequested })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("cart")
        .insert({ product_id: product.id, quantity, user_id: user.id });
    }

    navigate("/buyer/cart");
  }

  async function handleSubmitReview() {
    if (!currentUser) { setReviewMsg("Please login to leave a review."); return; }
    setSubmitting(true);
    const { error } = await supabase
      .from("reviews")
      .insert({
        product_id: product.id,
        user_id: currentUser.id,
        rating: userReview.rating,
        comment: userReview.comment,
      });
    if (error) { setReviewMsg("Error submitting review."); console.error(error); }
    else { setReviewMsg("Review submitted! ✅"); setUserReview({ rating: 5, comment: "" }); fetchReviews(product.id); }
    setSubmitting(false);
  }

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  if (loading) return <div className="pd-container">Loading...</div>;
  if (!product) return <div className="pd-container">Product not found.</div>;

  const stock = product.stock ?? 0;
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= 3;

  return (
    <div className="pd-container">
      <div className="pd-card">
        <div className="pd-layout">

          {/* LEFT — IMAGE */}
          <div className="pd-image-box" style={{ position: "relative" }}>
            {product.image_urls
              ? <img src={product.image_urls} alt={product.name} className="pd-image"
                  style={{ opacity: isOutOfStock ? 0.5 : 1 }} />
              : <div className="pd-image-placeholder">No Image</div>
            }
            {/* ✅ Out of stock overlay */}
            {isOutOfStock && (
              <div style={{
                position: "absolute", inset: 0,
                backgroundColor: "rgba(0,0,0,0.45)",
                borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <span style={{
                  color: "#fff", fontWeight: 700, fontSize: 16,
                  background: "rgba(239,68,68,0.85)", padding: "6px 16px", borderRadius: 8
                }}>
                  OUT OF STOCK
                </span>
              </div>
            )}
          </div>

          {/* RIGHT — DETAILS */}
          <div className="pd-info">
            {(product.category || product.Category) && (
              <span className="pd-category">{product.category || product.Category}</span>
            )}

            <h2>{product.name}</h2>

            <div className="pd-rating-summary">
              <span className="pd-stars">
                {"★".repeat(Math.round(avgRating))}
                {"☆".repeat(5 - Math.round(avgRating))}
              </span>
              <span className="pd-avg">{avgRating} / 5</span>
              <span className="pd-review-count">({reviews.length} reviews)</span>
            </div>

            <p className="pd-price">₹{product.price}</p>
            <p className="pd-desc">{product.description}</p>

            {/*  Stock status badge */}
            {isOutOfStock && (
              <div style={{
                display: "inline-block", backgroundColor: "#fef2f2",
                color: "#dc2626", border: "1px solid #fecaca",
                borderRadius: 8, padding: "6px 14px", fontSize: 13,
                fontWeight: 600, marginBottom: 12
              }}>
                ❌ Out of Stock
              </div>
            )}
            {isLowStock && (
              <div style={{
                display: "inline-block", backgroundColor: "#fffbeb",
                color: "#d97706", border: "1px solid #fde68a",
                borderRadius: 8, padding: "6px 14px", fontSize: 13,
                fontWeight: 600, marginBottom: 12
              }}>
                🔥 Only {stock} left!
              </div>
            )}
            {!isOutOfStock && !isLowStock && (
              <div style={{
                display: "inline-block", backgroundColor: "#f0fdf4",
                color: "#16a34a", border: "1px solid #bbf7d0",
                borderRadius: 8, padding: "6px 14px", fontSize: 13,
                fontWeight: 600, marginBottom: 12
              }}>
                ✓ In Stock 
              </div>
            )}

            <p className="pd-seller">
              🏪 Sold by:{" "}
              <strong
                style={{ cursor: "pointer", color: "#5C3A2E", textDecoration: "underline" }}
                onClick={() => shop && navigate(`/shop/${shop.id}`)}
              >
                {shop ? shop.name : "Campus Seller"}
              </strong>
            </p>

            {/* ✅ Quantity selector — capped at stock */}
            {!isOutOfStock && (
              <div className="pd-quantity">
                <span>Quantity:</span>
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >−</button>
                <span className="pd-qty-num">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(stock, q + 1))}
                  disabled={quantity >= stock}
                  style={{
                    opacity: quantity >= stock ? 0.4 : 1,
                    cursor: quantity >= stock ? "not-allowed" : "pointer"
                  }}
                >+</button>
              </div>
            )}

            {cartMsg && (
              <div style={{
                backgroundColor: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 8, padding: "8px 14px", fontSize: 13,
                color: "#dc2626", fontWeight: 500, marginTop: 8
              }}>
                {cartMsg}
              </div>
            )}

            <div className="pd-actions">
              <button
                className="primary-btn"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                style={{
                  opacity: isOutOfStock ? 0.5 : 1,
                  cursor: isOutOfStock ? "not-allowed" : "pointer"
                }}
              >
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </button>
              <button
                className="secondary-btn"
                onClick={() => shop?.seller_id && navigate(`/buyer/chat/${shop.seller_id}`)}
              >
                Chat with Seller
              </button>
            </div>

            <div className="pd-back">
              <Link to="/buyer/products">
                <button className="outline-btn">Back to Products</button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* REVIEWS SECTION */}
      <div className="pd-reviews-section">
        <h3>Customer Reviews</h3>
        {currentUser ? (
          <div className="pd-review-form">
            <h4>Leave a Review</h4>
            <div className="pd-star-select">
              {[1,2,3,4,5].map(star => (
                <span key={star}
                  onClick={() => setUserReview(r => ({ ...r, rating: star }))}
                  style={{ cursor: "pointer", fontSize: "24px",
                    color: star <= userReview.rating ? "#f4a261" : "#ccc" }}>★</span>
              ))}
            </div>
            <textarea
              placeholder="Write your review..."
              value={userReview.comment}
              onChange={(e) => setUserReview(r => ({ ...r, comment: e.target.value }))}
              className="pd-review-textarea" rows={3}
            />
            <button className="primary-btn" onClick={handleSubmitReview} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
            {reviewMsg && <p style={{ color: "#5C3A2E", marginTop: "8px" }}>{reviewMsg}</p>}
          </div>
        ) : (
          <p style={{ color: "#999", marginBottom: "16px" }}>
            <Link to="/login" style={{ color: "#5C3A2E" }}>Login</Link> to leave a review.
          </p>
        )}

        {reviews.length === 0 ? (
          <p style={{ color: "#999", fontStyle: "italic" }}>No reviews yet. Be the first!</p>
        ) : (
          <div className="pd-reviews-list">
            {reviews.map((r) => (
              <div className="pd-review-card" key={r.id}>
                <div className="pd-review-top">
                  <span className="pd-review-name">{r.users?.email?.split("@")[0] || "User"}</span>
                  <span className="pd-review-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                </div>
                <p className="pd-review-comment">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RELATED PRODUCTS */}
      {related.length > 0 && (
        <div className="pd-related-section">
          <h3>You may also like</h3>
          <div className="pd-related-grid">
            {related.map((item) => (
              <Link to={`/buyer/products/${item.id}`} key={item.id} className="pd-related-card">
                <img src={item.image_urls} alt={item.name} className="pd-related-img" />
                <p className="pd-related-name">{item.name}</p>
                <p className="pd-related-price">₹{item.price}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetails;