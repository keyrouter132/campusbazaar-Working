import { supabase } from '../supabaseClient'

// Create a new shop for the logged-in seller
export async function createShop(sellerId, name, description) {
  const { data, error } = await supabase
    .from('shops')
    .insert([{ seller_id: sellerId, name, description }])
    .select()
    .single()

  if (error) throw error
  return data
}

// Get the shop belonging to the logged-in seller
export async function getMyShop(sellerId) {
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('seller_id', sellerId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// Update shop details
export async function updateShop(shopId, updates) {
  const { data, error } = await supabase
    .from('shops')
    .update(updates)
    .eq('id', shopId)
    .select()
    .single()

  if (error) throw error
  return data
}