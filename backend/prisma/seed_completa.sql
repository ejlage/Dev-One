-- ============================================================
-- SEED COMPLETA - ENTARTES
-- Povoa todas as tabelas com dados de teste
-- Executar: PGPASSWORD=entartes_dev_password psql -h localhost -U entartes -d entartes -f seed_completa.sql
-- ============================================================

-- ============================================================
-- 1. TABELAS BASE (sem dependências)
-- ============================================================

-- Estados das salas
INSERT INTO estadosala (nomeestadosala) VALUES 
  ('Disponível'), ('Ocupada'), ('Em Manutenção'), ('Reservada')
ON CONFLICT DO NOTHING;

-- Tipos de sala
INSERT INTO tiposala (nometiposala) VALUES 
  ('Estúdio'), ('Sala de Ensaio'), ('Auditório'), ('Sala de Ballet'), ('Sala Multiusos')
ON CONFLICT DO NOTHING;

-- Estados de aula (para a tabela 'aula')
INSERT INTO estadoaula (nomeestadoaula) VALUES 
  ('PENDENTE'), ('CONFIRMADA'), ('CANCELADA'), ('REALIZADA')
ON CONFLICT DO NOTHING;

-- Estados gerais (pedidos, anúncios, transações)
INSERT INTO estado (tipoestado) VALUES 
  ('Pendente'), ('Confirmado'), ('Rejeitado'), ('Aprovado'), ('Cancelado'), ('Concluído')
ON CONFLICT DO NOTHING;

-- Estados de uso de figurino
INSERT INTO estadouso (estadouso) VALUES 
  ('Disponível'), ('Alugado'), ('Reservado'), ('Em Manutenção'), ('Danificado'), ('Extraviado')
ON CONFLICT DO NOTHING;

-- Modalidades
INSERT INTO modalidade (nome) VALUES 
  ('Ballet Clássico'), ('Dança Contemporânea'), ('Hip-Hop'), ('Jazz'), 
  ('Dança Urbana'), ('Flamenco'), ('Dança Criativa'), ('Dança Espiritual'), 
  ('Karatê'), ('Pilates'), ('Yoga'), ('Street Dance')
ON CONFLICT DO NOTHING;

-- Cores
INSERT INTO cor (nomecor) VALUES 
  ('Preto'), ('Branco'), ('Azul'), ('Vermelho'), ('Rosa'), 
  ('Dourado'), ('Prateado'), ('Verde'), ('Roxo'), ('Laranja'), 
  ('Amarelo'), ('Bege'), ('Cinzento'), ('Marinho'), ('Coral'), ('Lavanda')
ON CONFLICT DO NOTHING;

-- Géneros
INSERT INTO genero (nomegenero) VALUES 
  ('Feminino'), ('Masculino'), ('Unissexo'), 
  ('Infantil Feminino'), ('Infantil Masculino'), ('Unissexo Infantil')
ON CONFLICT DO NOTHING;

-- Tamanhos
INSERT INTO tamanho (nometamanho) VALUES 
  ('XS'), ('S'), ('M'), ('L'), ('XL'), ('XXL'), 
  ('2'), ('4'), ('6'), ('8'), ('10'), ('12'), ('14'), ('16'), ('18'), ('34'), ('36'), ('38'), ('40'), ('42'), ('44')
ON CONFLICT DO NOTHING;

-- Tipos de figurino
INSERT INTO tipofigurino (tipofigurino) VALUES 
  ('Collant de Ballet'), ('Saia de Ballet'), ('Tutu'), ('Leotard'), 
  ('Calções de Dança'), ('Top de Dança'), ('Macacão'), ('Vestido de Espetáculo'), 
  ('Camisa de Dança'), ('Calças de Dança'), ('Sapatilha de Ballet'), 
  ('Sapatilha de Jazz'), ('Sapatilha de Dança'), ('Boné'), ('Luvas'), 
  ('Meias de Dança'), ('Manto'), ('Capa'), ('Chapéu'), ('Fita de Ballet')
ON CONFLICT DO NOTHING;

-- Item de figurino (localizações de armazém)
INSERT INTO itemfigurino (localizacao) VALUES 
  ('Armazém Principal'), ('Armazém Secundário'), ('Armazém Figurinos'), 
  ('Vitrine Principal'), ('Depósito A'), ('Depósito B')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. UTILIZADORES E ROLES
-- ============================================================

-- Password: password123 (hash bcrypt gerado corretamente)
-- Utilizadores - DIREÇÃO
INSERT INTO utilizador (nome, email, telemovel, password, estado, role) VALUES 
  ('Direção Ent''Artes', 'direcao@entartes.pt', '911111111', '$2b$10$vdsZ/5fZvqi2dgYg3toHL.jGVOGt4IN7ZUyEZ5ZwFhJXJi4oidcaG', true, 'DIRECAO')
ON CONFLICT (email) DO NOTHING;

-- Utilizadores - PROFESSORES
INSERT INTO utilizador (nome, email, telemovel, password, estado, role) VALUES 
  ('João Santos', 'joao.santos@entartes.pt', '911111112', '$2b$10$vdsZ/5fZvqi2dgYg3toHL.jGVOGt4IN7ZUyEZ5ZwFhJXJi4oidcaG', true, 'PROFESSOR'),
  ('Maria Pereira', 'maria.pereira@entartes.pt', '911111113', '$2b$10$vdsZ/5fZvqi2dgYg3toHL.jGVOGt4IN7ZUyEZ5ZwFhJXJi4oidcaG', true, 'PROFESSOR'),
  ('Carlos Ferreira', 'carlos.ferreira@entartes.pt', '911111120', '$2b$10$vdsZ/5fZvqi2dgYg3toHL.jGVOGt4IN7ZUyEZ5ZwFhJXJi4oidcaG', true, 'PROFESSOR'),
  ('Ana Rodrigues', 'ana.rodrigues@entartes.pt', '911111121', '$2b$10$vdsZ/5fZvqi2dgYg3toHL.jGVOGt4IN7ZUyEZ5ZwFhJXJi4oidcaG', true, 'PROFESSOR')
ON CONFLICT (email) DO NOTHING;

-- Utilizadores - ENCARREGADOS DE EDUCAÇÃO
INSERT INTO utilizador (nome, email, telemovel, password, estado, role) VALUES 
  ('Pedro Oliveira', 'pedro.oliveira@email.pt', '911111114', '$2b$10$vdsZ/5fZvqi2dgYg3toHL.jGVOGt4IN7ZUyEZ5ZwFhJXJi4oidcaG', true, 'ENCARREGADO'),
  ('Sofia Martins', 'sofia.martins@email.pt', '911111115', '$2b$10$vdsZ/5fZvqi2dgYg3toHL.jGVOGt4IN7ZUyEZ5ZwFhJXJi4oidcaG', true, 'ENCARREGADO'),
  ('Miguel Sousa', 'miguel.sousa@email.pt', '911111116', '$2b$10$vdsZ/5fZvqi2dgYg3toHL.jGVOGt4IN7ZUyEZ5ZwFhJXJi4oidcaG', true, 'ENCARREGADO'),
  ('Francisca Costa', 'francisca.costa@email.pt', '911111117', '$2b$10$vdsZ/5fZvqi2dgYg3toHL.jGVOGt4IN7ZUyEZ5ZwFhJXJi4oidcaG', true, 'ENCARREGADO'),
  ('Ricardo Lopes', 'ricardo.lopes@email.pt', '911111118', '$2b$10$vdsZ/5fZvqi2dgYg3toHL.jGVOGt4IN7ZUyEZ5ZwFhJXJi4oidcaG', true, 'ENCARREGADO')
ON CONFLICT (email) DO NOTHING;

-- Utilizadores - ALUNOS
INSERT INTO utilizador (nome, email, telemovel, password, estado, role) VALUES 
  ('Miguel Silva', 'miguel.silva@email.pt', '911111119', '$2b$10$vdsZ/5fZvqi2dgYg3toHL.jGVOGt4IN7ZUyEZ5ZwFhJXJi4oidcaG', true, 'ALUNO'),
  ('Lara Santos', 'lara.santos@email.pt', '911111122', '$2b$10$vdsZ/5fZvqi2dgYg3toHL.jGVOGt4IN7ZUyEZ5ZwFhJXJi4oidcaG', true, 'ALUNO'),
  ('Diogo Costa', 'diogo.costa@email.pt', '911111123', '$2b$10$vdsZ/5fZvqi2dgYg3toHL.jGVOGt4IN7ZUyEZ5ZwFhJXJi4oidcaG', true, 'ALUNO'),
  ('Beatriz Ferreira', 'beatriz.ferreira@email.pt', '911111124', '$2b$10$vdsZ/5fZvqi2dgYg3toHL.jGVOGt4IN7ZUyEZ5ZwFhJXJi4oidcaG', true, 'ALUNO'),
  ('Tiago Almeida', 'tiago.almeida@email.pt', '911111125', '$2b$10$vdsZ/5fZvqi2dgYg3toHL.jGVOGt4IN7ZUyEZ5ZwFhJXJi4oidcaG', true, 'ALUNO'),
  ('Inês Rodrigues', 'ines.rodrigues@email.pt', '911111126', '$2b$10$vdsZ/5fZvqi2dgYg3toHL.jGVOGt4IN7ZUyEZ5ZwFhJXJi4oidcaG', true, 'ALUNO'),
  ('João Paulo', 'joao.paulo@email.pt', '911111127', '$2b$10$vdsZ/5fZvqi2dgYg3toHL.jGVOGt4IN7ZUyEZ5ZwFhJXJi4oidcaG', true, 'ALUNO'),
  ('Marta Lima', 'marta.lima@email.pt', '911111128', '$2b$10$vdsZ/5fZvqi2dgYg3toHL.jGVOGt4IN7ZUyEZ5ZwFhJXJi4oidcaG', true, 'ALUNO')
ON CONFLICT (email) DO NOTHING;

-- Tabelas de Role (obrigatórias para o backend funcionar)

-- DIREÇÃO
INSERT INTO direcao (utilizadoriduser) 
SELECT iduser FROM utilizador WHERE role = 'DIRECAO' AND NOT EXISTS (SELECT 1 FROM direcao WHERE utilizadoriduser = utilizador.iduser)
ON CONFLICT DO NOTHING;

-- PROFESSORES
INSERT INTO professor (utilizadoriduser) 
SELECT iduser FROM utilizador WHERE role = 'PROFESSOR' AND NOT EXISTS (SELECT 1 FROM professor WHERE utilizadoriduser = utilizador.iduser)
ON CONFLICT DO NOTHING;

-- ENCARREGADOS DE EDUCAÇÃO
INSERT INTO encarregadoeducacao (utilizadoriduser) 
SELECT iduser FROM utilizador WHERE role = 'ENCARREGADO' AND NOT EXISTS (SELECT 1 FROM encarregadoeducacao WHERE utilizadoriduser = utilizador.iduser)
ON CONFLICT DO NOTHING;

-- ALUNOS (com vínculo a encarregados)
INSERT INTO aluno (utilizadoriduser, encarregadoiduser)
SELECT 
  u.iduser,
  (SELECT utilizadoriduser FROM utilizador WHERE email = 'pedro.oliveira@email.pt' LIMIT 1)
FROM utilizador u
WHERE u.role = 'ALUNO' 
  AND NOT EXISTS (SELECT 1 FROM aluno WHERE utilizadoriduser = u.iduser)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. SALAS
-- ============================================================

INSERT INTO sala (nomesala, capacidade, estadosalaidestadosala, tiposalaidtiposala) VALUES 
  ('Estúdio A - Principal', 20, 1, 1),
  ('Estúdio B - Ensaio', 15, 1, 2),
  ('Estúdio C - Multifuncional', 10, 1, 2),
  ('Sala de Ballet', 25, 1, 4),
  ('Auditório', 100, 1, 3),
  ('Sala Multiusos', 30, 1, 5),
  ('Estúdio D', 12, 1, 1),
  ('Sala de Treino', 18, 1, 2)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. MODELOS DE FIGURINO
-- ============================================================

INSERT INTO modelofigurino (nomemodelo, descricao, fotografia, tipofigurinoidtipofigurino) VALUES 
  ('Collant Clássico Rosa', 'Collant de ballet para iniciantes em tecido de alta qualidade', 'collant_classico_rosa.jpg', 1),
  ('Collant Preto Premium', 'Collant profissional em licra preta', 'collant_preto.jpg', 1),
  ('Tutu Romântico Branco', 'Tutu para espetáculos de ballet clássico', 'tutu_romantico.jpg', 3),
  ('Tutu Tutu Collection', 'Tutu de competição镀金', 'tutu_collection.jpg', 3),
  ('Saia Plissada Rosa', 'Saia de ballet plissada estiloromântico', 'saia_plissada.jpg', 2),
  ('Leotard Preto', 'Leotard profissional para jazz e contemporânea', 'leotard_preto.jpg', 4),
  ('Leotard Rosa Shimmer', 'Leotard com brilho para espetáculos', 'leotard_shimmer.jpg', 4),
  ('Calções Jazz Preto', 'Calções confortáveis para aula de jazz', 'calcoes_jazz.jpg', 5),
  ('Top Dança Contemporânea', 'Top elástico para dança contemporânea', 'top_contempo.jpg', 6),
  ('Macacão Preto Elegance', 'Macacão elegante para ensaios', 'macacao_elegance.jpg', 7),
  ('Vestido Gala Dourado', 'Vestido de espetáculo para gala', 'vestido_gala.jpg', 8),
  ('Vestido Espetáculo Rosa', 'Vestido de inúmeropara apresentações', 'vestido_espetaculo.jpg', 8),
  ('Sapatilha Ballet Rosa Clara', 'Sapatilha de Ballet em satin Rosa', 'sapatilha_rosa.jpg', 11),
  ('Sapatilha Ballet Rosa Escuro', 'Sapatilha de Ballet em satin Rosa Escuro', 'sapatilha_rosa_escuro.jpg', 11),
  ('Sapatilha Jazz Preto', 'Sapatilha de jazz profissional', 'sapatilha_jazz.jpg', 12)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. MODALIDADES POR PROFESSOR
-- ============================================================

-- João Santos -> Ballet Clássico, Jazz
INSERT INTO modalidadeprofessor (modalidadeidmodalidade, professorutilizadoriduser) 
SELECT m.idmodalidade, p.utilizadoriduser
FROM modalidade m, professor p, utilizador u
WHERE u.email = 'joao.santos@entartes.pt' AND u.iduser = p.utilizadoriduser
  AND m.nome IN ('Ballet Clássico', 'Jazz')
  AND NOT EXISTS (
    SELECT 1 FROM modalidadeprofessor mp 
    WHERE mp.modalidadeidmodalidade = m.idmodalidade AND mp.professorutilizadoriduser = p.utilizadoriduser
  )
ON CONFLICT DO NOTHING;

-- Maria Pereira -> Dança Contemporânea, Ballet Clássico
INSERT INTO modalidadeprofessor (modalidadeidmodalidade, professorutilizadoriduser) 
SELECT m.idmodalidade, p.utilizadoriduser
FROM modalidade m, professor p, utilizador u
WHERE u.email = 'maria.pereira@entartes.pt' AND u.iduser = p.utilizadoriduser
  AND m.nome IN ('Dança Contemporânea', 'Ballet Clássico')
  AND NOT EXISTS (
    SELECT 1 FROM modalidadeprofessor mp 
    WHERE mp.modalidadeidmodalidade = m.idmodalidade AND mp.professorutilizadoriduser = p.utilizadoriduser
  )
ON CONFLICT DO NOTHING;

-- Carlos Ferreira -> Hip-Hop, Dança Urbana
INSERT INTO modalidadeprofessor (modalidadeidmodalidade, professorutilizadoriduser) 
SELECT m.idmodalidade, p.utilizadoriduser
FROM modalidade m, professor p, utilizador u
WHERE u.email = 'carlos.ferreira@entartes.pt' AND u.iduser = p.utilizadoriduser
  AND m.nome IN ('Hip-Hop', 'Dança Urbana')
  AND NOT EXISTS (
    SELECT 1 FROM modalidadeprofessor mp 
    WHERE mp.modalidadeidmodalidade = m.idmodalidade AND mp.professorutilizadoriduser = p.utilizadoriduser
  )
ON CONFLICT DO NOTHING;

-- Ana Rodrigues -> Flamenco, Dança Espiritual
INSERT INTO modalidadeprofessor (modalidadeidmodalidade, professorutilizadoriduser) 
SELECT m.idmodalidade, p.utilizadoriduser
FROM modalidade m, professor p, utilizador u
WHERE u.email = 'ana.rodrigues@entartes.pt' AND u.iduser = p.utilizadoriduser
  AND m.nome IN ('Flamenco', 'Dança Espiritual')
  AND NOT EXISTS (
    SELECT 1 FROM modalidadeprofessor mp 
    WHERE mp.modalidadeidmodalidade = m.idmodalidade AND mp.professorutilizadoriduser = p.utilizadoriduser
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. GRUPOS / TURMAS
-- ============================================================

INSERT INTO grupo (nomegrupo, status, descricao, modalidade, nivel, faixaEtaria, professorId, estudioId, diasSemana, horaInicio, horaFim, duracao, lotacaoMaxima, dataInicio, dataFim, cor, requisitos) VALUES 
  ('Ballet Iniciantes', 'ABERTA', 'Turma de ballet para crianças dos 6 aos 10 anos', 'Ballet Clássico', 'Iniciante', '6-10 anos', 2, 1, 'Sábado', '10:00', '11:00', 60, 15, '2026-01-01', '2026-12-31', '#FF69B4', 'Calças e t-shirt brancos'),
  ('Ballet Intermédio', 'ABERTA', 'Turma de ballet para alunos com experiência', 'Ballet Clássico', 'Intermédio', '11-16 anos', 2, 1, 'Quarta|Sábado', '15:00', '16:30', 90, 12, '2026-01-01', '2026-12-31', '#E91E63', 'Collant rosa e sapatilhas'),
  ('Jazz Moderno', 'ABERTA', 'Aula de jazz com/coreografia', 'Jazz', 'Iniciante', '10-16 anos', 2, 2, 'Terça|Quinta', '17:00', '18:30', 90, 15, '2026-01-01', '2026-12-31', '#4169E1', 'Calções e top'),
  ('Dança Contemporânea', 'ABERTA', 'Expressão corporal e técnica contemporânea', 'Dança Contemporânea', 'Intermédio', '14-18 anos', 3, 3, 'Segunda|Sexta', '18:00', '19:30', 90, 10, '2026-01-01', '2026-12-31', '#9C27B0', 'Roupa confortável'),
  ('Hip-Hop Jovem', 'ABERTA', 'Estilos urbanos para adolescentes', 'Hip-Hop', 'Iniciante', '12-18 anos', 4, 2, 'Quarta', '19:00', '20:30', 90, 20, '2026-01-01', '2026-12-31', '#FF5722', 'Roupa desportiva'),
  ('Flamenco', 'FECHADA', 'Técnica de flamenco tradicional', 'Flamenco', 'Avançado', 'Adultos', 5, 1, 'Sexta', '20:00', '21:30', 90, 8, '2026-01-01', '2026-06-30', '#795548', 'Sapatos de flamenco'),
  ('Pilates Adults', 'ABERTA', 'Aula de pilates para adultos', 'Pilates', 'Todos', '18+', NULL, 4, 'Terça|Quinta', '09:00', '10:00', 60, 12, '2026-01-01', '2026-12-31', '#00BCD4', 'Roupa cómoda')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. DISPONIBILIDADES MENSAIS
-- ============================================================

-- Disponibilidades para João Santos (professor 2)
INSERT INTO disponibilidade_mensal (professorutilizadoriduser, modalidadesprofessoridmodalidadeprofessor, data, horainicio, horafim, ativo, salaid, minutos_ocupados)
SELECT 
  p.utilizadoriduser,
  (SELECT idmodalidadeprofessor FROM modalidadeprofessor WHERE professorutilizadoriduser = p.utilizadoriduser AND modalidadeidmodalidade = 1 LIMIT 1),
  '2026-05-05'::date,
  '10:00:00'::time,
  '11:00:00'::time,
  true,
  1,
  0
FROM professor p, utilizador u
WHERE u.email = 'joao.santos@entartes.pt' AND u.iduser = p.utilizadoriduser
ON CONFLICT DO NOTHING;

INSERT INTO disponibilidade_mensal (professorutilizadoriduser, modalidadesprofessoridmodalidadeprofessor, data, horainicio, horafim, ativo, salaid, minutos_ocupados)
SELECT 
  p.utilizadoriduser,
  (SELECT idmodalidadeprofessor FROM modalidadeprofessor WHERE professorutilizadoriduser = p.utilizadoriduser AND modalidadeidmodalidade = 1 LIMIT 1),
  '2026-05-06'::date,
  '14:00:00'::time,
  '15:30:00'::time,
  true,
  1,
  0
FROM professor p, utilizador u
WHERE u.email = 'joao.santos@entartes.pt' AND u.iduser = p.utilizadoriduser
ON CONFLICT DO NOTHING;

INSERT INTO disponibilidade_mensal (professorutilizadoriduser, modalidadesprofessoridmodalidadeprofessor, data, horainicio, horafim, ativo, salaid, minutos_ocupados)
SELECT 
  p.utilizadoriduser,
  (SELECT idmodalidadeprofessor FROM modalidadeprofessor WHERE professorutilizadoriduser = p.utilizadoriduser AND modalidadeidmodalidade = 1 LIMIT 1),
  '2026-05-07'::date,
  '16:00:00'::time,
  '17:00:00'::time,
  true,
  2,
  0
FROM professor p, utilizador u
WHERE u.email = 'joao.santos@entartes.pt' AND u.iduser = p.utilizadoriduser
ON CONFLICT DO NOTHING;

-- Disponibilidades para Maria Pereira (professor 3)
INSERT INTO disponibilidade_mensal (professorutilizadoriduser, modalidadesprofessoridmodalidadeprofessor, data, horainicio, horafim, ativo, salaid, minutos_ocupados)
SELECT 
  p.utilizadoriduser,
  (SELECT idmodalidadeprofessor FROM modalidadeprofessor WHERE professorutilizadoriduser = p.utilizadoriduser AND modalidadeidmodalidade = 2 LIMIT 1),
  '2026-05-05'::date,
  '10:00:00'::time,
  '11:30:00'::time,
  true,
  3,
  0
FROM professor p, utilizador u
WHERE u.email = 'maria.pereira@entartes.pt' AND u.iduser = p.utilizadoriduser
ON CONFLICT DO NOTHING;

INSERT INTO disponibilidade_mensal (professorutilizadoriduser, modalidadesprofessoridmodalidadeprofessor, data, horainicio, horafim, ativo, salaid, minutos_ocupados)
SELECT 
  p.utilizadoriduser,
  (SELECT idmodalidadeprofessor FROM modalidadeeprofessor WHERE professorutilizadoriduser = p.utilizadoriduser AND modalidadeidmodalidade = 1 LIMIT 1),
  '2026-05-06'::date,
  '15:00:00'::time,
  '16:30:00'::time,
  true,
  1,
  0
FROM professor p, utilizador u
WHERE u.email = 'maria.pereira@entartes.pt' AND u.iduser = p.utilizadoriduser
ON CONFLICT DO NOTHING;

INSERT INTO disponibilidade_mensal (professorutilizadoriduser, modalidadesprofessoridmodalidadeprofessor, data, horainicio, horafim, ativo, salaid, minutos_ocupados)
SELECT 
  p.utilizadoriduser,
  (SELECT idmodalidadeprofessor FROM modalidadeprofessor WHERE professorutilizadoriduser = p.utilizadoriduser AND modalidadeidmodalidade = 2 LIMIT 1),
  '2026-05-08'::date,
  '18:00:00'::time,
  '19:30:00'::time,
  true,
  3,
  0
FROM professor p, utilizador u
WHERE u.email = 'maria.pereira@entartes.pt' AND u.iduser = p.utilizadoriduser
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. FIGURINOS (STOCK)
-- ============================================================

-- Figurinos da Direção (criados pela escola)
INSERT INTO figurino (quantidadedisponivel, quantidadetotal, modelofigurinoidmodelo, generoidgenero, tamanhoidtamanho, coridcor, estadousoidestado, direcaoutilizadoriduser, itemfigurinoiditem)
SELECT 
  5, 5, m.idmodelo, g.idgenero, t.idtamanho, c.idcor, e.idestado, d.utilizadoriduser, i.iditem
FROM modelofigurino m, genero g, tamanho t, cor c, estadouso e, direcao d, itemfigurino i, utilizador u
WHERE u.email = 'direcao@entartes.pt' AND u.iduser = d.utilizadoriduser
  AND m.nomemodelo = 'Collant Clássico Rosa'
  AND g.nomegenero = 'Feminino'
  AND t.nometamanho = 'M'
  AND c.nomecor = 'Rosa'
  AND e.estadouso = 'Disponível'
  AND i.localizacao = 'Armazém Principal'
ON CONFLICT DO NOTHING;

INSERT INTO figurino (quantidadedisponivel, quantidadetotal, modelofigurinoidmodelo, generoidgenero, tamanhoidtamanho, coridcor, estadousoidestado, direcaoutilizadoriduser, itemfigurinoiditem)
SELECT 
  3, 3, m.idmodelo, g.idgenero, t.idtamanho, c.idcor, e.idestado, d.utilizadoriduser, i.iditem
FROM modelofigurino m, genero g, tamanho t, cor c, estadouso e, direcao d, itemfigurino i, utilizador u
WHERE u.email = 'direcao@entartes.pt' AND u.iduser = d.utilizadoriduser
  AND m.nomemodelo = 'Tutu Romântico Branco'
  AND g.nomegenero = 'Feminino'
  AND t.nometamanho = 'S'
  AND c.nomecor = 'Branco'
  AND e.estadouso = 'Disponível'
  AND i.localizacao = 'Armazém Principal'
ON CONFLICT DO NOTHING;

INSERT INTO figurino (quantidadedisponivel, quantidadetotal, modelofigurinoidmodelo, generoidgenero, tamanhoidtamanho, coridcor, estadousoidestado, direcaoutilizadoriduser, itemfigurinoiditem)
SELECT 
  8, 10, m.idmodelo, g.idgenero, t.idtamanho, c.idcor, e.idestado, d.utilizadoriduser, i.iditem
FROM modelofigurino m, genero g, tamanho t, cor c, estadouso e, direcao d, itemfigurino i, utilizador u
WHERE u.email = 'direcao@entartes.pt' AND u.iduser = d.utilizadoriduser
  AND m.nomemodelo = 'Collant Preto Premium'
  AND g.nomegenero = 'Unissexo'
  AND t.nometamanho = 'L'
  AND c.nomecor = 'Preto'
  AND e.estadouso = 'Disponível'
  AND i.localizacao = 'Armazém Principal'
ON CONFLICT DO NOTHING;

INSERT INTO figurino (quantidadedisponivel, quantidadetotal, modelofigurinoidmodelo, generoidgenero, tamanhoidtamanho, coridcor, estadousoidestado, direcaoutilizadoriduser, itemfigurinoiditem)
SELECT 
  4, 4, m.idmodelo, g.idgenero, t.idtamanho, c.idcor, e.idestado, d.utilizadoriduser, i.iditem
FROM modelofigurino m, genero g, tamanho t, cor c, estadouso e, direcao d, itemfigurino i, utilizador u
WHERE u.email = 'direcao@entartes.pt' AND u.iduser = d.utilizadoriduser
  AND m.nomemodelo = 'Leotard Preto'
  AND g.nomegenero = 'Masculino'
  AND t.nometamanho = 'M'
  AND c.nomecor = 'Preto'
  AND e.estadouso = 'Disponível'
  AND i.localizacao = 'Armazém Secundário'
ON CONFLICT DO NOTHING;

INSERT INTO figurino (quantidadedisponivel, quantidadetotal, modelofigurinoidmodelo, generoidgenero, tamanhoidtamanho, coridcor, estadousoidestado, direcaoutilizadoriduser, itemfigurinoiditem)
SELECT 
  6, 6, m.idmodelo, g.idgenero, t.idtamanho, c.idcor, e.idestado, d.utilizadoriduser, i.iditem
FROM modelofigurino m, genero g, tamanho t, cor c, estadouso e, direcao d, itemfigurino i, utilizador u
WHERE u.email = 'direcao@entartes.pt' AND u.iduser = d.utilizadoriduser
  AND m.nomemodelo = 'Sapatilha Ballet Rosa Clara'
  AND g.nomegenero = 'Feminino'
  AND t.nometamanho = '36'
  AND c.nomecor = 'Rosa'
  AND e.estadouso = 'Disponível'
  AND i.localizacao = 'Vitrine Principal'
ON CONFLICT DO NOTHING;

INSERT INTO figurino (quantidadedisponivel, quantidadetotal, modelofigurinoidmodelo, generoidgenero, tamanhoidtamanho, coridcor, estadousoidestado, direcaoutilizadoriduser, itemfigurinoiditem)
SELECT 
  5, 5, m.idmodelo, g.idgenero, t.idtamanho, c.idcor, e.idestado, d.utilizadoriduser, i.iditem
FROM modelofigurino m, genero g, tamanho t, cor c, estadouso e, direcao d, itemfigurino i, utilizador u
WHERE u.email = 'direcao@entartes.pt' AND u.iduser = d.utilizadoriduser
  AND m.nomemodelo = 'Sapatilha Jazz Preto'
  AND g.nomegenero = 'Masculino'
  AND t.nometamanho = '42'
  AND c.nomecor = 'Preto'
  AND e.estadouso = 'Disponível'
  AND i.localizacao = 'Vitrine Principal'
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. EVENTOS
-- ============================================================

INSERT INTO evento (titulo, descricao, dataevento, datafim, localizacao, imagem, linkbilhetes, publicado, destaque, direcaoutilizadoriduser) VALUES 
  ('Espetáculo de Fim de Ano', 'Apresentação final dos alunos com coreografias de ballet, jazz e dança contemporânea. Venha assistir ao trabalho desenvolvido durante o ano letivo.', '2026-06-15'::date, '2026-06-15'::date, 'Teatro Municipal de Gaia', 'https://example.com/espetaculo.jpg', 'https://bilhetes.espetaculo.pt', true, true, 1),
  ('Festival de Dança Júnior', 'Competição interna de dança para alunos dos 6 aos 12 anos. Categorias: Ballet, Jazz e Dança Criativa.', '2026-05-20'::date, '2026-05-20'::date, 'Auditório da Escola', 'https://example.com/festival.jpg', NULL, true, false, 1),
  ('Noite de Gala', 'Gala de encerramento do ano letivo com presenças especiais e inúmeropara alunos e familiares.', '2026-06-20'::date, '2026-06-20'::date, 'Teatro Municipal de Gaia', 'https://example.com/gala.jpg', 'https://bilhetes.gala.pt', true, true, 1),
  ('Workshop de Ballet Clássico', 'Workshop com maestro de ballet clássico. Aberto a todos os níveis.', '2026-05-10'::date, '2026-05-10'::date, 'Estúdio A', 'https://example.com/workshop.jpg', NULL, true, false, 1),
  ('Aula Aberta de Dança Contemporânea', 'Aula experimental aberta ao público. Venha conhecer a metodologia da escola.', '2026-04-25'::date, '2026-04-25'::date, 'Estúdio C', NULL, NULL, false, false, 1),
  ('Exposição de Figurinos', 'Exposição dos figurinos históricos da escola desde 1990.', '2026-07-01'::date, '2026-07-15'::date, 'Sala de Exposições', 'https://example.com/exposicao.jpg', NULL, true, false, 1),
  ('Concurso de Coreografia', 'Concurso interno de coreografia originais entre alunos.', '2026-05-30'::date, '2026-05-30'::date, 'Auditório', NULL, NULL, true, true, 1)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 10. CONTACTOS (formulário de contactos)
-- ============================================================

INSERT INTO contacto (nome, email, telemovel, modalidade, faixaetaria, mensagem) VALUES 
  ('Ana Catarina', 'ana.catarina@gmail.com', '912345671', 'Ballet Clássico', '6-10 anos', 'Olá! Gostaria de information sobre as aulas de ballet para a minha filha de 8 anos.'),
  ('Bruno Silva', 'bruno.silva@gmail.com', '912345672', 'Hip-Hop', '12-18 anos', 'Tenho interesse nas aulas de hip-hop para adolescentes.'),
  ('Carla Rodrigues', 'carla.rodrigues@gmail.com', '912345673', 'Dança Contemporânea', '18+ anos', 'Gostaria de saber se têm vagas para adultos na disciplina de dança contemporânea.'),
  ('Daniel Costa', 'daniel.costa@gmail.com', '912345674', 'Jazz', '10-16 anos', 'Meu filho de 14 anos quer experimentar aulas de jazz.'),
  ('Elisa Ferreira', 'elisa.ferreira@gmail.com', '912345675', 'Ballet Clássico', '6-10 anos', 'Olá, gostaria de marcar uma aula experimental para a minha filha.'),
  ('Filipa Mendes', 'filipa.mendes@gmail.com', '912345676', 'Pilates', '18+ anos', 'Tenho interesse em experimentar uma aula de pilates.'),
  ('Gonçalo Lima', 'goncalo.lima@gmail.com', '912345677', 'Dança Urbana', '12-18 anos', 'Olá! Há vagas para o curso de dança urbana?')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 11. PEDIDOS DE AULA
-- ============================================================

-- PENDENTE
INSERT INTO pedidodeaula (data, horainicio, duracaoaula, maxparticipantes, datapedido, privacidade, disponibilidade_mensal_id, professorutilizadoriduser, alunoutilizadoriduser, grupoidgrupo, estadoidestado, salaidsala, encarregadoeducacaoutilizadoriduser)
SELECT 
  '2026-05-05'::date,
  '10:00:00'::time,
  '01:00:00'::interval,
  1,
  NOW()::date,
  false,
  1, -- disponibilidade_mensal_id
  2, -- professorutilizadoriduser (João Santos)
  (SELECT iduser FROM utilizador WHERE email = 'miguel.silva@email.pt' LIMIT 1),
  1, -- grupoidgrupo (Ballet Iniciantes)
  (SELECT idestado FROM estado WHERE tipoestado = 'Pendente' LIMIT 1),
  1, -- salaidsala
  (SELECT utilizadoriduser FROM encarregadoeducacao e JOIN utilizador u ON u.iduser = e.utilizadoriduser WHERE u.email = 'pedro.oliveira@email.pt' LIMIT 1)
ON CONFLICT DO NOTHING;

-- CONFIRMADO
INSERT INTO pedidodeaula (data, horainicio, duracaoaula, maxparticipantes, datapedido, privacidade, disponibilidade_mensal_id, professorutilizadoriduser, alunoutilizadoriduser, grupoidgrupo, estadoidestado, salaidsala, encarregadoeducacaoutilizadoriduser)
SELECT
  '2026-04-15'::date,
  '14:00:00'::time,
  '01:30:00'::interval,
  1,
  '2026-04-10'::date,
  false,
  NULL,
  3, -- professorutilizadoriduser (Maria Pereira)
  (SELECT iduser FROM utilizador WHERE email = 'miguel.silva@email.pt' LIMIT 1), -- aluno Miguel Silva
  4, -- grupoidgrupo (Dança Contemporânea)
  (SELECT idestado FROM estado WHERE tipoestado = 'Confirmado' LIMIT 1),
  3,
  (SELECT utilizadoriduser FROM encarregadoeducacao e JOIN utilizador u ON u.iduser = e.utilizadoriduser WHERE u.email = 'pedro.oliveira@email.pt' LIMIT 1)
ON CONFLICT DO NOTHING;

-- REJEITADO
INSERT INTO pedidodeaula (data, horainicio, duracaoaula, maxparticipantes, datapedido, privacidade, disponibilidade_mensal_id, professorutilizadoriduser, alunoutilizadoriduser, grupoidgrupo, estadoidestado, salaidsala, encarregadoeducacaoutilizadoriduser)
SELECT
  '2026-03-20'::date,
  '16:00:00'::time,
  '01:00:00'::interval,
  1,
  '2026-03-15'::date,
  false,
  NULL,
  2,
  (SELECT iduser FROM utilizador WHERE email = 'miguel.silva@email.pt' LIMIT 1), -- aluno Miguel Silva
  2,
  (SELECT idestado FROM estado WHERE tipoestado = 'Rejeitado' LIMIT 1),
  2,
  (SELECT utilizadoriduser FROM encarregadoeducacao e JOIN utilizador u ON u.iduser = e.utilizadoriduser WHERE u.email = 'pedro.oliveira@email.pt' LIMIT 1)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 12. AULAS (confirmadas)
-- ============================================================

INSERT INTO aula (pedidodeaulaidpedidoaula, salaidsala, estadoaulaidestadoaula)
SELECT 
  p.idpedidoaula,
  p.salaidsala,
  (SELECT idestadoaula FROM estadoaula WHERE nomeestadoaula = 'CONFIRMADA' LIMIT 1)
FROM pedidodeaula p
WHERE p.estadoidestado = (SELECT idestado FROM estado WHERE tipoestado = 'Confirmado' LIMIT 1)
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================================
-- 13. ALUNOGRUPO (matrículas)
-- ============================================================

-- Matricular alunos nos grupos
INSERT INTO alunogrupo (alunoidaluno, grupoidgrupo)
SELECT a.idaluno, 1
FROM aluno a, utilizador u
WHERE u.email = 'miguel.silva@email.pt' AND u.iduser = a.utilizadoriduser
  AND NOT EXISTS (SELECT 1 FROM alunogrupo WHERE alunoidaluno = a.idaluno AND grupoidgrupo = 1)
ON CONFLICT DO NOTHING;

INSERT INTO alunogrupo (alunoidaluno, grupoidgrupo)
SELECT a.idaluno, 3
FROM aluno a, utilizador u
WHERE u.email = 'lara.santos@email.pt' AND u.iduser = a.utilizadoriduser
  AND NOT EXISTS (SELECT 1 FROM alunogrupo WHERE alunoidaluno = a.idaluno AND grupoidgrupo = 3)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 14. ALUNOAULA (alunos em aulas)
-- ============================================================

INSERT INTO alunoaula (alunoidaluno, aulaidaula)
SELECT 
  a.idaluno,
  (SELECT idaula FROM aula LIMIT 1)
FROM aluno a, utilizador u
WHERE u.email = 'miguel.silva@email.pt' AND u.iduser = a.utilizadoriduser
  AND NOT EXISTS (SELECT 1 FROM alunoaula WHERE alunoidaluno = a.idaluno AND aulaidaula = (SELECT idaula FROM aula LIMIT 1))
ON CONFLICT DO NOTHING;

-- ============================================================
-- 15. NOTIFICAÇÕES
-- ============================================================

INSERT INTO notificacao (mensagem, tipo, lida, datanotificacao, utilizadoriduser) VALUES 
  ('O seu pedido de aula foi aprovado!', 'AULA_APROVADA', false, NOW(), (SELECT iduser FROM utilizador WHERE email = 'pedro.oliveira@email.pt' LIMIT 1)),
  ('Nova aula confirmada para amanhã', 'AULA_CONFIRMADA', true, NOW() - INTERVAL '1 day', (SELECT iduser FROM utilizador WHERE email = 'joao.santos@entartes.pt' LIMIT 1)),
  ('O seu pedido de aula está pendente de aprovação', 'AULA_PENDENTE', false, NOW() - INTERVAL '2 days', (SELECT iduser FROM utilizador WHERE email = 'pedro.oliveira@email.pt' LIMIT 1)),
  ('Novo anúncio publicado no Marketplace', 'ANUNCIO_NOVO', true, NOW() - INTERVAL '3 days', (SELECT iduser FROM utilizador WHERE email = 'direcao@entartes.pt' LIMIT 1)),
  ('A sua reserva de figurino foi aprovada', 'ALUGUER_APROVADO', false, NOW() - INTERVAL '4 hours', (SELECT iduser FROM utilizador WHERE email = 'pedro.oliveira@email.pt' LIMIT 1)),
  ('Lembre-se: espetáculo de fim de mês', 'EVENTO', true, NOW() - INTERVAL '5 days', (SELECT iduser FROM utilizador WHERE email = 'miguel.silva@email.pt' LIMIT 1))
ON CONFLICT DO NOTHING;

-- ============================================================
-- 16. ANÚNCIOS (Marketplace)
-- ============================================================

-- Anúncio APROVADO (visível)
INSERT INTO anuncio (valor, dataanuncio, datainicio, datafim, quantidade, figurinoidfigurino, estadoidestado, direcaoutilizadoriduser, encarregadoeducacaoutilizadoriduser, tipotransacao)
SELECT 
  150.00,
  '2026-04-01'::date,
  '2026-04-01'::date,
  '2026-12-31'::date,
  1,
  (SELECT idfigurino FROM figurino LIMIT 1),
  (SELECT idestado FROM estado WHERE tipoestado = 'Aprovado' LIMIT 1),
  1, -- direcao
  (SELECT utilizadoriduser FROM encarregadoeducacao e JOIN utilizador u ON u.iduser = e.utilizadoriduser WHERE u.email = 'pedro.oliveira@email.pt' LIMIT 1),
  'ALUGUER'
ON CONFLICT DO NOTHING;

-- Anúncio PENDENTE (à espera de aprovação)
INSERT INTO anuncio (valor, dataanuncio, datainicio, datafim, quantidade, figurinoidfigurino, estadoidestado, professorutilizadoriduser, tipotransacao)
SELECT 
  200.00,
  '2026-04-10'::date,
  '2026-05-01'::date,
  '2026-08-31'::date,
  1,
  (SELECT idfigurino FROM figurino OFFSET 1 LIMIT 1),
  (SELECT idestado FROM estado WHERE tipoestado = 'Pendente' LIMIT 1),
  2, -- professor
  'VENDA'
ON CONFLICT DO NOTHING;

-- ============================================================
-- 17. TRANSAÇÕES DE FIGURINO
-- ============================================================

-- Transação de ALUGUER (ativa)
INSERT INTO transacaofigurino (quantidade, datatransacao, anuncioidanuncio, estadoidestado, direcaoutilizadoriduser, encarregadoeducacaoutilizadoriduser)
SELECT 
  1,
  '2026-04-20'::date,
  (SELECT idanuncio FROM anuncio WHERE tipotransacao = 'ALUGUER' AND estadoidestado = (SELECT idestado FROM estado WHERE tipoestado = 'Aprovado' LIMIT 1) LIMIT 1),
  (SELECT idestado FROM estado WHERE tipoestado = 'Confirmado' LIMIT 1),
  1,
  (SELECT utilizadoriduser FROM encarregadoeducacao e JOIN utilizador u ON u.iduser = e.utilizadoriduser WHERE u.email = 'pedro.oliveira@email.pt' LIMIT 1)
ON CONFLICT DO NOTHING;

-- ============================================================
-- RESUMO
-- ============================================================

SELECT 'UTILIZADORES' as tabela, COUNT(*) as total FROM utilizador
UNION ALL SELECT 'DIREÇÃO', COUNT(*) FROM direcao
UNION ALL SELECT 'PROFESSORES', COUNT(*) FROM professor
UNION ALL SELECT 'ENCARREGADOS', COUNT(*) FROM encarregadoeducacao
UNION ALL SELECT 'ALUNOS', COUNT(*) FROM aluno
UNION ALL SELECT 'SALAS', COUNT(*) FROM sala
UNION ALL SELECT 'GRUPOS', COUNT(*) FROM grupo
UNION ALL SELECT 'DISPONIBILIDADES', COUNT(*) FROM disponibilidade_mensal
UNION ALL SELECT 'FIGURINOS', COUNT(*) FROM figurino
UNION ALL SELECT 'MODELOS FIG', COUNT(*) FROM modelofigurino
UNION ALL SELECT 'EVENTOS', COUNT(*) FROM evento
UNION ALL SELECT 'CONTACTOS', COUNT(*) FROM contacto
UNION ALL SELECT 'PEDIDOS AULA', COUNT(*) FROM pedidodeaula
UNION ALL SELECT 'AULAS', COUNT(*) FROM aula
UNION ALL SELECT 'MATRÍCULAS', COUNT(*) FROM alunogrupo
UNION ALL SELECT 'NOTIFICAÇÕES', COUNT(*) FROM notificacao
UNION ALL SELECT 'ANÚNCIOS', COUNT(*) FROM anuncio
UNION ALL SELECT 'TRANSAÇÕES', COUNT(*) FROM transacaofigurino;

\echo ''
\echo '✅ Seed completa executada com sucesso!'