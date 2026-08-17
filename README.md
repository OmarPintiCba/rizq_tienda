<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/7db4032b-5b7c-4642-a259-4c7627231c35

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## v22 — Catálogo dinámico por categorías

- Las categorías navegan a URLs reales `/categoria/...` en lugar de llevar a Tendencias.
- Una sola plantilla dinámica sirve para todas las categorías y subcategorías.
- Soporta niveles escalables mediante `parent_id` (ej. Tecnología → Accesorios → Cargadores).
- Catálogo con arquitectura tipo marketplace: breadcrumbs, columna lateral, subcategorías, filtros por marca/precio/stock y ordenamiento.
- En móvil, los filtros se abren en un panel lateral.
- Se conservan las tarjetas y la identidad visual de RIZQ.
- El administrador ahora permite elegir cualquier categoría válida como padre y evita ciclos.
- Esta versión no requiere ejecutar SQL nuevo si `categories` y `products` ya están funcionando en Supabase.

## v23 — Checkout, Ventas y Carritos abandonados

1. Ejecutar `supabase/commerce_v23.sql` en Supabase SQL Editor.
2. El checkout v23 funciona con **efectivo + retiro en local**.
3. Una operación en efectivo se guarda en **Administrador → Ventas → Pendientes** y no suma como ingreso cobrado hasta pulsar **Marcar como cobrada**.
4. Los carritos que llegan al checkout se guardan en Supabase. Si pasan 24 horas sin actividad se muestran como abandonados.
5. Mercado Pago se muestra como próxima integración, pero **no está activo en v23**. Se integra en v24.

## Ajuste v23 — cuenta obligatoria para checkout
- El cliente puede navegar y armar el carrito sin iniciar sesión.
- Al pulsar Finalizar compra, si no tiene sesión se lo envía a Ingresar / Crear cuenta.
- Tras iniciar sesión o registrarse vuelve automáticamente a /checkout y conserva el carrito.
- El email de la cuenta se reutiliza en checkout y no se puede editar allí.
- Registro duplicado: si Supabase informa una identidad existente, se indica que debe iniciar sesión en vez de crear otra cuenta.
