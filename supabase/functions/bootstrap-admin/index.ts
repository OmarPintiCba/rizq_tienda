// Edge Function: bootstrap-admin
//
// Por qué existe: el registro público de Supabase (auth.signUp) puede estar
// bloqueado por la configuración "Allow new users to sign up" del proyecto,
// que es fácil de dejar mal configurada sin darse cuenta. Esta función crea
// el usuario usando la clave secreta del servidor (auth.admin.createUser),
// que es una vía completamente distinta y NO depende de ese interruptor.
// Solo funciona si la tabla admin_users está totalmente vacía — una vez que
// existe un Super Admin, esta puerta se cierra sola y hay que usar
// create-admin (que sí exige ser Super Admin) para agregar más cuentas.

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Cliente con la clave secreta: puede saltar RLS y crear usuarios.
    // Nunca llega al navegador, vive solo acá (variable de entorno del
    // servidor de la función).
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { count, error: countError } = await adminClient
      .from('admin_users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return new Response(JSON.stringify({ error: countError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if ((count ?? 0) > 0) {
      return new Response(JSON.stringify({ error: 'Ya existe una cuenta de administrador. Esta vía solo funciona para crear la primera.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
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
      role: 'super_admin',
      is_active: true,
      created_by: null,
    });

    if (insertError) {
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
