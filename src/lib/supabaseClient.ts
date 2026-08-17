import { createClient } from '@supabase/supabase-js';

// Valores fijos del proyecto, en vez de depender de variables de entorno.
// Esto es seguro: la clave "anon" de Supabase está diseñada para ser
// pública (viaja igual al navegador de cualquier visitante ni bien carga
// la página) — toda la seguridad real vive en las políticas de Row Level
// Security de la base de datos, no en esconder esta clave.
//
// Si en el futuro preferís usar variables de entorno de Vercel de nuevo,
// alcanza con reemplazar estas dos líneas por:
//   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
//   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseUrl = 'https://lyzggubmwydamsztkvhr.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5emdndWJtd3lkYW1zenRrdmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MTgyMTgsImV4cCI6MjA5OTk5NDIxOH0.QSLxqShZe1v-P3fBuylwQPrsn2cC3A36FX6NWMV5JkI';

export const isSupabaseConfigured = true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
