import prisma from "./config/db.js";
import bcrypt from "bcrypt";

// Find or create: returns the existing record or creates and returns a new one
async function fc(findFn, createFn, label) {
  const existing = await findFn();
  if (existing) return existing;
  const created = await createFn();
  if (label) console.log(`  ✓ ${label}`);
  return created;
}

const seed = async () => {
  console.log("🌱 A inicializar base de dados...\n");
  const hash = await bcrypt.hash("password123", 10);

  // ── Estado de salas ───────────────────────────────────────────
  console.log("→ estadosala");
  for (const nome of ["Disponível", "Ocupada", "Em Manutenção"]) {
    await fc(
      () => prisma.estadosala.findFirst({ where: { nomeestadosala: nome } }),
      () => prisma.estadosala.create({ data: { nomeestadosala: nome } }),
      nome
    );
  }

  // ── Tipos de sala ─────────────────────────────────────────────
  console.log("→ tiposala");
  for (const nome of ["Estúdio", "Sala de Ensaio", "Auditório"]) {
    await fc(
      () => prisma.tiposala.findFirst({ where: { nometiposala: nome } }),
      () => prisma.tiposala.create({ data: { nometiposala: nome } }),
      nome
    );
  }

  // ── Estados de aula (uppercase — correspondência exata em aulas.service.js) ──
  console.log("→ estadoaula");
  for (const nome of ["PENDENTE", "CONFIRMADA", "CANCELADA", "REALIZADA"]) {
    await fc(
      () => prisma.estadoaula.findFirst({ where: { nomeestadoaula: nome } }),
      () => prisma.estadoaula.create({ data: { nomeestadoaula: nome } }),
      nome
    );
  }

  // ── Estados gerais (pedidos, anúncios, transações)
  // Nota: serviços usam comparação case-insensitive (LOWER ou mode:'insensitive')
  // "Confirmado" satisfaz LOWER='confirmado' (direcao.service.js)
  // "Aprovado"/"Rejeitado"/"Pendente" satisfazem equals case-insensitive (anuncios/aluguerFigurino)
  console.log("→ estado");
  for (const tipo of ["Pendente", "Confirmado", "Rejeitado", "Aprovado", "Cancelado", "Concluído"]) {
    await fc(
      () => prisma.estado.findFirst({ where: { tipoestado: tipo } }),
      () => prisma.estado.create({ data: { tipoestado: tipo } }),
      tipo
    );
  }

  // ── Estados de uso de figurino ────────────────────────────────
  console.log("→ estadouso");
  for (const nome of ["Disponível", "Alugado", "Reservado", "Em Manutenção"]) {
    await fc(
      () => prisma.estadouso.findFirst({ where: { estadouso: nome } }),
      () => prisma.estadouso.create({ data: { estadouso: nome } }),
      nome
    );
  }

  // ── Modalidades ───────────────────────────────────────────────
  console.log("→ modalidade");
  for (const nome of [
    "Ballet Clássico", "Dança Contemporânea", "Hip-Hop",
    "Jazz", "Dança Urbana", "Flamenco", "Dança Criativa"
  ]) {
    await fc(
      () => prisma.modalidade.findFirst({ where: { nome } }),
      () => prisma.modalidade.create({ data: { nome } }),
      nome
    );
  }

  // ── Cores ─────────────────────────────────────────────────────
  console.log("→ cor");
  for (const nome of [
    "Preto", "Branco", "Azul", "Vermelho", "Rosa",
    "Dourado", "Prateado", "Verde", "Roxo", "Laranja", "Amarelo", "Bege"
  ]) {
    await fc(
      () => prisma.cor.findFirst({ where: { nomecor: nome } }),
      () => prisma.cor.create({ data: { nomecor: nome } }),
      nome
    );
  }

  // ── Géneros ───────────────────────────────────────────────────
  console.log("→ genero");
  for (const nome of [
    "Feminino", "Masculino", "Unissexo",
    "Infantil Feminino", "Infantil Masculino", "Unissexo Infantil"
  ]) {
    await fc(
      () => prisma.genero.findFirst({ where: { nomegenero: nome } }),
      () => prisma.genero.create({ data: { nomegenero: nome } }),
      nome
    );
  }

  // ── Tamanhos ──────────────────────────────────────────────────
  console.log("→ tamanho");
  for (const nome of ["XS", "S", "M", "L", "XL", "XXL", "2", "4", "6", "8", "10", "12", "14", "16"]) {
    await fc(
      () => prisma.tamanho.findFirst({ where: { nometamanho: nome } }),
      () => prisma.tamanho.create({ data: { nometamanho: nome } }),
      nome
    );
  }

  // ── Tipos de figurino ─────────────────────────────────────────
  console.log("→ tipofigurino");
  for (const tipo of [
    "Collant de Ballet", "Saia de Ballet", "Tutu", "Leotard", "Calções de Dança",
    "Top de Dança", "Macacão", "Vestido de Espetáculo", "Camisa de Dança", "Calças de Dança",
    "Sapatilha de Ballet", "Sapatilha de Jazz", "Boné", "Luvas", "Meias de Dança"
  ]) {
    await fc(
      () => prisma.tipofigurino.findFirst({ where: { tipofigurino: tipo } }),
      () => prisma.tipofigurino.create({ data: { tipofigurino: tipo } }),
      tipo
    );
  }

  // ── Item de figurino (referência de armazém) ──────────────────
  console.log("→ itemfigurino");
  await fc(
    () => prisma.itemfigurino.findFirst({ where: { localizacao: "Armazém Principal" } }),
    () => prisma.itemfigurino.create({ data: { localizacao: "Armazém Principal" } }),
    "Armazém Principal"
  );

  // ── Utilizadores ──────────────────────────────────────────────
  console.log("→ utilizadores");

  const upsertUser = async ({ nome, email, telemovel, role }) => {
    const existing = await prisma.utilizador.findUnique({ where: { email } });
    if (existing) return existing;
    const created = await prisma.utilizador.create({
      data: { nome, email, telemovel, role, password: hash, estado: true }
    });
    console.log(`  ✓ ${email} (${role})`);
    return created;
  };

  const direcaoUser = await upsertUser({ nome: "Direção Ent'Artes",  email: "direcao@entartes.pt",           telemovel: "911111111", role: "DIRECAO"      });
  const prof1User   = await upsertUser({ nome: "João Santos",        email: "joao.santos@entartes.pt",       telemovel: "911111112", role: "PROFESSOR"    });
  const prof2User   = await upsertUser({ nome: "Maria Pereira",      email: "maria.pereira@entartes.pt",     telemovel: "911111113", role: "PROFESSOR"    });
  const eeUser      = await upsertUser({ nome: "Pedro Oliveira",     email: "pedro.oliveira@email.pt",       telemovel: "911111114", role: "ENCARREGADO"  });
  const alunoUser   = await upsertUser({ nome: "Miguel Silva",       email: "miguel.silva@email.pt",         telemovel: "911111115", role: "ALUNO"        });

  // ── Tabelas de role (obrigatórias para funcionamento do backend) ──
  console.log("→ registos de role");

  await fc(
    () => prisma.direcao.findFirst({ where: { utilizadoriduser: direcaoUser.iduser } }),
    () => prisma.direcao.create({ data: { utilizadoriduser: direcaoUser.iduser } }),
    "direcao"
  );

  await fc(
    () => prisma.professor.findFirst({ where: { utilizadoriduser: prof1User.iduser } }),
    () => prisma.professor.create({ data: { utilizadoriduser: prof1User.iduser } }),
    "professor (João Santos)"
  );

  await fc(
    () => prisma.professor.findFirst({ where: { utilizadoriduser: prof2User.iduser } }),
    () => prisma.professor.create({ data: { utilizadoriduser: prof2User.iduser } }),
    "professor (Maria Pereira)"
  );

  const eeRecord = await fc(
    () => prisma.encarregadoeducacao.findFirst({ where: { utilizadoriduser: eeUser.iduser } }),
    () => prisma.encarregadoeducacao.create({ data: { utilizadoriduser: eeUser.iduser } }),
    "encarregadoeducacao (Pedro Oliveira)"
  );

  await fc(
    () => prisma.aluno.findFirst({ where: { utilizadoriduser: alunoUser.iduser } }),
    () => prisma.aluno.create({ data: { utilizadoriduser: alunoUser.iduser, encarregadoiduser: eeRecord.utilizadoriduser } }),
    "aluno (Miguel Silva) → encarregado Pedro"
  );

  // ── Salas ─────────────────────────────────────────────────────
  console.log("→ salas");
  const estSalaDisp = await prisma.estadosala.findFirst({ where: { nomeestadosala: "Disponível" } });
  const tEstudio    = await prisma.tiposala.findFirst({ where: { nometiposala: "Estúdio" } });
  const tEnsaio     = await prisma.tiposala.findFirst({ where: { nometiposala: "Sala de Ensaio" } });

  for (const s of [
    { nomesala: "Estúdio A - Principal",     capacidade: 20, estadosalaidestadosala: estSalaDisp.idestadosala, tiposalaidtiposala: tEstudio.idtiposala },
    { nomesala: "Estúdio B - Ensaio",        capacidade: 15, estadosalaidestadosala: estSalaDisp.idestadosala, tiposalaidtiposala: tEnsaio.idtiposala  },
    { nomesala: "Estúdio C - Multifuncional",capacidade: 10, estadosalaidestadosala: estSalaDisp.idestadosala, tiposalaidtiposala: tEnsaio.idtiposala  },
  ]) {
    await fc(
      () => prisma.sala.findFirst({ where: { nomesala: s.nomesala } }),
      () => prisma.sala.create({ data: s }),
      s.nomesala
    );
  }

  // ── Modelos de figurino ───────────────────────────────────────
  console.log("→ modelofigurino");
  const tipoCollant = await prisma.tipofigurino.findFirst({ where: { tipofigurino: "Collant de Ballet" } });
  const tipoTutu    = await prisma.tipofigurino.findFirst({ where: { tipofigurino: "Tutu" } });

  for (const m of [
    { nomemodelo: "Collant Clássico Rosa", descricao: "Collant de ballet para iniciantes", fotografia: "collant_classico.jpg", tipofigurinoidtipofigurino: tipoCollant.idtipofigurino },
    { nomemodelo: "Tutu Romântico Branco", descricao: "Tutu para espetáculos de ballet",  fotografia: "tutu_romantico.jpg",   tipofigurinoidtipofigurino: tipoTutu.idtipofigurino    },
  ]) {
    await fc(
      () => prisma.modelofigurino.findFirst({ where: { nomemodelo: m.nomemodelo } }),
      () => prisma.modelofigurino.create({ data: m }),
      m.nomemodelo
    );
  }

  // ── Modalidades por professor ─────────────────────────────────
  console.log("→ modalidadeprofessor");
  const modBallet  = await prisma.modalidade.findFirst({ where: { nome: "Ballet Clássico"     } });
  const modJazz    = await prisma.modalidade.findFirst({ where: { nome: "Jazz"                } });
  const modContemp = await prisma.modalidade.findFirst({ where: { nome: "Dança Contemporânea" } });

  for (const [profId, modId, label] of [
    [prof1User.iduser, modBallet.idmodalidade,  "João → Ballet Clássico"     ],
    [prof1User.iduser, modJazz.idmodalidade,    "João → Jazz"                ],
    [prof2User.iduser, modContemp.idmodalidade, "Maria → Dança Contemporânea"],
    [prof2User.iduser, modBallet.idmodalidade,  "Maria → Ballet Clássico"    ],
  ]) {
    await fc(
      () => prisma.modalidadeprofessor.findFirst({ where: { professorutilizadoriduser: profId, modalidadeidmodalidade: modId } }),
      () => prisma.modalidadeprofessor.create({ data: { professorutilizadoriduser: profId, modalidadeidmodalidade: modId } }),
      label
    );
  }

  // ── Grupos ────────────────────────────────────────────────────
  console.log("→ grupos");
  for (const g of [
    { nomegrupo: "Ballet Iniciantes", modalidade: "Ballet Clássico", nivel: "Iniciante",  faixaEtaria: "6-12 anos",  lotacaoMaxima: 15, horaInicio: "10:00", horaFim: "11:00", diasSemana: "Sábado", cor: "#FF69B4" },
    { nomegrupo: "Jazz Intermédio",   modalidade: "Jazz",            nivel: "Intermédio", faixaEtaria: "12-18 anos", lotacaoMaxima: 12, horaInicio: "14:00", horaFim: "15:30", diasSemana: "Quarta", cor: "#4169E1" },
  ]) {
    await fc(
      () => prisma.grupo.findFirst({ where: { nomegrupo: g.nomegrupo } }),
      () => prisma.grupo.create({ data: g }),
      g.nomegrupo
    );
  }

  // ── Figurino de exemplo (necessário para o Marketplace funcionar) ──
  console.log("→ figurino");
  const corRosa    = await prisma.cor.findFirst({ where: { nomecor: "Rosa"        } });
  const genFem     = await prisma.genero.findFirst({ where: { nomegenero: "Feminino" } });
  const tamM       = await prisma.tamanho.findFirst({ where: { nometamanho: "M"      } });
  const modCollant = await prisma.modelofigurino.findFirst({ where: { nomemodelo: "Collant Clássico Rosa" } });
  const estUsoDisp = await prisma.estadouso.findFirst({ where: { estadouso: "Disponível" } });

  await fc(
    () => prisma.figurino.findFirst({ where: { modelofigurinoidmodelo: modCollant.idmodelo, coridcor: corRosa.idcor } }),
    () => prisma.figurino.create({
      data: {
        quantidadedisponivel: 5,
        quantidadetotal: 5,
        modelofigurinoidmodelo: modCollant.idmodelo,
        generoidgenero:         genFem.idgenero,
        tamanhoidtamanho:       tamM.idtamanho,
        coridcor:               corRosa.idcor,
        estadousoidestado:      estUsoDisp.idestado,
        direcaoutilizadoriduser: direcaoUser.iduser,
      }
    }),
    "Collant Clássico Rosa | M | Feminino | Rosa"
  );

  console.log("\n✅ Seed concluído!");
  process.exit(0);
};

seed().catch(e => {
  console.error("❌ Erro no seed:", e.message);
  process.exit(1);
});
