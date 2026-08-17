-- ============================================================================
-- LIMPIEZA ÚNICA DE PRODUCTOS DEMO — RIZQ TIENDA
-- ============================================================================
-- Ejecutar SOLO si ya corriste una versión anterior de products.sql y querés
-- quitar los 4 productos de demostración.
--
-- Se eliminan por SKU para no tocar productos reales. product_private se
-- elimina automáticamente por ON DELETE CASCADE.

delete from public.products
where sku in (
  'KB-PRO-V2',
  'HP-NG-PRO',
  'SW-RIZQ-S',
  'CH-ERGO-01'
);
