import { createClient } from '@supabase/supabase-js';
import defaultProducts from '../data/products.json';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// 30 Minutes Inactivity Timeout Constant (in milliseconds)
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function updateAdminActivityTimestamp() {
  const stored = localStorage.getItem('gifty_admin_session');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      parsed.lastActive = Date.now();
      localStorage.setItem('gifty_admin_session', JSON.stringify(parsed));
    } catch (e) {
      // Ignore
    }
  }
}

// Clean Authentication for Admin Dashboard (With Persistent Session Storage & 30-Min Inactivity Timeout)
export async function signInAdmin(email, password) {
  const targetEmail = email || 'owner@giftystore.com';
  const now = Date.now();

  if (!supabase) {
    // Development local bypass fallback
    if (password === '1234' || password === 'gifty2026') {
      const devSession = { user: { email: targetEmail }, session: { access_token: 'local_dev_token' }, lastActive: now, error: null };
      localStorage.setItem('gifty_admin_session', JSON.stringify(devSession));
      return devSession;
    }
    return { user: null, session: null, error: { message: 'Invalid email or password.' } };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password,
    });
    if (error) return { user: null, session: null, error };
    
    const sessObj = { user: data.user, session: data.session, lastActive: now, error: null };
    localStorage.setItem('gifty_admin_session', JSON.stringify(sessObj));
    return sessObj;
  } catch (err) {
    return { user: null, session: null, error: err };
  }
}

export async function updateAdminEmail(newEmail) {
  if (!supabase) {
    const existing = localStorage.getItem('gifty_admin_session');
    if (existing) {
      const parsed = JSON.parse(existing);
      parsed.user = { ...parsed.user, email: newEmail };
      parsed.lastActive = Date.now();
      localStorage.setItem('gifty_admin_session', JSON.stringify(parsed));
    }
    return { user: { email: newEmail }, success: true, message: 'Admin email updated!' };
  }
  try {
    const { data, error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) return { user: null, success: false, message: error.message };
    return { user: data.user, success: true, message: 'Confirmation request sent to your new email inbox.' };
  } catch (err) {
    return { user: null, success: false, message: err.message };
  }
}

export async function updateAdminPassword(newPassword) {
  if (!supabase) {
    return { user: { email: 'owner@giftystore.com' }, success: true, message: 'Password updated!' };
  }
  try {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { user: null, success: false, message: error.message };
    return { user: data.user, success: true, message: 'Password updated successfully!' };
  } catch (err) {
    return { user: null, success: false, message: err.message };
  }
}

export async function signOutAdmin() {
  localStorage.removeItem('gifty_admin_session');
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getCurrentAdminSession() {
  const stored = localStorage.getItem('gifty_admin_session');
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.lastActive) {
        const elapsed = Date.now() - Number(parsed.lastActive);
        if (elapsed > INACTIVITY_TIMEOUT_MS) {
          // Session expired due to 30 minutes of inactivity
          localStorage.removeItem('gifty_admin_session');
          if (supabase) await supabase.auth.signOut();
          return null;
        }
      }
      if (parsed && (parsed.session || parsed.user)) {
        return parsed;
      }
    } catch (e) {
      localStorage.removeItem('gifty_admin_session');
    }
  }

  // Check Supabase session fallback
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data?.session) {
      return data.session;
    }
  }

  return null;
}

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
