/* =====================================================================
   AVELINE – Configuração
   Preencha com os dados do projeto "aveline" no Supabase:
   Supabase > Project Settings > API
   - Project URL          -> SUPABASE_URL
   - anon / public key    -> SUPABASE_ANON_KEY
   A chave "anon" é pública por natureza; quem protege os dados são as
   políticas RLS do arquivo supabase/schema.sql.
   NUNCA coloque aqui a chave "service_role".
   ===================================================================== */
window.AVELINE_CONFIG = {
  SUPABASE_URL: 'https://kpjonuooxaqkhlqvppso.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwam9udW9veGFxa2hscXZwcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5ODcyMjMsImV4cCI6MjEwNjU2MzIyM30.betXRv-F7pRpm7SgcCFqggNKwJ0zRLw9dm25neo2qEU',

  // Bucket do Storage onde ficam as imagens dos produtos
  STORAGE_BUCKET: 'produtos',

  // WhatsApp que recebe os pedidos (somente números, com DDI + DDD)
  WHATSAPP_NUMBER: '5511999999999',

  INSTAGRAM_URL: 'https://instagram.com',
};
