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

-- Só usuários logados precisam chamar is_admin(); anon nunca é admin.
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

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
set search_path = ''
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

-- Visitante (anon) enxerga só os ativos. Não chama is_admin(): anon
-- nunca é admin e assim a função fica fora do alcance do público.
drop policy if exists "products: público lê ativos" on public.products;
create policy "products: público lê ativos" on public.products
  for select to anon
  using (active = true);

-- Logado vê os ativos; se for admin, vê também os inativos.
drop policy if exists "products: logado lê" on public.products;
create policy "products: logado lê" on public.products
  for select to authenticated
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

-- Qualquer visitante se inscreve, mas o e-mail precisa ter formato válido
-- e tamanho sensato — evita lixo/spam gravado na tabela.
drop policy if exists "newsletter: qualquer um se inscreve" on public.newsletter;
create policy "newsletter: qualquer um se inscreve" on public.newsletter
  for insert to anon, authenticated
  with check (
    length(email) between 6 and 254
    and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$'
  );

drop policy if exists "newsletter: admin lê" on public.newsletter;
create policy "newsletter: admin lê" on public.newsletter
  for select to authenticated
  using (public.is_admin());

drop policy if exists "newsletter: admin exclui" on public.newsletter;
create policy "newsletter: admin exclui" on public.newsletter
  for delete to authenticated
  using (public.is_admin());


-- ---------------------------------------------------------------------
-- 3b. EVENTOS DA LOJA
--     Registra quando alguém adiciona um item à sacola e quando alguém
--     é redirecionado ao WhatsApp para fechar o pedido.
-- ---------------------------------------------------------------------
create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in ('add_to_cart', 'checkout_whatsapp')),
  product_id    uuid references public.products (id) on delete set null,
  product_name  text check (product_name is null or length(product_name) <= 200),
  variant       text check (variant is null or variant in ('full', 'd5', 'd10')),
  quantity      integer check (quantity is null or (quantity > 0 and quantity <= 999)),
  value         numeric(10,2) check (value is null or (value >= 0 and value <= 1000000)),
  items         jsonb check (items is null or length(items::text) <= 8000),
  customer_name text check (customer_name is null or length(customer_name) <= 120),
  session_id    text check (session_id is null or length(session_id) <= 64),
  created_at    timestamptz not null default now()
);

create index if not exists events_created_idx on public.events (created_at desc);
create index if not exists events_type_idx    on public.events (type, created_at desc);

alter table public.events enable row level security;

-- Qualquer visitante registra o próprio evento; os checks da tabela
-- limitam tamanho e formato para evitar lixo gravado.
drop policy if exists "events: visitante registra" on public.events;
create policy "events: visitante registra" on public.events
  for insert to anon, authenticated
  with check (true);

drop policy if exists "events: admin lê" on public.events;
create policy "events: admin lê" on public.events
  for select to authenticated
  using (public.is_admin());

drop policy if exists "events: admin exclui" on public.events;
create policy "events: admin exclui" on public.events
  for delete to authenticated
  using (public.is_admin());


-- ---------------------------------------------------------------------
-- 3c. LOG DE CONTAS
--     Toda conta criada no Supabase Auth (Google ou GitHub) grava uma
--     linha aqui automaticamente, pelo gatilho em auth.users.
-- ---------------------------------------------------------------------
create table if not exists public.account_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid unique,
  email      text,
  full_name  text,
  provider   text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create index if not exists account_logs_created_idx on public.account_logs (created_at desc);

-- security definer: o gatilho roda no schema auth e precisa gravar em public.
create or replace function public.log_new_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.account_logs (user_id, email, full_name, provider, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'user_name'
    ),
    coalesce(new.raw_app_meta_data ->> 'provider', 'email'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_log on auth.users;
create trigger on_auth_user_created_log
  after insert on auth.users
  for each row execute function public.log_new_account();

-- Registra quem já tinha conta antes do gatilho existir.
insert into public.account_logs (user_id, email, full_name, provider, avatar_url, created_at)
select
  u.id,
  u.email,
  coalesce(
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name',
    u.raw_user_meta_data ->> 'user_name'
  ),
  coalesce(u.raw_app_meta_data ->> 'provider', 'email'),
  u.raw_user_meta_data ->> 'avatar_url',
  u.created_at
from auth.users u
on conflict (user_id) do nothing;

alter table public.account_logs enable row level security;

-- Sem policy de insert: só o gatilho (security definer) escreve aqui.
drop policy if exists "account_logs: admin lê" on public.account_logs;
create policy "account_logs: admin lê" on public.account_logs
  for select to authenticated
  using (public.is_admin());

drop policy if exists "account_logs: admin exclui" on public.account_logs;
create policy "account_logs: admin exclui" on public.account_logs
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

-- O bucket é público: as imagens continuam abrindo pela URL pública sem
-- passar por esta policy. Ela controla apenas a API de listagem, que fica
-- restrita ao admin para ninguém enumerar o conteúdo do bucket.
drop policy if exists "produtos: leitura pública" on storage.objects;
drop policy if exists "produtos: admin lista" on storage.objects;
create policy "produtos: admin lista" on storage.objects
  for select to authenticated
  using (bucket_id = 'produtos' and public.is_admin());

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
