import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
// 去除結尾的斜線以及可能誤加的 /rest/v1
const supabaseUrl = rawUrl.replace(/\/$/, '').replace(/\/rest\/v1$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

