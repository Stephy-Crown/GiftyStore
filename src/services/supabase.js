import { createClient } from '@supabase/supabase-js';
import defaultProducts from '../data/products.json';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// Fetch all fashion clothes from Supabase (or fallback to products.json)
export async function getFashionProducts() {
  if (!supabase) {
    return defaultProducts;
  }
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return defaultProducts;
    }
    return data;
  } catch (err) {
    return defaultProducts;
  }
}

// Add new product from Admin Panel to Supabase
export async function addProductToSupabase(productData) {
  const newItem = { ...productData, id: Date.now() };
  if (!supabase) {
    return newItem;
  }
  try {
    const { data, error } = await supabase.from('products').insert([productData]).select();
    if (error || !data || !data[0]) return newItem;
    return data[0];
  } catch (e) {
    return newItem;
  }
}

// Update product
export async function updateProductInSupabase(id, productData) {
  if (!supabase) return true;
  try {
    await supabase.from('products').update(productData).eq('id', id);
  } catch (e) {
    console.error(e);
  }
}

// Delete product
export async function deleteProductFromSupabase(id) {
  if (!supabase) return true;
  try {
    await supabase.from('products').delete().eq('id', id);
  } catch (e) {
    console.error(e);
  }
}
