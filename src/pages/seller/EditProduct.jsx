import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { updateProduct } from "../../services/productService";
import { ProductForm, useSellerShops } from "./AddProducts";

export default function EditProduct() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { shops, loading: shopsLoading } = useSellerShops();

  const [form, setForm] = useState({
    name: "", description: "", price: "", stock: "",
    image_urls: "", shop_id: "", category: "",
  });
  const [imageFile,  setImageFile]  = useState(null);
  const [preview,    setPreview]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* fetch existing product — includes shop_id + category */
  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { alert("Error fetching product"); return; }
        setForm({
          name:        data.name        || "",
          description: data.description || "",
          price:       data.price       ?? "",
          stock:       data.stock       ?? "",
          image_urls:  data.image_urls  || "",
          shop_id:     data.shop_id     || "",
          category:    data.category    || "",
        });
        setLoading(false);
      });
  }, [id]);

  const handleChange = e =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const uploadImage = async () => {
    if (!imageFile) return form.image_urls;
    const fileName = `${Date.now()}-${imageFile.name}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, imageFile);
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.shop_id)  { alert("Please select a shop.");     return; }
    if (!form.category) { alert("Please select a category."); return; }
    setSubmitting(true);
    try {
      const imageUrl = await uploadImage();
      await updateProduct(id, {
        name:        form.name,
        description: form.description,
        price:       Number(form.price),
        stock:       Number(form.stock),
        image_urls:  imageUrl,
        shop_id:     form.shop_id,
        category:    form.category,
      });
      navigate("/seller/products");
    } catch (err) {
      alert("Update failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"300px" }}>
      <span style={{ color:"#888", fontSize:"14px" }}>Loading product…</span>
    </div>
  );

  return (
    <ProductForm
      form={form}
      handleChange={handleChange}
      handleImageChange={handleImageChange}
      preview={preview || form.image_urls}
      handleSubmit={handleSubmit}
      submitting={submitting}
      submitLabel={submitting ? "Saving…" : "Save Changes"}
      onCancel={() => navigate("/seller/products")}
      shops={shops}
      shopsLoading={shopsLoading}
    />
  );
}