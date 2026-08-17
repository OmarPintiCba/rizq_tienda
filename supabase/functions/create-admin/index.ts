// Edge Function: create-admin
//
// Por qué existe: crear un administrador nuevo implica crear también su
// usuario de autenticación. Hacer eso desde el navegador con
// supabase.auth.signUp() reemplazaría la sesión actual del Super Admin por
// la del usuario recién creado (lo dejaría deslogueado a él). Esta función
// corre del lado del servidor, usa la clave secreta (nunca expuesta al
// navegador) para crear el usuario sin tocar la sesión de quien la llama,
// y valida primero que quien la invoca sea realmente un Super Administrador
// activo antes de hacer nada.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Cliente "como quien llama": para confirmar quién es y qué rol tiene.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Sesión inválida.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: callerRow, error: callerError } = await callerClient
      .from('admin_users')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (callerError || !callerRow || callerRow.role !== 'super_admin' || !callerRow.is_active) {
      return new Response(JSON.stringify({ error: 'Solo un Super Administrador activo puede crear administradores.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { name, email, password, role } = await req.json();
    if (!name || !email || !password || !role) {
      return new Response(JSON.stringify({ error: 'Faltan datos.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (String(password).length < 8) {
      return new Response(JSON.stringify({ error: 'La contraseña debe tener al menos 8 caracteres.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cliente con la clave secreta: puede crear usuarios y saltar RLS.
    // Esta clave SOLO vive acá (variable de entorno del servidor), nunca
    // llega al navegador.
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError || !created.user) {
      return new Response(JSON.stringify({ error: createError?.message || 'No se pudo crear el usuario.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: insertError } = await adminClient.from('admin_users').insert({
      id: created.user.id,
      name,
      email,
      role,
      is_active: true,
      created_by: user.id,
    });

    if (insertError) {
      // Si falla el insert, deshacemos la creación del usuario para no
      // dejar una cuenta de auth "huérfana" sin fila en admin_users.
      await adminClient.auth.admin.deleteUser(created.user.id);
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
