-- =====================================================================
-- AVELINE – Inserção dos produtos no Supabase
-- Execute este script no SQL Editor do Supabase (supabase.com/dashboard)
-- Depois, use o painel /admin para adicionar as imagens de cada produto.
-- =====================================================================

-- Limpa produtos antigos (se houver)
delete from public.products;

insert into public.products
  (slug, name, house, category, is_niche, is_new, is_featured, concentration, volume_ml, price, short_description, description, notes_top, notes_heart, notes_base, families, badge, in_stock, active, sort_order)
values
  ('delina', 'Delina', 'Parfums de Marly', 'feminino', true, false, true,
   'Eau de Parfum', 75, 7500.00,
   'Rosa turca, lichia e peônia com fundo de almíscar e baunilha.',
   'Delina é uma rosa moderna e sofisticada. Abre fresca com lichia e bergamota, floresce em rosa turca e peônia no coração, e repousa num fundo cremoso de almíscar, baunilha e cashmeran.',
   '{"Lichia","Bergamota","Noz-moscada"}', '{"Rosa Turca","Peônia","Muguet"}', '{"Almíscar","Baunilha","Cashmeran"}',
   '{"Floral","Frutado","Almiscarado"}', null, true, true, 10),

  ('layton', 'Layton', 'Parfums de Marly', 'unissex', true, false, false,
   'Eau de Parfum', 125, 12500.00,
   'Maçã, lavanda e baunilha com cardamomo e sândalo cremoso.',
   'Layton é um aromático especiado irresistível. Maçã e lavanda abrem caminho para jasmim e cardamomo, finalizando com baunilha, sândalo e guaiaco. Projeção imponente e fixação excepcional.',
   '{"Maçã","Lavanda","Mandarim"}', '{"Jasmim","Cardamomo","Violeta"}', '{"Baunilha","Sândalo","Guaiaco"}',
   '{"Aromático","Especiado","Amadeirado"}', null, true, true, 20),

  ('hacivat', 'Hacivat', 'Nishane', 'unissex', true, false, false,
   'Extrait de Parfum', 100, 10000.00,
   'Abacaxi, patchouli e musgo de carvalho com bergamota fresca.',
   'Hacivat é frescor e potência. Abacaxi tropical e bergamota encontram patchouli terroso e musgo de carvalho. Frescor frutado com alma amadeirada, projeção monstruosa.',
   '{"Abacaxi","Bergamota","Toranja"}', '{"Jasmim","Rosa","Patchouli"}', '{"Musgo de Carvalho","Sândalo","Cedro"}',
   '{"Frutado","Amadeirado","Aromático"}', null, true, true, 30),

  ('hundred-silent-ways', 'Hundred Silent Ways', 'Nishane', 'unissex', true, false, false,
   'Extrait de Parfum', 100, 10000.00,
   'Neroli, oud e âmbar com notas de damasco e patchouli.',
   'Uma fragrância contemplativa e envolvente. Neroli e damasco abrem luminosos, enquanto oud e patchouli trazem profundidade. Âmbar e almíscar selam com calor e sensualidade.',
   '{"Neroli","Damasco","Pêssego"}', '{"Oud","Rosa","Canela"}', '{"Âmbar","Patchouli","Almíscar"}',
   '{"Oriental","Amadeirado","Floral"}', null, true, true, 40),

  ('oud-wood', 'Oud Wood', 'Tom Ford', 'unissex', true, false, false,
   'Eau de Parfum', 100, 10000.00,
   'Oud raro, sândalo, vetiver e cardamomo numa composição sofisticada.',
   'O clássico de Tom Ford. Oud exótico envolto em sândalo cremoso e vetiver, com toques de cardamomo e pimenta rosa. Elegância discreta com fixação duradoura.',
   '{"Cardamomo","Pimenta Rosa","Oud"}', '{"Sândalo","Vetiver","Fava Tonka"}', '{"Âmbar","Almíscar","Baunilha"}',
   '{"Amadeirado","Oriental","Aromático"}', null, true, true, 50),

  ('lost-cherry', 'Lost Cherry', 'Tom Ford', 'unissex', true, false, false,
   'Eau de Parfum', 100, 10000.00,
   'Cereja preta, licor de amêndoa e baunilha com notas de Peru.',
   'Sensualidade gourmand: cereja preta e licor de amêndoa encontram jasmim e flor de cerejeira, num fundo de baunilha, sândalo e bálsamo do Peru. Viciante e envolvente.',
   '{"Cereja Preta","Licor de Amêndoa","Griotte"}', '{"Flor de Cerejeira","Jasmim","Rosa Turca"}', '{"Baunilha","Sândalo","Bálsamo do Peru"}',
   '{"Gourmand","Frutado","Floral"}', null, true, true, 60),

  ('no-1', 'No. 1', 'Clive Christian', 'unissex', true, false, false,
   'Parfum', 50, 5000.00,
   'Rosa, bergamota e sândalo com âmbar e baunilha numa composição opulenta.',
   'Um dos perfumes mais luxuosos do mundo. Bergamota e lima abrem passo para rosa, jasmim e orquídea. A base é uma cascata de sândalo, âmbar, baunilha e cedro. Opulência rara.',
   '{"Bergamota","Lima","Pêssego"}', '{"Rosa","Jasmim","Orquídea"}', '{"Sândalo","Âmbar","Baunilha"}',
   '{"Floral","Oriental","Amadeirado"}', null, true, true, 70),

  ('naxos', 'Naxos', 'Xerjoff', 'unissex', true, false, true,
   'Eau de Parfum', 100, 10000.00,
   'Tabaco, mel, lavanda e baunilha numa harmonia gourmand aromática.',
   'Inspirado na Sicília. Lavanda e bergamota encontram tabaco doce e mel no coração, repousando em baunilha, canela e cashmeran. Um clássico contemporâneo de projeção envolvente.',
   '{"Lavanda","Bergamota","Limão"}', '{"Tabaco","Mel","Canela"}', '{"Baunilha","Cashmeran","Fava Tonka"}',
   '{"Aromático","Gourmand","Especiado"}', null, true, true, 80),

  ('erba-pura', 'Erba Pura', 'Xerjoff', 'unissex', true, false, false,
   'Eau de Parfum', 100, 10000.00,
   'Frutas sicilianas, almíscar branco e âmbar numa fragrância luminosa.',
   'Frescor frutado irresistível. Laranja, limão e frutas sicilianas encontram almíscar branco e âmbar dourado. Luminosa, alegre e com projeção surpreendente.',
   '{"Laranja Siciliana","Limão","Frutas"}', '{"Frutas Brancas","Freesia"}', '{"Almíscar Branco","Âmbar","Notas Açucaradas"}',
   '{"Frutado","Almiscarado","Cítrico"}', null, true, true, 90),

  ('erba-pura-magica', 'Erba Pura Magica', 'Sospiro', 'unissex', true, true, false,
   'Eau de Parfum', 100, 10000.00,
   'Versão intensificada do Erba Pura com frutas e âmbar amplificados.',
   'A evolução mágica do Erba Pura. Frutas tropicais e cítricas em maior intensidade, com almíscar e âmbar potencializados. Mesmo DNA frutado, mas com mais corpo e projeção.',
   '{"Laranja","Manga","Frutas Tropicais"}', '{"Pêssego","Frutas Brancas","Freesia"}', '{"Almíscar","Âmbar","Baunilha"}',
   '{"Frutado","Almiscarado","Oriental"}', 'Lançamento', true, true, 100),

  ('guidance', 'Guidance', 'Amouage', 'unissex', true, true, false,
   'Eau de Parfum', 100, 10000.00,
   'Gengibre, incenso e âmbar numa composição mística e envolvente.',
   'Uma fragrância mística. Gengibre e olíbano abrem com energia, jasmim e incenso trazem espiritualidade ao coração, e âmbar, bálsamo e oud selam com profundidade contemplativa.',
   '{"Gengibre","Olíbano","Bergamota"}', '{"Jasmim","Incenso","Íris"}', '{"Âmbar","Oud","Bálsamo"}',
   '{"Oriental","Amadeirado","Especiado"}', 'Lançamento', true, true, 110),

  ('reflection-man', 'Reflection Man', 'Amouage', 'masculino', true, false, false,
   'Eau de Parfum', 100, 10000.00,
   'Jasmim, neroli e sândalo numa composição floral masculina refinada.',
   'Elegância rara. Neroli e pimenta rosa abrem luminosos, jasmim e orris trazem sofisticação ao coração. Sândalo, cedro e almíscar completam uma fragrância impecável.',
   '{"Neroli","Pimenta Rosa","Alecrim"}', '{"Jasmim","Orris","Ylang Ylang"}', '{"Sândalo","Cedro","Almíscar"}',
   '{"Floral","Amadeirado","Aromático"}', null, true, true, 120),

  ('aventus', 'Aventus', 'Creed', 'masculino', true, false, true,
   'Eau de Parfum', 100, 10000.00,
   'Abacaxi, bétula defumada e almíscar: o ícone da perfumaria masculina.',
   'O perfume masculino mais icônico da era moderna. Abacaxi e maçã verde abrem frutados, bétula defumada e jasmim trazem poder ao coração, e almíscar, musgo de carvalho e baunilha selam com presença inconfundível.',
   '{"Abacaxi","Maçã Verde","Bergamota"}', '{"Bétula","Jasmim","Patchouli"}', '{"Almíscar","Musgo de Carvalho","Baunilha"}',
   '{"Frutado","Amadeirado","Aromático"}', null, true, true, 130),

  ('carmina', 'Queen of Silk / Carmina', 'Creed', 'feminino', true, true, false,
   'Eau de Parfum', 75, 7500.00,
   'Rosa búlgara, framboesa e almíscar branco numa composição feminina sedosa.',
   'Feminilidade em estado puro. Framboesa e bergamota abrem vibrantes, rosa búlgara e jasmim sambac florescem no coração, e almíscar branco e sândalo envolvem com suavidade sedosa.',
   '{"Framboesa","Bergamota","Pimenta Rosa"}', '{"Rosa Búlgara","Jasmim Sambac","Peônia"}', '{"Almíscar Branco","Sândalo","Cashmeran"}',
   '{"Floral","Frutado","Almiscarado"}', 'Lançamento', true, true, 140),

  ('sauvage-eau-forte', 'Sauvage Eau Forte', 'Christian Dior', 'masculino', false, true, false,
   'Eau Forte', 100, 10000.00,
   'Bergamota, lavanda e ambroxan numa releitura refrescante do Sauvage.',
   'A versão mais fresca e aquática do icônico Sauvage. Bergamota e lavanda abrem energéticas, notas aquáticas e salinas trazem frescor marítimo, e ambroxan e cedro finalizam com magnetismo.',
   '{"Bergamota","Lavanda","Notas Aquáticas"}', '{"Sal Marinho","Gerânio","Pimenta"}', '{"Ambroxan","Cedro","Almíscar"}',
   '{"Aromático","Aquático","Amadeirado"}', 'Lançamento', true, true, 150),

  ('prima-donna', 'Prima Donna', 'Sospiro', 'unissex', true, false, false,
   'Eau de Parfum', 100, 10000.00,
   'Rosa, oud e almíscar numa fragrância opulenta e magnética.',
   'Uma diva olfativa. Rosa damascena e açafrão abrem poderosos, oud e incenso dominam o coração, e almíscar, âmbar e baunilha trazem calor e sensualidade. Presença garantida.',
   '{"Rosa","Açafrão","Bergamota"}', '{"Oud","Incenso","Jasmim"}', '{"Almíscar","Âmbar","Baunilha"}',
   '{"Oriental","Floral","Amadeirado"}', null, true, true, 160),

  ('tuberoza', 'Tuberoza', 'Nishane', 'unissex', true, false, false,
   'Extrait de Parfum', 100, 0.00,
   'Tuberosa hipnótica, jasmim e almíscar branco.',
   'Uma ode à tuberosa. Flor de laranjeira e tuberosa dominam do início ao fim, com jasmim e ylang ylang ampliando a intensidade floral. Almíscar branco e sândalo dão suavidade ao fundo.',
   '{"Flor de Laranjeira","Bergamota"}', '{"Tuberosa","Jasmim","Ylang Ylang"}', '{"Almíscar Branco","Sândalo","Cashmeran"}',
   '{"Floral","Almiscarado","Oriental"}', null, false, true, 170),

  ('valiant', 'Valiant', 'Boadicea the Victorious', 'unissex', true, false, false,
   'Eau de Parfum', 100, 10000.00,
   'Junípero, couro e oud com lavanda e patchouli.',
   'Coragem em forma de fragrância. Junípero e lavanda abrem herbais e frescos, couro e oud trazem força ao coração, e patchouli, vetiver e âmbar completam com masculinidade refinada.',
   '{"Junípero","Lavanda","Bergamota"}', '{"Couro","Oud","Gerânio"}', '{"Patchouli","Vetiver","Âmbar"}',
   '{"Amadeirado","Couro","Aromático"}', null, true, true, 180),

  ('bleu-de-chanel', 'Bleu de Chanel', 'Chanel', 'masculino', false, false, false,
   'Eau de Parfum', 100, 10000.00,
   'Menta, cedro e incenso num amadeirado aromático sofisticado.',
   'O clássico moderno da Chanel. Menta e toranja abrem refrescantes, cedro e jasmin trazem elegância ao coração, e incenso, sândalo e vetiver finalizam com profundidade e sofisticação.',
   '{"Menta","Toranja","Limão"}', '{"Cedro","Jasmim","Iso E Super"}', '{"Incenso","Sândalo","Vetiver"}',
   '{"Amadeirado","Aromático","Cítrico"}', null, true, true, 190),

  ('la-bomba', 'La Bomba', 'Carolina Herrera', 'feminino', false, true, false,
   'Eau de Parfum', 80, 8000.00,
   'Frutas tropicais, jasmim e baunilha numa explosão feminina vibrante.',
   'Energia latina em frasco. Frutas tropicais e maracujá abrem vibrantes, jasmim e flor de laranjeira trazem feminilidade, e baunilha, almíscar e notas caramelizadas finalizam com doçura magnética.',
   '{"Maracujá","Manga","Bergamota"}', '{"Jasmim","Flor de Laranjeira","Gardênia"}', '{"Baunilha","Almíscar","Caramelo"}',
   '{"Frutado","Floral","Gourmand"}', 'Lançamento', true, true, 200),

  ('212-men-nyc', '212 Men NYC', 'Carolina Herrera', 'masculino', false, false, false,
   'Eau de Toilette', 100, 0.00,
   'Toranja, especiarias e sândalo num fougère urbano e fresco.',
   'O espírito de Nova York. Toranja e especiarias verdes abrem energéticos, gardênia e gengibre trazem frescor moderno, e sândalo, almíscar e incenso finalizam com elegância cosmopolita.',
   '{"Toranja","Especiarias Verdes","Lavanda"}', '{"Gardênia","Gengibre","Pimenta"}', '{"Sândalo","Almíscar","Incenso"}',
   '{"Aromático","Amadeirado","Cítrico"}', null, false, true, 210),

  ('le-male', 'Le Male', 'Jean Paul Gaultier', 'masculino', false, false, false,
   'Eau de Toilette', 125, 12500.00,
   'Lavanda, menta e baunilha no fougère oriental mais icônico.',
   'O ícone da perfumaria masculina desde 1995. Lavanda e menta abrem frescos e aromáticos, canela e cominho trazem calor oriental, e baunilha, âmbar e fava tonka selam com sensualidade reconhecível a metros de distância.',
   '{"Lavanda","Menta","Bergamota"}', '{"Canela","Cominho","Flor de Laranjeira"}', '{"Baunilha","Âmbar","Fava Tonka"}',
   '{"Aromático","Oriental","Especiado"}', null, true, true, 220);
