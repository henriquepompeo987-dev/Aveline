-- =====================================================================
--  AVELINE – Fragrance Importados
--  Estrutura do banco (Supabase / Postgres)
--
--  Como usar: Supabase > projeto "aveline" > SQL Editor > New query,
--  cole este arquivo inteiro e clique em RUN. Depois rode seed.sql.
--  O script pode ser executado mais de uma vez sem quebrar nada.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. ADMINISTRADORES
--    Quem estiver nesta tabela pode criar/editar/excluir produtos e
--    enviar imagens. O login é feito pelo Supabase Auth com GitHub.
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  id         uuid primary key default gen_random_uuid(),
  email      text unique,
  user_id    uuid unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint admins_email_ou_user check (email is not null or user_id is not null)
);

-- Retorna true se o usuário logado é administrador.
-- security definer: consegue ler public.admins mesmo com RLS ligado.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
       or (a.email is not null
           and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.admins enable row level security;

drop policy if exists "admins: admin lê" on public.admins;
create policy "admins: admin lê" on public.admins
  for select to authenticated
  using (public.is_admin());

-- (Inserir/remover admins somente pelo SQL Editor — sem policy de escrita.)


-- ---------------------------------------------------------------------
-- 2. PRODUTOS
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique,
  name              text not null,
  house             text not null,                       -- Casa / marca
  category          text not null default 'unissex'
                    check (category in ('feminino', 'masculino', 'unissex')),
  is_niche          boolean not null default false,       -- Perfumaria de nicho
  is_new            boolean not null default false,       -- Lançamento
  is_featured       boolean not null default false,       -- Destaque (hero / bússola)
  concentration     text default 'Eau de Parfum',
  volume_ml         integer check (volume_ml is null or volume_ml > 0),
  price             numeric(10,2) not null check (price >= 0),
  compare_at_price  numeric(10,2) check (compare_at_price is null or compare_at_price >= 0),
  decant_5ml_price  numeric(10,2) check (decant_5ml_price is null or decant_5ml_price >= 0),
  decant_10ml_price numeric(10,2) check (decant_10ml_price is null or decant_10ml_price >= 0),
  short_description text,
  description       text,
  notes_top         text[] not null default '{}',         -- Notas de saída
  notes_heart       text[] not null default '{}',         -- Notas de coração
  notes_base        text[] not null default '{}',         -- Notas de fundo
  families          text[] not null default '{}',         -- Floral, Amadeirado...
  badge             text,                                 -- Ex.: "Edição Limitada"
  image_url         text,                                 -- Imagem principal
  gallery           text[] not null default '{}',         -- Imagens extras
  in_stock          boolean not null default true,
  active            boolean not null default true,        -- Visível na loja
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists products_active_sort_idx on public.products (active, sort_order);
create index if not exists products_category_idx    on public.products (category);

-- Atualiza updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;

drop policy if exists "products: público lê ativos" on public.products;
create policy "products: público lê ativos" on public.products
  for select to anon, authenticated
  using (active = true or public.is_admin());

drop policy if exists "products: admin insere" on public.products;
create policy "products: admin insere" on public.products
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists "products: admin edita" on public.products;
create policy "products: admin edita" on public.products
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "products: admin exclui" on public.products;
create policy "products: admin exclui" on public.products
  for delete to authenticated
  using (public.is_admin());


-- ---------------------------------------------------------------------
-- 3. NEWSLETTER
-- ---------------------------------------------------------------------
create table if not exists public.newsletter (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique check (position('@' in email) > 1),
  created_at timestamptz not null default now()
);

alter table public.newsletter enable row level security;

drop policy if exists "newsletter: qualquer um se inscreve" on public.newsletter;
create policy "newsletter: qualquer um se inscreve" on public.newsletter
  for insert to anon, authenticated
  with check (true);

drop policy if exists "newsletter: admin lê" on public.newsletter;
create policy "newsletter: admin lê" on public.newsletter
  for select to authenticated
  using (public.is_admin());

drop policy if exists "newsletter: admin exclui" on public.newsletter;
create policy "newsletter: admin exclui" on public.newsletter
  for delete to authenticated
  using (public.is_admin());


-- ---------------------------------------------------------------------
-- 4. STORAGE – bucket público "produtos" para as imagens
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'produtos', 'produtos', true, 5242880,   -- 5 MB por arquivo
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "produtos: leitura pública" on storage.objects;
create policy "produtos: leitura pública" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'produtos');

drop policy if exists "produtos: admin envia" on storage.objects;
create policy "produtos: admin envia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'produtos' and public.is_admin());

drop policy if exists "produtos: admin atualiza" on storage.objects;
create policy "produtos: admin atualiza" on storage.objects
  for update to authenticated
  using (bucket_id = 'produtos' and public.is_admin())
  with check (bucket_id = 'produtos' and public.is_admin());

drop policy if exists "produtos: admin exclui" on storage.objects;
create policy "produtos: admin exclui" on storage.objects
  for delete to authenticated
  using (bucket_id = 'produtos' and public.is_admin());


-- ---------------------------------------------------------------------
-- 5. CADASTRE O ADMINISTRADOR
--    >>> Troque pelo e-mail principal da conta GitHub "aveline" <<<
--    (é o e-mail que aparece em Authentication > Users após o 1º login)
-- ---------------------------------------------------------------------
insert into public.admins (email)
values ('henriquepompeo987@gmail.com')
on conflict (email) do nothing;
