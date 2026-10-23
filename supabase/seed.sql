-- ==============================================================================
-- SISTEMA DE GERENCIAMENTO DE DOAÇÕES - PROJETO DE EXTENSÃO UNIVERSITÁRIA
-- Arquivo: seed.sql
-- Descrição: Dados de exemplo realistas para demonstração e avaliação
-- ==============================================================================

-- Limpeza prévia segura dos dados de teste (caso queira reiniciar a demonstração)
delete from public.destinations;
delete from public.needs;
delete from public.donations;

-- ==============================================================================
-- 1. DOAÇÕES RECEBIDAS (16 itens variados com datas relativas e dados realistas)
-- ==============================================================================

insert into public.donations (id, description, category, quantity, unit, entry_date, condition, expiration_date, donor_name, notes)
values
-- ALIMENTOS
('11111111-1111-1111-1111-111111111101', 'Arroz Agulhinha Tipo 1 (fardo 5kg)', 'alimentos', 20, 'pacote', current_date - 12, 'novo', current_date + 180, 'Mercado Central', 'Doação da campanha de arrecadação de alimentos'),
('11111111-1111-1111-1111-111111111102', 'Feijão Carioca 1kg', 'alimentos', 30, 'kg', current_date - 10, 'novo', current_date + 120, 'Comunidade Santo Antônio', 'Pacotes lacrados em ótimo estado'),
('11111111-1111-1111-1111-111111111103', 'Leite Longa Vida Integral 1L', 'alimentos', 48, 'litro', current_date - 5, 'bom', current_date + 8, 'Supermercado da Família', 'ATENÇÃO: Vencimento próximo (8 dias). Priorizar distribuição.'),
('11111111-1111-1111-1111-111111111104', 'Macarrão Espaguete 500g', 'alimentos', 40, 'pacote', current_date - 8, 'novo', current_date + 90, 'Anônimo', 'Entregue na portaria da instituição'),
('11111111-1111-1111-1111-111111111105', 'Iogurte Natural 170g', 'alimentos', 24, 'un', current_date - 2, 'bom', current_date + 4, 'Laticínios Vale Verde', 'Manter sob refrigeração. Distribuir imediatamente.'),
('11111111-1111-1111-1111-111111111106', 'Óleo de Soja 900ml', 'alimentos', 24, 'un', current_date - 15, 'novo', current_date + 240, 'Campanha Universitária ADS', 'Caixa com 24 unidades fechada'),

-- HIGIENE
('11111111-1111-1111-1111-111111111107', 'Sabonete em Barra 90g', 'higiene', 60, 'un', current_date - 20, 'novo', current_date + 365, 'Drogaria Popular', 'Diversas fragrâncias'),
('11111111-1111-1111-1111-111111111108', 'Creme Dental 90g', 'higiene', 50, 'un', current_date - 14, 'novo', current_date + 300, 'Associação de Moradores', 'Embalagens individuais'),
('11111111-1111-1111-1111-111111111109', 'Fralda Geriátrica Tamanho G', 'higiene', 15, 'pacote', current_date - 6, 'novo', null, 'Anônimo', 'Item de alta demanda no abrigo parceiro'),
('11111111-1111-1111-1111-111111111110', 'Álcool em Gel 70% 500ml', 'higiene', 18, 'un', current_date - 25, 'bom', current_date + 60, 'Empresa Parceira', 'Frascos com dosador'),

-- ROUPAS E AGASALHOS
('11111111-1111-1111-1111-111111111111', 'Agasalhos e Casacos de Inverno (Adulto)', 'roupas', 25, 'un', current_date - 18, 'bom', null, 'Gincana Escolar Solidária', 'Roupas lavadas e selecionadas por tamanho'),
('11111111-1111-1111-1111-111111111112', 'Cobertores Térmicos de Microfibra', 'roupas', 20, 'un', current_date - 4, 'novo', null, 'Grupo Corrente do Bem', 'Cobertores novos embalados'),
('11111111-1111-1111-1111-111111111113', 'Calçados Infantis Variados (Tamanhos 26 a 34)', 'roupas', 16, 'un', current_date - 9, 'usado', null, 'Anônimo', 'Tênis e sandálias limpos em bom estado de conservação'),
('11111111-1111-1111-1111-111111111114', 'Roupas de Bebê (Body e Macacões)', 'roupas', 35, 'un', current_date - 3, 'bom', null, 'Clube das Mães', 'Peças de 0 a 12 meses'),

-- BRINQUEDOS E OUTROS
('11111111-1111-1111-1111-111111111115', 'Jogos Educativos e Quebra-Cabeças', 'brinquedos', 12, 'un', current_date - 16, 'novo', null, 'Livraria Central', 'Material para brinquedoteca comunitária'),
('11111111-1111-1111-1111-111111111116', 'Cadeiras de Rodas para Transporte', 'outros', 2, 'un', current_date - 30, 'necessita_atencao', null, 'Rotary Club Local', 'Uma cadeira necessita lubrificação nas rodas antes do uso');

-- ==============================================================================
-- 2. DESTINAÇÕES REALIZADAS (Saídas que movimentam o estoque)
-- ==============================================================================

insert into public.destinations (id, donation_id, quantity, destination_date, destination_target, notes)
values
-- Destinação de parte do Arroz (20 recebidos, 8 destinados -> sobra 12)
('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 8, current_date - 5, 'Montagem de Cestas Básicas - Ação Vila Esperança', 'Distribuído em kits alimentares para 8 famílias cadastradas'),

-- Destinação de parte do Feijão (30 recebidos, 10 destinados -> sobra 20)
('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102', 10, current_date - 5, 'Montagem de Cestas Básicas - Ação Vila Esperança', 'Kits familiares entregues na sede da associação'),

-- Destinação do Leite (48 recebidos, 24 destinados -> sobra 24)
('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111103', 24, current_date - 1, 'Creche Comunitária Arco-Íris', 'Entrega emergencial devido ao consumo prioritário'),

-- Destinação de Cobertores (20 recebidos, 12 destinados -> sobra 8)
('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111112', 12, current_date - 2, 'Ação Noite Solidária - Centro de Acolhimento', 'Entregue diretamente à equipe de assistência social noturna'),

-- Destinação de Fraldas Geriátricas (15 recebidos, 5 destinados -> sobra 10)
('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111109', 5, current_date - 3, 'Lar dos Idosos São Vicente', 'Remessa de apoio para idosos em acolhimento');

-- ==============================================================================
-- 3. NECESSIDADES PRIORITÁRIAS CADASTRADAS
-- ==============================================================================

insert into public.needs (id, description, category, priority, status, notes)
values
('33333333-3333-3333-3333-333333333301', 'Fórmula Infantil e Leite sem Lactose', 'alimentos', 'alta', 'aberta', 'Solicitação urgente para 4 bebês com intolerância atendidos pelo projeto'),
('33333333-3333-3333-3333-333333333302', 'Fraldas Infantis Tamanhos M e G', 'higiene', 'alta', 'aberta', 'Estoque zerado na instituição no momento'),
('33333333-3333-3333-3333-333333333303', 'Óleo e Sal para Cestas de Alimentos', 'alimentos', 'media', 'aberta', 'Itens necessários para completar 20 cestas básicas no final do mês'),
('33333333-3333-3333-3333-333333333304', 'Agasalhos Infantis para Idade de 4 a 10 anos', 'roupas', 'media', 'aberta', 'Previsão de frente fria para as próximas semanas'),
('33333333-3333-3333-3333-333333333305', 'Sabão em Pó e Desinfetante para Limpeza Geral', 'higiene', 'baixa', 'aberta', 'Manutenção e higiene da sede de acolhimento'),
('33333333-3333-3333-3333-333333333306', 'Cobertores Térmicos de Inverno', 'roupas', 'alta', 'atendida', 'Atendida com a remessa recebida do Grupo Corrente do Bem');
