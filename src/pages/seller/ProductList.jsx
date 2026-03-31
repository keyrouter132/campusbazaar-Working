import { useEffect, useState } from "react";

import { getProductsBySeller, deleteProduct } from "../../services/productService";
import { supabase } from "../../supabaseClient";

import { useSearchParams, useNavigate } from "react-router-dom";


const StockBadge = ({ stock }) => {
  if (stock === 0) return <span style={{ background: "#FEF0EE", color: "#C0392B", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px" }}>Out of stock</span>;
  if (stock <= 5) return <span style={{ background: "#FEF9EC", color: "#B7791F", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px" }}>Low: {stock} left</span>;
  return <span style={{ background: "#EDFBF3", color: "#22764A", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px" }}>{stock} in stock</span>;
};

export default function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [deleting, setDeleting] = useState(null);
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shop");

  const [shops, setShops] = useState([]);
  const [currentShop, setCurrentShop] = useState(null);

  const fetchProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const seller_id = user?.id || "fbd0dc93-a1eb-4b5b-975e-55e78fe1ff79";
      const data = await getProductsBySeller(seller_id, shopId);
      setProducts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {fetchProducts();}, [shopId]);

  async function fetchShops() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("shops")
      .select("id, name")
      .eq("seller_id", user.id)
      .order("name");

    setShops(data || []);
  }

  useEffect(() => {fetchShops();}, []);

  useEffect(() => {
    if (!shopId || shops.length === 0) return;

    const shop = shops.find(s => s.id === shopId);
    setCurrentShop(shop);
  }, [shopId, shops]);

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deleteProduct(id);
      setProducts(p => p.filter(x => x.id !== id));
    } catch {
      alert("Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  const filtered = products
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "stock") return a.stock - b.stock;
      return a.name.localeCompare(b.name);
    });

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px" }}>
      <span style={{ color: "#888", fontSize: "14px" }}>Loading products...</span>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <svg style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} width="16" height="16" fill="none" stroke="#aaa" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "10px 12px 10px 38px",
              borderRadius: "8px", border: "1.5px solid #EDE8E3",
              fontSize: "14px", color: "#2C1810", fontFamily: "inherit",
              outline: "none", background: "#fff",
            }}
          />
        </div>
        <select
          value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{
            padding: "10px 14px", borderRadius: "8px",
            border: "1.5px solid #EDE8E3", background: "#fff",
            fontSize: "13.5px", color: "#3D2B2B", fontWeight: 600,
            cursor: "pointer", outline: "none",
          }}>
          <option value="name">Sort: Name</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
          <option value="stock">Stock: Low → High</option>
        </select>
        <button
          onClick={() => navigate("/seller/add-product")}
          style={{
            padding: "10px 18px", borderRadius: "8px",
            background: "#C0392B", color: "#fff",
            border: "none", fontWeight: 700, fontSize: "13.5px",
            cursor: "pointer", whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: "6px",
          }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Shop Header + Dropdown */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px"
      }}>
        
        {/* Current Shop Name */}
        <div style={{ fontWeight: 700, fontSize: "16px" }}>
          {shopId ? `${currentShop?.name || "Shop"} Products` : "All Products"}
        </div>

        {/* Shop Switch Dropdown */}
        <select
          value={shopId || ""}
          onChange={(e) => {
            const selected = e.target.value;
            if (selected) {
              navigate(`/seller/products?shop=${selected}`);
            } else {
              navigate(`/seller/products`);
            }
          }}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #EDE8E3",
            fontSize: "13px"
          }}
        >
          <option value="">All Shops</option>
          {shops.map(shop => (
            <option key={shop.id} value={shop.id}>
              {shop.name}
            </option>
          ))}
        </select>
      </div>

      {/* Count */}
      <div style={{ fontSize: "13px", color: "#888" }}>
        {filtered.length} of {products.length} products
        {search && ` matching "${search}"`}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{
          background: "#fff", borderRadius: "12px", border: "1px solid #EDE8E3",
          padding: "60px", textAlign: "center",
        }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
          <div style={{ color: "#888", fontSize: "14px" }}>
            {search ? `No products found for "${search}"` : "No products yet. Add your first product!"}
          </div>
          {!search && (
            <button onClick={() => navigate("/seller/add-product")} style={{
              marginTop: "16px", padding: "10px 20px",
              background: "#3D2B2B", color: "#fff",
              border: "none", borderRadius: "8px",
              fontWeight: 600, fontSize: "13px", cursor: "pointer",
            }}>
              Add First Product
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "16px",
        }}>
          {filtered.map(product => (
            <div key={product.id} style={{
              background: "#fff", borderRadius: "12px",
              border: "1px solid #EDE8E3", overflow: "hidden",
              display: "flex", flexDirection: "column",
              transition: "box-shadow 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
            >
              {/* Image */}
              <div style={{ height: "160px", background: "#F7F4F0", overflow: "hidden", position: "relative" }}>
                <img
                  src={product.image_urls || "https://via.placeholder.com/300x200?text=No+Image"}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={e => { e.target.src = "https://via.placeholder.com/300x200?text=No+Image"; }}
                />
                <div style={{ position: "absolute", top: "8px", right: "8px" }}>
                  <StockBadge stock={product.stock} />
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: "14px", flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#2C1810", lineHeight: 1.3 }}>
                  {product.name}
                </div>
                {product.description && (
                  <div style={{
                    fontSize: "12px", color: "#888", lineHeight: 1.5,
                    display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {product.description}
                  </div>
                )}
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#C0392B", marginTop: "4px" }}>
                  ₹{product.price?.toLocaleString("en-IN")}
                </div>
              </div>

              {/* Actions */}
              <div style={{ padding: "12px 14px", borderTop: "1px solid #F5F0EC", display: "flex", gap: "8px" }}>
                <button
                  onClick={() => navigate(`/seller/edit-product/${product.id}`)}
                  style={{
                    flex: 1, padding: "8px",
                    background: "#3D2B2B", color: "#fff",
                    border: "none", borderRadius: "7px",
                    fontSize: "12.5px", fontWeight: 600, cursor: "pointer",
                  }}>
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id, product.name)}
                  disabled={deleting === product.id}
                  style={{
                    flex: 1, padding: "8px",
                    background: "none", color: "#C0392B",
                    border: "1.5px solid #C0392B", borderRadius: "7px",
                    fontSize: "12.5px", fontWeight: 600, cursor: "pointer",
                    opacity: deleting === product.id ? 0.5 : 1,
                  }}>
                  {deleting === product.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}