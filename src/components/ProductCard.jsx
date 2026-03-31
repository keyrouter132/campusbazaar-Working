// import { Link } from "react-router-dom";
// import "./ProductCard.css";

// function ProductCard({ product }) {
//   if (!product) return null;

//   return (
//     <div className="product-card">
//       <div className="product-image-wrapper">
//         <img src={product.image_urls} alt={product.name} />
//       </div>

//       <div className="product-card-info">
//         <h3 className="product-name">{product.name}</h3>
//         <p className="product-price">₹{product.price}</p>

//         <Link to={`/buyer/products/${product.id}`} className="view-btn">
//           View Details
//         </Link>
//       </div>
//     </div>
//   );
// }

// export default ProductCard;


import { Link } from "react-router-dom";
import "./ProductCard.css";

function ProductCard({ product }) {
  if (!product) return null;

  const stock = product.stock ?? 0;
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= 3;

  return (
    <div className="product-card" style={{ opacity: isOutOfStock ? 0.75 : 1 }}>
      <div className="product-image-wrapper" style={{ position: "relative" }}>
        <img
          src={product.image_urls}
          alt={product.name}
          style={{ opacity: isOutOfStock ? 0.5 : 1 }}
        />

        {/* ✅ Out of stock overlay on image */}
        {isOutOfStock && (
          <div style={{
            position: "absolute", inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <span style={{
              color: "#fff", fontWeight: 700, fontSize: 13,
              background: "rgba(239,68,68,0.9)",
              padding: "4px 12px", borderRadius: 6,
              letterSpacing: 0.5
            }}>
              OUT OF STOCK
            </span>
          </div>
        )}

        {/* ✅ Low stock badge — top corner */}
        {isLowStock && (
          <div style={{
            position: "absolute", top: 8, left: 8,
            backgroundColor: "#fffbeb", color: "#d97706",
            border: "1px solid #fde68a",
            borderRadius: 6, padding: "2px 8px",
            fontSize: 11, fontWeight: 700
          }}>
            🔥 Only {stock} left
          </div>
        )}
      </div>

      <div className="product-card-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">₹{product.price}</p>

        {/* ✅ Disabled View Details if out of stock */}
        {isOutOfStock ? (
          <span style={{
            display: "inline-block",
            padding: "8px 16px", borderRadius: 8,
            backgroundColor: "#f3f4f6", color: "#9ca3af",
            fontSize: 13, fontWeight: 500,
            cursor: "not-allowed"
          }}>
            Out of Stock
          </span>
        ) : (
          <Link to={`/buyer/products/${product.id}`} className="view-btn">
            View Details
          </Link>
        )}
      </div>
    </div>
  );
}

export default ProductCard;