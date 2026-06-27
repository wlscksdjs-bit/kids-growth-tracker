import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zwzroqhvylkxcqcggyzf.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_0pT2-awucnrbpX_g2EGchg_qkjdUSAS";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
