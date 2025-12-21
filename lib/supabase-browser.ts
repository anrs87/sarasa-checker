import { createClient } from '@supabase/supabase-js';

// Usamos la variable NEXT_PUBLIC_SUPABASE_ANON_KEY que sí es segura para el navegador
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey);