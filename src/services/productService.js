import { supabase } from "../supabaseClient";

// ✅ Add Product
export const addProduct = async (product) => {
  const { data, error } = await supabase
    .from("products")
    .insert([product])
    .select();

  if (error) {
    console.error("Error adding product:", error);
    throw error;
  }

  return data;
};

// ✅ Get Products by Seller
export const getProductsBySeller = async (seller_id, shop_id = null) => {
  let query = supabase
    .from("products")
    .select("*")
    .eq("seller_id", seller_id)
    .order("created_at", { ascending: false });

  if (shop_id) {
    query = query.eq("shop_id", shop_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    throw error;
  }

  return data;
};

// ✅ Update Product
export const updateProduct = async (id, updates) => {
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error updating product:", error);
    throw error;
  }

  return data;
};

// ✅ Delete Product (Hard delete)
export const deleteProduct = async (id) => {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting product:", error);
    throw error;
  }

  return true;
};