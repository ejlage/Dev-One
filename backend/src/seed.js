import prisma from "./config/db.js";
import bcrypt from "bcrypt";

const seed = async () => {
  console.log("🌱 Seed data...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  const users = [
    { nome: "Direção Ent'Artes", email: "direcao@entartes.pt", telemovel: "911111111", role: "DIRECAO" },
    { nome: "João Santos", email: "joao.santos@entartes.pt", telemovel: "911111112", role: "PROFESSOR" },
    { nome: "Maria Pereira", email: "maria.pereira@entartes.pt", telemovel: "911111113", role: "PROFESSOR" },
    { nome: "Pedro Oliveira", email: "pedro.oliveira@email.pt", telemovel: "911111114", role: "ENCARREGADO" },
    { nome: "Miguel Silva", email: "miguel.silva@email.pt", telemovel: "911111115", role: "ALUNO" },
  ];

  for (const u of users) {
    const existing = await prisma.utilizador.findUnique({ where: { email: u.email } });
    if (!existing) {
      await prisma.utilizador.create({
        data: { ...u, password: hashedPassword, estado: true }
      });
      console.log(`✓ Created user: ${u.email}`);
    }
  }

  const modalidades = ["Ballet Clássico", "Dança Contemporânea", "Hip-Hop", "Jazz", "Dança Urbana"];
  for (const m of modalidades) {
    const existing = await prisma.modalidade.findFirst({ where: { nome: m } });
    if (!existing) {
      await prisma.modalidade.create({ data: { nome: m } });
      console.log(`✓ Created modalidade: ${m}`);
    }
  }

  const salas = [
    { nomesala: "Sala A - Estúdio Principal", capacidade: 20, localizacao: "Piso 1" },
    { nomesala: "Sala B - Sala de Ensayo", capacidade: 15, localizacao: "Piso 1" },
    { nomesala: "Sala C - Espaço Multifuncional", capacidade: 10, localizacao: "Piso 2" },
  ];
  for (const s of salas) {
    const existing = await prisma.sala.findFirst({ where: { nomesala: s.nomesala } });
    if (!existing) {
      await prisma.sala.create({ data: s });
      console.log(`✓ Created sala: ${s.nomesala}`);
    }
  }

  const estadosAula = ["Pendente", "Confirmado", "Rejeitado", "Realizado", "Cancelado"];
  for (const e of estadosAula) {
    const existing = await prisma.estado.findFirst({ where: { tipoestado: e } });
    if (!existing) {
      await prisma.estado.create({ data: { tipoestado: e } });
      console.log(`✓ Created estado: ${e}`);
    }
  }

  const estadosFigurino = ["Disponível", "Reservado", "Em Uso", "Manutenção"];
  for (const e of estadosFigurino) {
    const existing = await prisma.estadofig.findFirst({ where: { tipoestadofig: e } });
    if (!existing) {
      await prisma.estadofig.create({ data: { tipoestadofig: e } });
      console.log(`✓ Created estadofig: ${e}`);
    }
  }

  console.log("✅ Seed completo!");
  process.exit(0);
};

seed().catch(e => {
  console.error("❌ Seed error:", e);
  process.exit(1);
});