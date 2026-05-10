-- Seed Data para Entartes
-- Executar: PGPASSWORD=entartes_dev_password psql -h localhost -U entartes -d entartes -f seed.sql

-- ============================================
-- CRIAR ALUNOS (vinculados a utilizadores)
-- ============================================

-- Verificar se já existem alunos para os utilizadores ALUNO
SELECT * FROM utilizador WHERE role = 'ALUNO';

-- Criar alunos para utilizadores que não têm
INSERT INTO aluno (utilizadoriduser, encarregadoiduser)
SELECT u.iduser, e.utilizadoriduser
FROM utilizador u
LEFT JOIN encarregadoeducacao e ON u.iduser = e.utilizadoriduser
WHERE u.role = 'ALUNO'
AND NOT EXISTS (SELECT 1 FROM aluno WHERE utilizadoriduser = u.iduser);

-- ============================================
-- CRIAR EVENTOS
-- ============================================

INSERT INTO evento (nomeevento, descricao, dataevento, localevento, direcaoutilizadoriduser)
VALUES 
('Espetáculo de Fim de Ano', 'Apresentação final dos alunos com coreografias de ballet, jazz e dança contemporânea', '2026-06-15 19:00:00', 'Teatro Municipal de Gaia', 1),
('Festival de Dança Júnior', 'Competição interna de dança para alunos dos 6 aos 12 anos', '2026-04-20 14:00:00', 'Auditório da Escola', 1),
('Noite de Gala', 'Gala de encerramento do ano letivo com presenças especiais', '2026-06-20 20:00:00', 'Teatro Municipal de Gaia', 1),
('Workshop de Ballet Clássico', 'Workshop com maestro de ballet clássico', '2026-05-10 10:00:00', 'Estúdio 1', 1);

-- ============================================
-- CRIAR ANÚNCIOS
-- ============================================

-- Primeiro verificar estados de anúncio
SELECT idestado, tipoestado FROM estado WHERE tipoestado IN ('Pendente', 'Aprovado', 'Rejeitado') LIMIT 3;

-- Inserir anúncios (ajustar conforme IDs reais)
INSERT INTO anuncio (valor, dataanuncio, datainicio, datafim, quantidade, figurinoidfigurino, estadoidestado, direcaoutilizadoriduser, encarregadoeducacaoutilizadoriduser, professorutilizadoriduser)
VALUES 
(150, '2026-04-01', '2026-04-01', '2026-12-31', 1, 1, 2, 1, 7, 5),
(200, '2026-04-05', '2026-04-05', '2026-12-31', 1, 2, 2, 1, 7, 5);

-- ============================================
-- CRIAR PEDIDOS DE AULA
-- ============================================

-- Verificar modalidades
SELECT idmodalidade, nome FROM modalidade LIMIT 5;

-- Criar pedidos de aula
INSERT INTO pedidodeaula (datapedido, datainicioaula, horainicio, horafim, descricao, estadoidestado, grupoidenturno, tipoaulaidtipoaula, grupoidenturno_origem)
VALUES 
('2026-04-10', '2026-04-15', '10:00:00', '11:00:00', 'Aula de Ballet Iniciantes', 1, 1, 3, NULL),
('2026-04-11', '2026-04-16', '14:00:00', '15:00:00', 'Aula de Jazz Intermediário', 1, 2, 3, NULL),
('2026-04-12', '2026-04-17', '16:00:00', '17:00:00', 'Aula de Ballet Avançado', 1, 1, 1, NULL),
('2026-04-13', '2026-04-18', '11:00:00', '12:00:00', 'Aula de Dança Contemporânea', 1, 2, 2, NULL);

-- ============================================
-- CRIAR AULAS (a partir de pedidos confirmados)
-- ============================================

-- Primeiro confirmar alguns pedidos
UPDATE pedidodeaula SET estadoidestado = 2 WHERE idpedidoaula = 1;
UPDATE pedidodeaula SET estadoidestado = 2 WHERE idpedidoaula = 2;

-- Criar aulas
INSERT INTO aula (pedidodeaulaidpedidoaula, salaidsala, estadoaulaidestadoaula)
VALUES 
(1, 1, 2),  -- Confirmada
(2, 2, 2);  -- Confirmada

-- ============================================
-- MATRICULAR ALUNOS NAS TURMAS/GRUPOS
-- ============================================

-- Verificar alunos
SELECT idaluno, utilizadoriduser FROM aluno;

-- Matricular alunos nos grupos
INSERT INTO alunogrupo (alunoidaluno, grupoidgrupo)
SELECT a.idaluno, 1
FROM aluno a
WHERE NOT EXISTS (SELECT 1 FROM alunogrupo WHERE alunoidaluno = a.idaluno AND grupoidgrupo = 1)
LIMIT 3;

INSERT INTO alunogrupo (alunoidaluno, grupoidgrupo)
SELECT a.idaluno, 2
FROM aluno a
WHERE NOT EXISTS (SELECT 1 FROM alunogrupo WHERE alunoidaluno = a.idaluno AND grupoidgrupo = 2)
LIMIT 2;

-- ============================================
-- VERIFICAR DADOS CRIADOS
-- ============================================

SELECT 'Utilizadores' as tabela, COUNT(*) as total FROM utilizador
UNION ALL SELECT 'Alunos', COUNT(*) FROM aluno
UNION ALL SELECT 'Salas', COUNT(*) FROM sala
UNION ALL SELECT 'Grupos', COUNT(*) FROM grupo
UNION ALL SELECT 'Aulas', COUNT(*) FROM aula
UNION ALL SELECT 'Pedidos Aula', COUNT(*) FROM pedidodeaula
UNION ALL SELECT 'Eventos', COUNT(*) FROM evento
UNION ALL SELECT 'Anúncios', COUNT(*) FROM anuncio;
