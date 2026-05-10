-- ============================================================
-- SEED BPMN SLOTS — Disponibilidades Dinâmicas para Testes
-- ============================================================
-- Cria slots de disponibilidade futuros para cada professor,
-- usando CURRENT_DATE em vez de datas fixas.
--
-- Executar DEPOIS de seed_completa.sql:
--   PGPASSWORD=entartes_dev_password psql -h localhost -U entartes -d entartes -f seed_bpmn_slots.sql
-- ============================================================

-- ============================================================
-- 1. João Santos (joao.santos@entartes.pt) — professoruserid = 2
--    Ballet Clássico (modalidade 1) → modalidadeprofessor id
-- ============================================================
DO $$
DECLARE
  v_prof_id INTEGER;
  v_mp_id INTEGER;
BEGIN
  -- Get João Santos ID
  SELECT iduser INTO v_prof_id FROM utilizador WHERE email = 'joao.santos@entartes.pt';
  -- Get his modalidadeprofessor for Ballet Clássico
  SELECT mp.idmodalidadeprofessor INTO v_mp_id
  FROM modalidadeprofessor mp
  JOIN modalidade m ON mp.modalidadeidmodalidade = m.idmodalidade
  WHERE mp.professorutilizadoriduser = v_prof_id AND m.nome = 'Ballet Clássico'
  LIMIT 1;

  -- Slot amanhã: 10:00-11:00
  INSERT INTO disponibilidade_mensal (professorutilizadoriduser, modalidadesprofessoridmodalidadeprofessor, data, horainicio, horafim, ativo, salaid, minutos_ocupados)
  VALUES (v_prof_id, v_mp_id, CURRENT_DATE + 1, '10:00:00'::time, '11:00:00'::time, true, 1, 0)
  ON CONFLICT DO NOTHING;

  -- Slot amanhã+2: 10:00-11:00
  INSERT INTO disponibilidade_mensal (professorutilizadoriduser, modalidadesprofessoridmodalidadeprofessor, data, horainicio, horafim, ativo, salaid, minutos_ocupados)
  VALUES (v_prof_id, v_mp_id, CURRENT_DATE + 3, '10:00:00'::time, '11:00:00'::time, true, 1, 0)
  ON CONFLICT DO NOTHING;

  -- Slot amanhã+4: 14:00-15:30
  INSERT INTO disponibilidade_mensal (professorutilizadoriduser, modalidadesprofessoridmodalidadeprofessor, data, horainicio, horafim, ativo, salaid, minutos_ocupados)
  VALUES (v_prof_id, v_mp_id, CURRENT_DATE + 5, '14:00:00'::time, '15:30:00'::time, true, 1, 0)
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================
-- 2. Maria Pereira (maria.pereira@entartes.pt) — professoruserid = 3
--    Dança Contemporânea (modalidade 2) → modalidadeprofessor
-- ============================================================
DO $$
DECLARE
  v_prof_id INTEGER;
  v_mp_id INTEGER;
BEGIN
  SELECT iduser INTO v_prof_id FROM utilizador WHERE email = 'maria.pereira@entartes.pt';
  SELECT mp.idmodalidadeprofessor INTO v_mp_id
  FROM modalidadeprofessor mp
  JOIN modalidade m ON mp.modalidadeidmodalidade = m.idmodalidade
  WHERE mp.professorutilizadoriduser = v_prof_id AND m.nome = 'Dança Contemporânea'
  LIMIT 1;

  INSERT INTO disponibilidade_mensal (professorutilizadoriduser, modalidadesprofessoridmodalidadeprofessor, data, horainicio, horafim, ativo, salaid, minutos_ocupados)
  VALUES (v_prof_id, v_mp_id, CURRENT_DATE + 2, '15:00:00'::time, '16:30:00'::time, true, 3, 0)
  ON CONFLICT DO NOTHING;

  INSERT INTO disponibilidade_mensal (professorutilizadoriduser, modalidadesprofessoridmodalidadeprofessor, data, horainicio, horafim, ativo, salaid, minutos_ocupados)
  VALUES (v_prof_id, v_mp_id, CURRENT_DATE + 4, '10:00:00'::time, '11:30:00'::time, true, 3, 0)
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================
-- 3. Carlos Ferreira (carlos.ferreira@entartes.pt) — professoruserid = 4
--    Hip-Hop (modalidade 3) → modalidadeprofessor
-- ============================================================
DO $$
DECLARE
  v_prof_id INTEGER;
  v_mp_id INTEGER;
BEGIN
  SELECT iduser INTO v_prof_id FROM utilizador WHERE email = 'carlos.ferreira@entartes.pt';
  SELECT mp.idmodalidadeprofessor INTO v_mp_id
  FROM modalidadeprofessor mp
  JOIN modalidade m ON mp.modalidadeidmodalidade = m.idmodalidade
  WHERE mp.professorutilizadoriduser = v_prof_id AND m.nome = 'Hip-Hop'
  LIMIT 1;

  INSERT INTO disponibilidade_mensal (professorutilizadoriduser, modalidadesprofessoridmodalidadeprofessor, data, horainicio, horafim, ativo, salaid, minutos_ocupados)
  VALUES (v_prof_id, v_mp_id, CURRENT_DATE + 1, '14:00:00'::time, '15:00:00'::time, true, 2, 0)
  ON CONFLICT DO NOTHING;

  INSERT INTO disponibilidade_mensal (professorutilizadoriduser, modalidadesprofessoridmodalidadeprofessor, data, horainicio, horafim, ativo, salaid, minutos_ocupados)
  VALUES (v_prof_id, v_mp_id, CURRENT_DATE + 6, '16:00:00'::time, '17:30:00'::time, true, 2, 0)
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================
-- 4. Ana Rodrigues (ana.rodrigues@entartes.pt) — professoruserid = 5
--    Flamenco (modalidade 6) → modalidadeprofessor
-- ============================================================
DO $$
DECLARE
  v_prof_id INTEGER;
  v_mp_id INTEGER;
BEGIN
  SELECT iduser INTO v_prof_id FROM utilizador WHERE email = 'ana.rodrigues@entartes.pt';
  SELECT mp.idmodalidadeprofessor INTO v_mp_id
  FROM modalidadeprofessor mp
  JOIN modalidade m ON mp.modalidadeidmodalidade = m.idmodalidade
  WHERE mp.professorutilizadoriduser = v_prof_id AND m.nome = 'Flamenco'
  LIMIT 1;

  INSERT INTO disponibilidade_mensal (professorutilizadoriduser, modalidadesprofessoridmodalidadeprofessor, data, horainicio, horafim, ativo, salaid, minutos_ocupados)
  VALUES (v_prof_id, v_mp_id, CURRENT_DATE + 3, '18:00:00'::time, '19:30:00'::time, true, 1, 0)
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================
-- RESUMO
-- ============================================================
SELECT 'DISPONIBILIDADES FUTURAS' as tabela, COUNT(*) as total FROM disponibilidade_mensal
WHERE data >= CURRENT_DATE;

\echo ''
\echo '✅ Seed BPMN executada com sucesso!';
