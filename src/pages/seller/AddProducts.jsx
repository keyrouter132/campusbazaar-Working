import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addProduct } from "../../services/productService";
import { supabase } from "../../supabaseClient";

/* ─── constants ─────────────────────────────────────────────────────────── */
export const PRODUCT_CATEGORIES = [
  "Electronics", "Clothing & Fashion", "Books & Stationery",
  "Food & Beverages", "Accessories", "Sports & Fitness",
  "Art & Craft", "Health & Beauty", "Services", "Other",
];

/* ─── shared style helpers ──────────────────────────────────────────────── */
export const inputStyle = {
  padding: "10px 13px", borderRadius: "8px",
  border: "1.5px solid #EDE8E3", fontSize: "14px",
  color: "#2C1810", background: "#fff", outline: "none",
  fontFamily: "inherit", width: "100%", boxSizing: "border-box",
  transition: "border-color 0.15s",
};

export const InputGroup = ({ label, required, hint, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
    <label style={{ fontSize: "13px", fontWeight: 600, color: "#3D2B2B" }}>
      {label}{required && <span style={{ color: "#C0392B" }}> *</span>}
    </label>
    {children}
    {hint && <span style={{ fontSize: "11.5px", color: "#aaa" }}>{hint}</span>}
  </div>
);

const focus   = e => (e.target.style.borderColor = "#C0392B");
const unfocus = e => (e.target.style.borderColor = "#EDE8E3");

/* ─── hook: fetch seller's shops ────────────────────────────────────────── */
export function useSellerShops() {
  const [shops,   setShops]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("shops")
        .select("id, name")
        .eq("seller_id", user.id)
        .order("name");
      setShops(data || []);
      setLoading(false);
    })();
  }, []);

  return { shops, loading };
}

/* ─── shared ProductForm ────────────────────────────────────────────────── */
export function ProductForm({
  form, handleChange, handleImageChange,
  preview, handleSubmit, submitting, submitLabel, onCancel,
  shops, shopsLoading,
}) {
  const noShops = !shopsLoading && shops.length === 0;

  return (
    <div style={{ maxWidth: "700px" }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* ── no-shop warning ───────────────────────────────────── */}
        {noShops && (
          <div style={{
            background: "#FEF0EE", border: "1px solid #f5c6c0",
            borderRadius: "10px", padding: "14px 18px",
            fontSize: "13.5px", color: "#8B1A1A",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <span style={{ fontSize: "18px" }}>⚠️</span>
            <span>
              You don't have any shops yet.{" "}
              <a href="/seller/shops" style={{ color: "#C0392B", fontWeight: 700, textDecoration: "underline" }}>
                Create a shop first
              </a>{" "}
              before adding products.
            </span>
          </div>
        )}

        {/* ── shop + category ───────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #EDE8E3", padding: "24px" }}>
          <div style={{ fontWeight: 700, fontSize: "15px", color: "#2C1810", marginBottom: "18px" }}>
            Shop &amp; Category
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>

            <InputGroup label="Shop" required hint="Which of your shops sells this?">
              {shopsLoading ? (
                <div style={{ ...inputStyle, color: "#aaa", lineHeight: "1.4" }}>Loading shops…</div>
              ) : (
                <select
                  name="shop_id" value={form.shop_id || ""}
                  onChange={handleChange} required
                  style={inputStyle} onFocus={focus} onBlur={unfocus}
                >
                  <option value="" disabled>Select a shop…</option>
                  {shops.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </InputGroup>

            <InputGroup label="Category" required>
              <select
                name="category" value={form.category || ""}
                onChange={handleChange} required
                style={inputStyle} onFocus={focus} onBlur={unfocus}
              >
                <option value="" disabled>Select a category…</option>
                {PRODUCT_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </InputGroup>
          </div>
        </div>

        {/* ── product details ───────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #EDE8E3", padding: "24px" }}>
          <div style={{ fontWeight: 700, fontSize: "15px", color: "#2C1810", marginBottom: "18px" }}>
            Product Details
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <InputGroup label="Product Name" required>
              <input
                style={inputStyle} name="name" value={form.name}
                onChange={handleChange} required
                placeholder="e.g. Handmade Bookmark Set"
                onFocus={focus} onBlur={unfocus}
              />
            </InputGroup>

            <InputGroup label="Description" required>
              <textarea
                style={{ ...inputStyle, minHeight: "90px", resize: "vertical", lineHeight: 1.6 }}
                name="description" value={form.description}
                onChange={handleChange} required
                placeholder="Describe your product…"
                onFocus={focus} onBlur={unfocus}
              />
            </InputGroup>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <InputGroup label="Price (₹)" required>
                <input
                  style={inputStyle} type="number" name="price"
                  value={form.price} onChange={handleChange}
                  required min="0" step="0.01" placeholder="0.00"
                  onFocus={focus} onBlur={unfocus}
                />
              </InputGroup>
              <InputGroup label="Stock Quantity" required>
                <input
                  style={inputStyle} type="number" name="stock"
                  value={form.stock} onChange={handleChange}
                  required min="0" placeholder="0"
                  onFocus={focus} onBlur={unfocus}
                />
              </InputGroup>
            </div>
          </div>
        </div>

        {/* ── image ─────────────────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #EDE8E3", padding: "24px" }}>
          <div style={{ fontWeight: 700, fontSize: "15px", color: "#2C1810", marginBottom: "18px" }}>
            Product Image
          </div>

          {preview && (
            <div style={{ marginBottom: "14px", borderRadius: "10px", overflow: "hidden", maxHeight: "240px" }}>
              <img src={preview} alt="preview" style={{ width: "100%", objectFit: "cover", maxHeight: "240px" }} />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <InputGroup label="Upload Image" hint="PNG, JPG, WEBP up to 10 MB">
              <label style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 14px", border: "1.5px dashed #C0392B",
                borderRadius: "8px", cursor: "pointer",
                color: "#C0392B", fontWeight: 600, fontSize: "13px",
              }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Choose file
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
              </label>
            </InputGroup>

            <InputGroup label="Or paste image URL">
              <input
                style={inputStyle} name="image_urls"
                value={form.image_urls} onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                onFocus={focus} onBlur={unfocus}
              />
            </InputGroup>
          </div>
        </div>

        {/* ── actions ───────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="button" onClick={onCancel}
            style={{
              flex: 1, padding: "13px", background: "none",
              border: "1.5px solid #EDE8E3", borderRadius: "10px",
              color: "#3D2B2B", fontWeight: 700, fontSize: "14px", cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || noShops}
            style={{
              flex: 2, padding: "13px",
              background: (submitting || noShops) ? "#bbb" : "#C0392B",
              color: "#fff", border: "none", borderRadius: "10px",
              fontWeight: 700, fontSize: "14px",
              cursor: (submitting || noShops) ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {submitting ? "Please wait…" : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─── AddProduct page ────────────────────────────────────────────────────── */
export const AddProduct = () => {
  const navigate = useNavigate();
  const { shops, loading: shopsLoading } = useSellerShops();

  const [form, setForm] = useState({
    name: "", description: "", price: "", stock: "",
    image_urls: "", shop_id: "", category: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview,   setPreview]   = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting,setSubmitting]= useState(false);

  /* auto-select if seller has exactly one shop */
  useEffect(() => {
    if (shops.length === 1) setForm(f => ({ ...f, shop_id: shops[0].id }));
  }, [shops]);

  const handleChange      = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleImageChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const uploadImage = async () => {
    if (!imageFile) return form.image_urls;
    setUploading(true);
    try {
      const fileName = `${Date.now()}-${imageFile.name}`;
      const { error } = await supabase.storage.from("product-images").upload(fileName, imageFile);
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err) {
      alert("Image upload failed: " + err.message);
      return form.image_urls;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.shop_id)   { alert("Please select a shop.");     return; }
    if (!form.category)  { alert("Please select a category."); return; }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const imageUrl = await uploadImage();
      await addProduct({
        name:        form.name,
        description: form.description,
        price:       Number(form.price),
        stock:       Number(form.stock),
        image_urls:  imageUrl,
        shop_id:     form.shop_id,
        category:    form.category,
        seller_id:   user?.id,
      });
      navigate(`/seller/products?shop=${form.shop_id}`);
    } catch (err) {
      alert("Failed to add product: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const label = uploading ? "Uploading image…" : submitting ? "Adding product…" : "Add Product";

  return (
    <ProductForm
      form={form}
      handleChange={handleChange}
      handleImageChange={handleImageChange}
      preview={preview || form.image_urls}
      handleSubmit={handleSubmit}
      submitting={submitting || uploading}
      submitLabel={label}
      onCancel={() => navigate("/seller/products")}
      shops={shops}
      shopsLoading={shopsLoading}
    />
  );
};

export default AddProduct;