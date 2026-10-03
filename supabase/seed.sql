-- =====================================================================
--  AVELINE – Catálogo inicial
--  Rode depois do schema.sql. Pode rodar de novo: atualiza pelo slug.
--  As imagens são enviadas depois pelo painel /admin.
-- =====================================================================

insert into public.products
  (slug, name, house, category, is_niche, is_new, is_featured, concentration, volume_ml,
   price, decant_5ml_price, decant_10ml_price, short_description, description,
   notes_top, notes_heart, notes_base, families, badge, image_url, sort_order)
values
  ('lheure-doree', 'L''Heure Dorée', 'Maison Aurélia', 'unissex', true, false, true,
   'Extrait de Parfum', 70, 2450.00, 149.00, 270.00,
   'Aura solar com bergamota fresca, cardamomo aromático e baunilha bourbon densa.',
   'Inspirado na luz dourada do fim de tarde, L''Heure Dorée abre luminoso e cítrico, aquece com especiarias nobres e repousa num fundo cremoso de baunilha bourbon e madeiras preciosas. Fixação marcante e projeção elegante.',
   array['Bergamota da Calábria', 'Cardamomo', 'Pimenta Rosa'],
   array['Íris', 'Flor de Laranjeira', 'Açafrão'],
   array['Baunilha Bourbon', 'Sândalo', 'Âmbar'],
   array['Oriental', 'Baunilha', 'Amadeirado', 'Cítrico'],
   'Edição Especial',
   'https://lh3.googleusercontent.com/aida-public/AB6AXuD-DGmlPoq3GluiDccKCBkWvRwijqcUeyPvcH7cAT3Kjtklmz5La_SBr91zIGBks9GUKi6-tHUVSwuSyk-j7xuSerjmiBlJPC-Vd7G7nyNBBeIAb_E6E9xcUc9G-14gRIRnJ92Bx1g7i5RQcRXRY1gAURcR-1KxB1dpck7jBSbt3PSp9UfDOF1f4cX1FeG2cW2wC_t5_1xDxg7980BUcChUL_z_RefdomUHXcmQTQojbUQIlZZVcmWxnw',
   10),

  ('santal-imperial', 'Santal Impérial', 'Héliodore Parfums', 'masculino', true, false, false,
   'Eau de Parfum', 100, 1980.00, 150.00, 280.00,
   'Sândalo cremoso de Mysore, couro macio e vetiver raro.',
   'Um amadeirado majestoso construído sobre sândalo cremoso, envolto por couro aveludado e um vetiver haitiano seco. Magnetismo nobre e atemporal.',
   array['Cardamomo', 'Elemi', 'Bergamota'],
   array['Sândalo de Mysore', 'Couro', 'Papiro'],
   array['Vetiver Haitiano', 'Cedro', 'Almíscar'],
   array['Amadeirado', 'Couro', 'Aromático'],
   null, null, 20),

  ('elixir-velours', 'Élixir Velours', 'Atelier de Valmont', 'feminino', true, false, false,
   'Extrait de Parfum', 50, 1890.00, 135.00, 250.00,
   'Rosa aveludada, praliné tostado e baunilha de Madagascar.',
   'Uma composição gourmand sofisticada: rosa turca aveludada encontra praliné tostado e uma baunilha negra de Madagascar. Sensual, envolvente e confortável.',
   array['Pera', 'Pimenta Rosa'],
   array['Rosa Turca', 'Praliné', 'Jasmim Sambac'],
   array['Baunilha de Madagascar', 'Fava Tonka', 'Almíscar Branco'],
   array['Gourmand', 'Baunilha', 'Floral'],
   'Mais Vendido', null, 30),

  ('rose-nocturne', 'Rose Nocturne', 'Maison Aurélia', 'feminino', false, true, false,
   'Eau de Parfum', 100, 1650.00, 120.00, 220.00,
   'Rosa noturna, lichia suculenta e almíscar sedoso.',
   'A rosa vista sob a luz da lua: frutada na saída, profundamente floral no coração e com um rastro almiscarado e limpo que permanece na pele.',
   array['Lichia', 'Framboesa', 'Bergamota'],
   array['Rosa Damascena', 'Peônia', 'Magnólia'],
   array['Almíscar', 'Patchouli Claro', 'Cashmeran'],
   array['Floral', 'Frutado', 'Almiscarado'],
   'Lançamento', null, 40),

  ('cuir-de-minuit', 'Cuir de Minuit', 'Héliodore Parfums', 'masculino', true, false, false,
   'Extrait de Parfum', 75, 2200.00, 160.00, 295.00,
   'Couro fumê, oud suave e resinas ambaradas.',
   'Intenso e noturno: couro fumê e açafrão abrem caminho para um oud suave, finalizado por resinas ambaradas e labdanum. Para quem gosta de deixar presença.',
   array['Açafrão', 'Pimenta Preta'],
   array['Couro', 'Oud', 'Rosa'],
   array['Labdanum', 'Âmbar', 'Benjoim'],
   array['Couro', 'Oriental', 'Amadeirado'],
   null, null, 50),

  ('neroli-lumiere', 'Néroli Lumière', 'Atelier de Valmont', 'unissex', false, true, false,
   'Eau de Parfum', 100, 1390.00, 110.00, 199.00,
   'Néroli radiante, limão siciliano e almíscar limpo.',
   'Frescor mediterrâneo luminoso: néroli e flor de laranjeira sobre uma base almiscarada limpa. Elegante do dia à noite, ideal para o clima brasileiro.',
   array['Limão Siciliano', 'Bergamota', 'Petitgrain'],
   array['Néroli', 'Flor de Laranjeira', 'Alecrim'],
   array['Almíscar Branco', 'Ambrette', 'Vetiver'],
   array['Cítrico', 'Aromático', 'Almiscarado'],
   'Lançamento', null, 60)

on conflict (slug) do update set
  name              = excluded.name,
  house             = excluded.house,
  category          = excluded.category,
  is_niche          = excluded.is_niche,
  is_new            = excluded.is_new,
  is_featured       = excluded.is_featured,
  concentration     = excluded.concentration,
  volume_ml         = excluded.volume_ml,
  price             = excluded.price,
  decant_5ml_price  = excluded.decant_5ml_price,
  decant_10ml_price = excluded.decant_10ml_price,
  short_description = excluded.short_description,
  description       = excluded.description,
  notes_top         = excluded.notes_top,
  notes_heart       = excluded.notes_heart,
  notes_base        = excluded.notes_base,
  families          = excluded.families,
  badge             = excluded.badge,
  sort_order        = excluded.sort_order;
