import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import Navbar from "../../components/Navbar";
import ProductCard from "../../components/ProductCard";
import "./ShopPage.css";

function ShopPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShop();
    fetchShopProducts();
  }, [id]);

  async function fetchShop() {
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("id", id)
      .single();
    if (error) console.error(error);
    else setShop(data);
  }

  async function fetchShopProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("shop_id", id);
    if (error) console.error(error);
    else setProducts(data);
    setLoading(false);
  }

  if (loading) return <div><Navbar /><p style={{ padding: "40px" }}>Loading...</p></div>;
  if (!shop) return <div><Navbar /><p style={{ padding: "40px" }}>Shop not found.</p></div>;

  return (
    <div className="shop-page-wrapper">
      <Navbar />

      {/* PINK HERO BANNER */}
      <div className="shop-banner">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <button className="all-shops-btn" onClick={() => navigate("/shops")}>Browse All Shops</button>
      </div>

      <div className="shop-page">

        {/* SHOP HEADER CARD */}
        <div className="shop-header">
          <img
            src={shop.shop_urls}
            alt={shop.name}
            className="shop-logo"
            onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${shop.name}&background=5C3A2E&color=fff&size=128`}
          />
          <div className="shop-info">
            <h1>{shop.name}</h1>
            {shop.Category && (
              <span className="shop-category-tag">{shop.Category}</span>
            )}
            <p className="shop-description">{shop.description}</p>
            <div className="shop-meta">
              <span>🗓 Member since {new Date(shop.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long" })}</span>
              <span>📦 {products.length} Products</span>
            </div>
            <button
              className="contact-seller-btn"
              onClick={() => navigate(`/buyer/chat/${shop.seller_id}`)}
            >
             Contact Seller
            </button>
          </div>
        </div>

        {/* SHOP PRODUCTS */}
        <div className="shop-products-section">
          <h2>Products</h2>
          {products.length === 0 ? (
            <div className="no-products">
              <p>No products listed yet.</p>
            </div>
          ) : (
            <div className="shop-card-row">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default ShopPage;