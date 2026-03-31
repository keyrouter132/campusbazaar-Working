// import { supabase } from './supabaseClient';

// export async function getPendingSellers() {
//   return await supabase
//     .from('users')
//     .select('id, college_id, email')
//     .eq('role', 'seller')
//     .eq('seller_status', 'pending');
// }

// export async function approveSeller(userId) {
//   return await supabase
//     .from('users')
//     .update({ seller_status: 'approved' })
//     .eq('id', userId);
// }
// import { supabase } from './supabaseClient';

// Fetches all users who have applied to be sellers but aren't approved yet
export async function getPendingSellers() {
  return await supabase
    .from('users')
    .select('id, college_id, email, seller_status') // Fixed: uid -> college_id
    .eq('seller_status', 'pending'); 
    // Note: We removed .eq('role', 'seller') because they are still 'buyers' until approved
}

// Officially approves the student
export async function approveSeller(userId) {
  return await supabase
    .from('users')
    .update({ 
      seller_status: 'approved',
      role: 'seller' // This actually promotes them to a Seller role
    })
    .eq('id', userId);
}