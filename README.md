# AVELINE – Fragrance Importados

Loja estática (HTML + CSS + JS) com catálogo e imagens gerenciados pelo **Supabase**
(projeto `aveline`) e painel administrativo com login via **GitHub** (conta `aveline`).

```
Avile/
├── index.html                  # Página da loja (só monta as partes)
├── partials/                   # Cada seção do site em um arquivo
│   ├── announcement.html       # Barra de aviso
│   ├── header.html             # Cabeçalho / menu
│   ├── hero.html               # Destaque principal
│   ├── quiz.html               # Bússola olfativa
│   ├── catalog.html            # Curadoria (grade de produtos)
│   ├── decants.html            # Decantes
│   ├── about.html              # Sobre a AVELINE
│   ├── testimonials.html       # Depoimentos
│   ├── newsletter.html         # Newsletter
│   ├── footer.html             # Rodapé
│   └── overlays.html           # Sacola, favoritos, detalhe, busca, WhatsApp
├── admin/
│   └── index.html              # Painel administrativo
├── assets/
│   ├── css/
│   │   ├── style.css           # Estilos da loja
│   │   └── admin.css           # Estilos do painel
│   ├── img/                    # logo.svg, favicon.svg
│   └── js/
│       ├── config.js           # ⚙️ URL/chave do Supabase, WhatsApp
│       ├── supabase-client.js  # Cria o cliente Supabase
│       ├── tailwind-config.js  # Cores e fontes da marca
│       ├── include.js          # Carrega os arquivos de /partials
│       ├── utils.js            # Funções comuns
│       ├── data/fallback-products.js  # Catálogo reserva (sem Supabase)
│       ├── store/              # Loja: products, cart, wishlist, quiz, ui, main
│       └── admin/              # Painel: auth, images, products, newsletter, main
└── supabase/
    ├── schema.sql              # Tabelas, RLS, bucket de imagens, admin
    └── seed.sql                # 6 perfumes iniciais
```

---

## 1. Banco de dados (Supabase › projeto `aveline`)

1. Abra **SQL Editor › New query**.
2. No fim do `supabase/schema.sql`, troque `seu-email-do-github@exemplo.com` pelo
   **e-mail principal da conta GitHub `aveline`**.
3. Cole o `schema.sql` inteiro e clique em **Run**.
4. Cole o `supabase/seed.sql` e clique em **Run** (cadastra os 6 perfumes iniciais).

O script cria:

| Item | Para quê |
|---|---|
| `public.products` | Catálogo. Público lê só os ativos; só admin grava. |
| `public.admins` | Lista de administradores (por e-mail ou `user_id`). |
| `public.is_admin()` | Função usada pelas políticas RLS. |
| `public.newsletter` | Inscritos. Qualquer um se inscreve; só admin lê. |
| Bucket `produtos` | Imagens dos produtos (leitura pública, envio só admin, máx. 5 MB). |

## 2. Login com GitHub

**No GitHub (conta/organização `aveline`):**
Settings › Developer settings › **OAuth Apps › New OAuth App**

- *Application name:* `AVELINE Admin`
- *Homepage URL:* o endereço do site (ex.: `https://aveline.github.io/aveline/`)
- *Authorization callback URL:* `https://SEU-PROJETO.supabase.co/auth/v1/callback`
  (copie exatamente de Supabase › Authentication › Providers › GitHub)

Gere um **Client secret** e copie o **Client ID**.

**No Supabase:**

1. **Authentication › Providers › GitHub** → ative, cole Client ID e Client Secret → Save.
2. **Authentication › URL Configuration**
   - *Site URL:* endereço da loja publicada.
   - *Redirect URLs:* adicione o endereço do painel em cada ambiente, por exemplo:
     - `http://127.0.0.1:5500/admin/` (Live Server)
     - `https://aveline.github.io/aveline/admin/` (GitHub Pages)
3. Recomendado: em **Authentication › Providers › Email**, desative o cadastro por
   e-mail/senha (só o GitHub será usado) ou mantenha "Confirm email" ligado.

> Se você entrar no painel e aparecer **"Acesso não autorizado"**, a própria tela mostra
> o comando SQL pronto (com seu `user_id`) para cadastrar a conta como admin.

## 3. Configurar o site

Edite `assets/js/config.js`:

```js
SUPABASE_URL: 'https://xxxx.supabase.co',      // Project Settings › API › Project URL
SUPABASE_ANON_KEY: 'eyJhbGciOi...',            // Project Settings › API › anon public
WHATSAPP_NUMBER: '5511999999999',              // recebe os pedidos
INSTAGRAM_URL: 'https://instagram.com/aveline',
```

A chave **anon** é pública por design — a segurança vem das políticas RLS.
**Nunca** coloque a chave `service_role` no site.

Sem `config.js` preenchido a loja funciona com o catálogo de
`assets/js/data/fallback-products.js` (o painel admin pede a configuração).

## 4. Rodar localmente

As partes em `/partials` são carregadas com `fetch`, então o site precisa de um
servidor (abrir o `index.html` com duplo clique não funciona):

- **VS Code:** instale a extensão *Live Server* › botão direito no `index.html` › *Open with Live Server*.
- ou no terminal: `npx serve .` / `python -m http.server 5500`

Loja: `http://127.0.0.1:5500/` · Painel: `http://127.0.0.1:5500/admin/`

## 5. Publicar no GitHub Pages (repositório da conta `aveline`)

```bash
git init
git add .
git commit -m "AVELINE: loja + painel admin com Supabase"
git branch -M main
git remote add origin https://github.com/aveline/aveline.git
git push -u origin main
```

No repositório: **Settings › Pages › Source: Deploy from a branch › main / (root)**.
Depois adicione a URL publicada do `/admin/` em *Redirect URLs* do Supabase (passo 2).

## 6. Usando o painel

- **Novo produto / Editar:** nome, casa, categoria, concentração, volume, preços
  (frasco, preço "de", decante 5ml e 10ml), descrição, pirâmide olfativa,
  famílias (usadas na Bússola Olfativa), selo e visibilidade.
- **Imagens:** arraste ou clique para enviar a imagem principal; adicione imagens extras
  na galeria (⭐ define como principal). As imagens são reduzidas para até 1600px em WebP
  antes do envio. Imagens removidas são apagadas do Storage ao salvar.
- **Olho:** mostra/oculta o produto na loja sem excluir.
- **Destaque da home:** o primeiro produto marcado aparece no card do topo do site.
- **Newsletter:** lista de inscritos com exportação CSV.

Para adicionar outro administrador:

```sql
insert into public.admins (email) values ('outra-pessoa@exemplo.com');
```
