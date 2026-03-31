// import { supabase } from "../../supabaseClient";

// // 🛒 Create Order (WITH STOCK CHECK)
// export const createOrder = async (buyer_id, items) => {
//   try {
//     // 1️⃣ Get product details
//     const productIds = items.map((item) => item.product_id);

//     const { data: products, error: fetchError } = await supabase
//       .from("products")
//       .select("*")
//       .in("id", productIds);

//     if (fetchError) throw fetchError;

//     // 2️⃣ Check stock
//     for (let item of items) {
//       const product = products.find(p => p.id === item.product_id);

//       if (!product || product.stock < item.quantity) {
//         throw new Error(`Insufficient stock for ${product?.name}`);
//       }
//     }

//     // 3️⃣ Calculate total
//     let total = 0;
//     items.forEach(item => {
//       const product = products.find(p => p.id === item.product_id);
//       total += product.price * item.quantity;
//     });

//     // 4️⃣ Create order
//     const { data: order, error: orderError } = await supabase
//       .from("orders")
//       .insert([{
//         buyer_id,
//         seller_id: products[0].seller_id,
//         total_amount: total,
//         status: "pending"
//       }])
//       .select()
//       .single();

//     if (orderError) throw orderError;

//     // 5️⃣ Insert order_items
//     const orderItems = items.map(item => {
//       const product = products.find(p => p.id === item.product_id);
//       return {
//         order_id: order.id,
//         product_id: item.product_id,
//         quantity: item.quantity,
//         price_at_purchase: product.price
//       };
//     });

//     const { error: itemsError } = await supabase
//       .from("order_items")
//       .insert(orderItems);

//     if (itemsError) throw itemsError;

//     // 6️⃣ Reduce stock
//     for (let item of items) {
//       const product = products.find(p => p.id === item.product_id);

//       await supabase
//         .from("products")
//         .update({ stock: product.stock - item.quantity })
//         .eq("id", item.product_id);
//     }

//     // 7️⃣ Create invoice
//     const { error: invoiceError } = await supabase
//       .from("invoices")
//       .insert([{
//         order_id: order.id,
//         total_amount: total,
//         invoice_number: `INV-${Date.now()}`
//       }]);

//     if (invoiceError) throw invoiceError;

//     return order;

//   } catch (error) {
//     console.error("Order creation failed:", error.message);
//     throw error;
//   }
// };

// // 📦 Get Orders for Seller
// export const getOrdersBySeller = async (seller_id) => {
//   const { data, error } = await supabase
//     .from("orders")
//     .select(`
//       *,
//       order_items (
//         quantity,
//         price_at_purchase,
//         product:products(name)
//       )
//     `)
//     .eq("seller_id", seller_id)
//     .order("created_at", { ascending: false });

//   if (error) {
//     console.error("Error fetching orders:", error);
//     throw error;
//   }

//   return data;
// };

// // 🔄 Update Order Status
// export const updateOrderStatus = async (order_id, status) => {
//   const { data, error } = await supabase
//     .from("orders")
//     .update({ status })
//     .eq("id", order_id)
//     .select();

//   if (error) {
//     console.error("Error updating order:", error);
//     throw error;
//   }

//   return data;
// };



import { supabase } from "../supabaseClient";

// 🛒 Create Order (WITH STOCK CHECK)
export const createOrder = async (buyer_id, items) => {
  try {
    const productIds = items.map((item) => item.product_id);

    const { data: products, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds);

    if (fetchError) throw fetchError;

    // Check stock
    for (let item of items) {
      const product = products.find(p => p.id === item.product_id);
      if (!product || product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product?.name}`);
      }
    }

    let total = 0;
    items.forEach(item => {
      const product = products.find(p => p.id === item.product_id);
      total += product.price * item.quantity;
    });

    // 4️⃣ Create order (Note: removed top-level seller_id as it's multi-seller)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([{
        buyer_id,
        user_id: buyer_id, // Ensure this matches your table column
        total_amount: total,
        status: "pending"
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // 5️⃣ Insert order_items with their specific seller_ids
    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.product_id);
      return {
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: product.price,
        seller_id: product.seller_id // ✅ Critical for multi-seller
      };
    });

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // 6️⃣ Reduce stock
    for (let item of items) {
      const product = products.find(p => p.id === item.product_id);
      await supabase
        .from("products")
        .update({ stock: product.stock - item.quantity })
        .eq("id", item.product_id);
    }

    return order;
  } catch (error) {
    console.error("Order creation failed:", error.message);
    throw error;
  }
};

// 📦 FIXED: Get Orders for Seller (Filtering via order_items)
export const getOrdersBySeller = async (seller_id) => {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items!inner (
        id,
        quantity,
        price_at_purchase,
        seller_id,
        product:products(name)
      )
    `)
    .eq("order_items.seller_id", seller_id) // ✅ Filter by item seller, not order seller
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }

  return data;
};

// 🔄 Update Order Status
export const updateOrderStatus = async (order_id, status) => {
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", order_id)
    .select();

  if (error) {
    console.error("Error updating order:", error);
    throw error;
  }

  return data;
};