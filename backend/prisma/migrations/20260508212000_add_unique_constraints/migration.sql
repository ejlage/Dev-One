-- Add unique constraints to estado and estadoaula tables
-- This prevents duplicate entries in the seed data

CREATE UNIQUE INDEX IF NOT EXISTS "estado_tipoestado_key" ON "estado" ("tipoestado");
CREATE UNIQUE INDEX IF NOT EXISTS "estadoaula_nomeestadoaula_key" ON "estadoaula" ("nomeestadoaula");
