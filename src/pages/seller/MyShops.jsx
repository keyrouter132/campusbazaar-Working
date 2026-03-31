
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const CATEGORIES = [
  "Electronics", "Clothing & Fashion", "Books & Stationery",
  "Food & Beverages", "Accessories", "Sports & Fitness",
  "Art & Craft", "Health & Beauty", "Services", "Other",
];

const iStyle = {
  padding: "10px 13px", borderRadius: "8px",
  border: "1.5px solid #EDE8E3", fontSize: "14px",
  color: "#2C1810", background: "#fff", outline: "none",
  fontFamily: "inherit", width: "100%", boxSizing: "border-box",
};
const fo = e => (e.target.style.borderColor = "#C0392B");
const bl = e => (e.target.style.borderColor = "#EDE8E3");

const Field = ({ label, required, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <label style={{ fontSize: 13, fontWeight: 600, color: "#3D2B2B" }}>
      {label}{required && <span style={{ color: "#C0392B" }}> *</span>}
    </label>
    {children}
  </div>
);

/* ── ShopCard ───────────────────────────────────────────────────────────── */
function ShopCard({ shop, productCount, onEdit, onViewProducts }) {
  const initial = (shop.name || "S").charAt(0).toUpperCase();
  return (
    <div
      style={{
        background: "#fff", borderRadius: 14, border: "1px solid #EDE8E3",
        overflow: "hidden", display: "flex", flexDirection: "column",
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
    >
      <div style={{
        height: 90, background: "#F7F4F0", position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
      }}>
        {shop.shop_urls ? (
          <img src={shop.shop_urls} alt={shop.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { e.target.style.display = "none"; }} />
        ) : (
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            background: "#3D2B2B", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 22,
          }}>{initial}</div>
        )}
        {shop.Category && (
          <span style={{
            position: "absolute", top: 8, right: 8,
            background: "rgba(61,43,43,0.85)", color: "#fff",
            fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
          }}>{shop.Category}</span>
        )}
      </div>

      <div style={{ padding: "14px 16px 10px", flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#2C1810", marginBottom: 4 }}>{shop.name}</div>
        <div style={{
          fontSize: 12.5, color: "#888", lineHeight: 1.5, marginBottom: 10,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{shop.description || "No description yet."}</div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: "#F7F4F0", borderRadius: 6,
          padding: "4px 10px", fontSize: 12, color: "#5C3D3D", fontWeight: 600,
        }}>
          📦 {productCount} product{productCount !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ padding: "10px 12px", borderTop: "1px solid #F5F0EC", display: "flex", gap: 8 }}>
        <button onClick={() => onViewProducts(shop.id)} style={{
          flex: 1, padding: "8px 0", borderRadius: 7,
          background: "#3D2B2B", color: "#fff",
          border: "none", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
        }}>View Products</button>
        <button onClick={() => onEdit(shop)} style={{
          flex: 1, padding: "8px 0", borderRadius: 7,
          background: "none", color: "#3D2B2B",
          border: "1.5px solid #EDE8E3",
          fontSize: 12.5, fontWeight: 600, cursor: "pointer",
        }}>Edit</button>
      </div>
    </div>
  );
}

/* ── ShopModal ──────────────────────────────────────────────────────────── */
function ShopModal({ shop, userId, onClose, onSaved }) {
  const isEdit = !!shop;
  const [form, setForm] = useState({
    name:        shop?.name        ?? "",
    description: shop?.description ?? "",
    Category:    shop?.Category    ?? "",
    shop_urls:   shop?.shop_urls   ?? "",
  });
  const [logoFile,    setLogoFile]    = useState(null);
  const [logoPreview, setLogoPreview] = useState(shop?.shop_urls ?? null);
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState(null);

  const set     = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const pickLogo = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async shopId => {
    if (!logoFile) return form.shop_urls || "";
    const name = `logo-${shopId}-${Date.now()}`;
    const { error } = await supabase.storage.from("shop-logos").upload(name, logoFile, { upsert: true });
    if (error) throw error;
    return supabase.storage.from("shop-logos").getPublicUrl(name).data.publicUrl;
  };

  // ✅ DELETE FUNCTION (PLACE HERE)
  const handleDeleteShop = async (shopId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this shop?\nAll products will be permanently deleted."
    );

    if (!confirmDelete) return;

    try {
      setSaving(true);

      const { error: productError } = await supabase
        .from("products")
        .delete()
        .eq("shop_id", shopId);

      if (productError) throw productError;

      const { error: shopError } = await supabase
        .from("shops")
        .delete()
        .eq("id", shopId);

      if (shopError) throw shopError;

      alert("Shop deleted successfully");

      onSaved();
      onClose();

    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete shop");
      setSaving(false);
    }
  };


  const submit = async e => {
    e.preventDefault();
    if (!form.name.trim()) { setMsg({ type: "error", text: "Shop name is required." }); return; }
    setSaving(true); setMsg(null);
    try {
      if (isEdit) {
        const url = await uploadLogo(shop.id);
        const { error } = await supabase.from("shops")
          .update({ name: form.name, description: form.description, Category: form.Category, shop_urls: url })
          .eq("id", shop.id);
        if (error) throw error;
      } else {
        const { data: created, error } = await supabase.from("shops")
          .insert({ name: form.name, description: form.description, Category: form.Category, seller_id: userId })
          .select().single();
        if (error) throw error;
        const url = await uploadLogo(created.id);
        if (url) await supabase.from("shops").update({ shop_urls: url }).eq("id", created.id);
      }
      setMsg({ type: "success", text: isEdit ? "Shop updated!" : "Shop created!" });
      setTimeout(() => { onSaved(); onClose(); }, 800);
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Something went wrong." });
      setSaving(false);
    }

  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.38)",
        zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 460,
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 16px 56px rgba(0,0,0,0.18)",
      }}>
        <div style={{
          padding: "20px 24px 16px", borderBottom: "1px solid #EDE8E3",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "sticky", top: 0, background: "#fff", zIndex: 1,
        }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#2C1810" }}>
            {isEdit ? "Edit Shop" : "Create New Shop"}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#aaa", lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={submit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 70, height: 70, borderRadius: 12, flexShrink: 0,
              background: "#F7F4F0", border: "2px dashed #C0392B",
              overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {logoPreview
                ? <img src={logoPreview} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 26 }}>🏪</span>}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{
                display: "inline-block", padding: "7px 14px",
                background: "#3D2B2B", color: "#fff",
                borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                alignSelf: "flex-start",
              }}>
                {logoFile ? "Change Logo" : "Upload Logo"}
                <input type="file" accept="image/*" onChange={pickLogo} style={{ display: "none" }} />
              </label>
              {logoFile && <span style={{ fontSize: 11, color: "#22764A" }}>✓ {logoFile.name}</span>}
              <input
                style={{ ...iStyle, fontSize: 12, padding: "7px 10px" }}
                name="shop_urls" value={form.shop_urls}
                onChange={set} placeholder="Or paste logo URL"
                onFocus={fo} onBlur={bl}
              />
            </div>
          </div>

          <Field label="Shop Name" required>
            <input style={iStyle} name="name" value={form.name} onChange={set} required
              placeholder="e.g. Neha's Stationery" onFocus={fo} onBlur={bl} />
          </Field>

          <Field label="Description">
            <textarea style={{ ...iStyle, minHeight: 70, resize: "vertical", lineHeight: 1.6 }}
              name="description" value={form.description} onChange={set}
              placeholder="What do you sell?" onFocus={fo} onBlur={bl} />
          </Field>

          <Field label="Category">
            <select style={iStyle} name="Category" value={form.Category} onChange={set} onFocus={fo} onBlur={bl}>
              <option value="">Select a category…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          {msg && (
            <div style={{
              padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: msg.type === "success" ? "#EDFBF3" : "#FEF0EE",
              color:      msg.type === "success" ? "#22764A"  : "#C0392B",
            }}>
              {msg.type === "success" ? "✓ " : "⚠ "}{msg.text}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 4 }}>

            {/* 🗑️ DELETE BUTTON (ONLY IN EDIT MODE) */}
            {isEdit && (
              <button
                type="button"
                onClick={() => handleDeleteShop(shop.id)}
                style={{
                  padding: "11px 16px",
                  background: "#fff",
                  border: "1.5px solid #E53935",
                  borderRadius: 9,
                  color: "#E53935",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Delete Shop
              </button>
            )}

            {/* RIGHT SIDE BUTTONS */}
            <div style={{ display: "flex", gap: 10, flex: 1, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: 11,
                  background: "none",
                  border: "1.5px solid #EDE8E3",
                  borderRadius: 9,
                  color: "#3D2B2B",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: 11,
                  background: saving ? "#bbb" : "#C0392B",
                  color: "#fff",
                  border: "none",
                  borderRadius: 9,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Shop"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── MyShops page ───────────────────────────────────────────────────────── */
export default function MyShops() {
  const navigate = useNavigate();
  const [shops,         setShops]         = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [userId,        setUserId]        = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [modalShop,     setModalShop]     = useState(undefined); // undefined=closed | null=create | obj=edit
  const [activeShop, setActiveShop] = useState(null);
  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true); setError(null);
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error("Not authenticated.");
      setUserId(user.id);

      const { data: shopData, error: shopErr } = await supabase
        .from("shops").select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });
      if (shopErr) throw shopErr;

      const list = shopData || [];
      setShops(list);

      if (list.length > 0) {
        const { data: prods } = await supabase
          .from("products").select("shop_id").in("shop_id", list.map(s => s.id));
        const counts = {};
        (prods || []).forEach(p => { counts[p.shop_id] = (counts[p.shop_id] || 0) + 1; });
        setProductCounts(counts);
      }
    } catch (err) {
      setError(err.message || "Failed to load shops.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <span style={{ color: "#888", fontSize: 14 }}>Loading your shops…</span>
    </div>
  );

  if (error) return (
    <div style={{
      background: "#FEF0EE", border: "1px solid #f5c6c0", borderRadius: 12,
      padding: "20px 24px", color: "#8B1A1A", fontSize: 14,
      display: "flex", alignItems: "center", gap: 14,
    }}>
      ⚠️ {error}
      <button onClick={load} style={{
        padding: "5px 14px", background: "#C0392B", color: "#fff",
        border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 13,
      }}>Retry</button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "#888" }}>
          {shops.length} shop{shops.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={() => setModalShop(null)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "10px 18px", borderRadius: 8,
            background: "#C0392B", color: "#fff",
            border: "none", fontWeight: 700, fontSize: 13.5, cursor: "pointer",
          }}
        >
          + New Shop
        </button>
      </div>

      {shops.length === 0 ? (
        <div style={{
          background: "#fff", borderRadius: 14, border: "1px solid #EDE8E3",
          padding: 60, textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>🏪</div>
          <div style={{ fontWeight: 700, fontSize: 17, color: "#2C1810", marginBottom: 8 }}>No shops yet</div>
          <div style={{ color: "#888", fontSize: 13.5, marginBottom: 20 }}>
            Create your first shop to start listing products.
          </div>
          <button onClick={() => setModalShop(null)} style={{
            padding: "11px 26px", background: "#3D2B2B", color: "#fff",
            border: "none", borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}>Create First Shop</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
          {shops.map(shop => (
            <ShopCard
              key={shop.id}
              shop={shop}
              productCount={productCounts[shop.id] || 0}
              onEdit={s => setModalShop(s)}
              onViewProducts={shopId => {
                setActiveShop(shopId);
                navigate(`/seller/products?shop=${shopId}`);
              }}
              isActive={activeShop === shop.id}
            />
          ))}
          <div
            onClick={() => setModalShop(null)}
            style={{
              background: "#fff", borderRadius: 14,
              border: "2px dashed #EDE8E3", minHeight: 200,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 10, cursor: "pointer", color: "#ccc",
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#C0392B"; e.currentTarget.style.color = "#C0392B"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#EDE8E3"; e.currentTarget.style.color = "#ccc"; }}
          >
            <span style={{ fontSize: 32, lineHeight: 1 }}>＋</span>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Add another shop</span>
          </div>
        </div>
      )}

      {modalShop !== undefined && (
        <ShopModal
          shop={modalShop}
          userId={userId}
          onClose={() => setModalShop(undefined)}
          onSaved={load}
        />
      )}
    </div>
  );
}