-- =====================================================================
--  AVELINE – Correções de segurança (Security Advisor do Supabase)
--
--  Resolve os 5 avisos de SQL apontados em
--  Supabase > Advisors > Security Advisor.
--
--  Como usar: SQL Editor > New query > cole tudo > RUN.
--  Pode ser executado mais de uma vez sem quebrar nada.
--  (O schema.sql já contém estas mesmas correções; este arquivo existe
--   para aplicar só os ajustes num banco que já está criado.)
-- =====================================================================


-- ---------------------------------------------------------------------
-- AVISO 1 – "Caminho de busca de função mutável" (public.set_updated_at)
--   Sem search_path fixo, alguém com permissão de criar schema poderia
--   plantar uma função com o mesmo nome e sequestrar a chamada.
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- AVISOS 4 e 5 – "O público pode executar a função SECURITY DEFINER"
--   is_admin() é SECURITY DEFINER (lê public.admins ignorando RLS).
--   Visitante anônimo nunca é admin, então não precisa chamá-la.
--   Também fixamos search_path = '' (todas as referências já são
--   qualificadas por schema: public.admins, auth.uid(), auth.jwt()).
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
       or (a.email is not null
           and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- A policy pública de produtos chamava is_admin(); sem o grant para anon
-- ela quebraria a loja. Separamos em duas policies: o visitante enxerga
-- apenas os ativos (sem tocar na função) e o logado passa pelo is_admin().
drop policy if exists "products: público lê ativos" on public.products;
create policy "products: público lê ativos" on public.products
  for select to anon
  using (active = true);

drop policy if exists "products: logado lê" on public.products;
create policy "products: logado lê" on public.products
  for select to authenticated
  using (active = true or public.is_admin());


-- ---------------------------------------------------------------------
-- AVISO 2 – "A política da RLS é sempre verdadeira" (public.newsletter)
--   O insert era with check (true): dava para gravar qualquer string.
--   Agora exige formato de e-mail e tamanho sensato.
-- ---------------------------------------------------------------------
drop policy if exists "newsletter: qualquer um se inscreve" on public.newsletter;
create policy "newsletter: qualquer um se inscreve" on public.newsletter
  for insert to anon, authenticated
  with check (
    length(email) between 6 and 254
    and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$'
  );


-- ---------------------------------------------------------------------
-- AVISO 3 – "O Public Bucket permite a listagem de conteúdo" (produtos)
--   O bucket é público de propósito: as imagens dos produtos abrem pela
--   URL pública, que NÃO passa por esta policy. A policy controla só a
--   API de listagem — restringimos ao admin para ninguém enumerar os
--   arquivos do bucket. O site continua exibindo as imagens normalmente.
-- ---------------------------------------------------------------------
drop policy if exists "produtos: leitura pública" on storage.objects;
drop policy if exists "produtos: admin lista" on storage.objects;
create policy "produtos: admin lista" on storage.objects
  for select to authenticated
  using (bucket_id = 'produtos' and public.is_admin());


-- ---------------------------------------------------------------------
-- AVISO 6 – "Proteção de senha vazada desativada"
--   Não dá para resolver por SQL. Como o login do admin é só GitHub
--   OAuth (ninguém cria senha aqui), o risco é baixo, mas pode ligar em:
--   Authentication > Policies > Password Protection > habilite
--   "Check against HaveIBeenPwned".
-- ---------------------------------------------------------------------


-- ---------------------------------------------------------------------
-- Conferência: liste as policies ativas depois de rodar
-- ---------------------------------------------------------------------
-- select schemaname, tablename, policyname, roles, cmd
-- from pg_policies
-- where schemaname in ('public', 'storage')
-- order by tablename, policyname;
