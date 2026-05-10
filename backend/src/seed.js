import prisma from "./config/db.js";
import bcrypt from "bcrypt";

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
  const hoje = new Date();
  const hojeStr = hoje.toISOString().split('T')[0];

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
  for (const nome of ["Estúdio", "Sala de Ensaio", "Auditório", "Sala de Ballet", "Sala Multiusos"]) {
    await fc(
      () => prisma.tiposala.findFirst({ where: { nometiposala: nome } }),
      () => prisma.tiposala.create({ data: { nometiposala: nome } }),
      nome
    );
  }

  // ── Estados de aula ───────────────────────────────────────────
  console.log("→ estadoaula");
  for (const nome of ["PENDENTE", "CONFIRMADA", "CANCELADA", "REALIZADA"]) {
    await fc(
      () => prisma.estadoaula.findFirst({ where: { nomeestadoaula: nome } }),
      () => prisma.estadoaula.create({ data: { nomeestadoaula: nome } }),
      nome
    );
  }

  // ── Estados gerais ────────────────────────────────────────────
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
  for (const nome of ["Disponível", "Alugado", "Reservado", "Em Manutenção", "Danificado", "Extraviado"]) {
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
    "Jazz", "Dança Urbana", "Flamenco", "Dança Criativa",
    "Karatê", "Pilates", "Yoga", "Street Dance"
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
    "Dourado", "Prateado", "Verde", "Roxo", "Laranja",
    "Amarelo", "Bege", "Cinzento", "Marinho", "Coral", "Lavanda"
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
  for (const nome of [
    "XS", "S", "M", "L", "XL", "XXL",
    "2", "4", "6", "8", "10", "12", "14", "16", "18",
    "34", "36", "38", "40", "42", "44"
  ]) {
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
    "Sapatilha de Ballet", "Sapatilha de Jazz", "Sapatilha de Dança",
    "Boné", "Luvas", "Meias de Dança", "Manto", "Capa", "Chapéu", "Fita de Ballet"
  ]) {
    await fc(
      () => prisma.tipofigurino.findFirst({ where: { tipofigurino: tipo } }),
      () => prisma.tipofigurino.create({ data: { tipofigurino: tipo } }),
      tipo
    );
  }

  // ── Itens de figurino (armazéns) ──────────────────────────────
  console.log("→ itemfigurino");
  for (const local of ["Armazém Principal", "Armazém Secundário", "Vitrine Principal", "Depósito A", "Depósito B"]) {
    await fc(
      () => prisma.itemfigurino.findFirst({ where: { localizacao: local } }),
      () => prisma.itemfigurino.create({ data: { localizacao: local } }),
      local
    );
  }

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
  const prof3User   = await upsertUser({ nome: "Carlos Ferreira",    email: "carlos.ferreira@entartes.pt",   telemovel: "911111120", role: "PROFESSOR"    });
  const prof4User   = await upsertUser({ nome: "Ana Rodrigues",      email: "ana.rodrigues@entartes.pt",     telemovel: "911111121", role: "PROFESSOR"    });
  const eeUser      = await upsertUser({ nome: "Pedro Oliveira",     email: "pedro.oliveira@email.pt",       telemovel: "911111114", role: "ENCARREGADO"  });
  const ee2User     = await upsertUser({ nome: "Sofia Martins",      email: "sofia.martins@email.pt",        telemovel: "911111115", role: "ENCARREGADO"  });
  const alunoUser   = await upsertUser({ nome: "Miguel Silva",       email: "miguel.silva@email.pt",         telemovel: "911111119", role: "ALUNO"        });
  const aluno2User  = await upsertUser({ nome: "Lara Santos",        email: "lara.santos@email.pt",          telemovel: "911111122", role: "ALUNO"        });

  // ── Tabelas de role ──────────────────────────────────────────
  console.log("→ registos de role");

  await fc(
    () => prisma.direcao.findFirst({ where: { utilizadoriduser: direcaoUser.iduser } }),
    () => prisma.direcao.create({ data: { utilizadoriduser: direcaoUser.iduser } }),
    "direcao"
  );

  for (const profUser of [prof1User, prof2User, prof3User, prof4User]) {
    await fc(
      () => prisma.professor.findFirst({ where: { utilizadoriduser: profUser.iduser } }),
      () => prisma.professor.create({ data: { utilizadoriduser: profUser.iduser } }),
      `professor (${profUser.nome})`
    );
  }

  const eeRecord = await fc(
    () => prisma.encarregadoeducacao.findFirst({ where: { utilizadoriduser: eeUser.iduser } }),
    () => prisma.encarregadoeducacao.create({ data: { utilizadoriduser: eeUser.iduser } }),
    "encarregadoeducacao (Pedro Oliveira)"
  );

  await fc(
    () => prisma.encarregadoeducacao.findFirst({ where: { utilizadoriduser: ee2User.iduser } }),
    () => prisma.encarregadoeducacao.create({ data: { utilizadoriduser: ee2User.iduser } }),
    "encarregadoeducacao (Sofia Martins)"
  );

  for (const aUser of [alunoUser, aluno2User]) {
    await fc(
      () => prisma.aluno.findFirst({ where: { utilizadoriduser: aUser.iduser } }),
      () => prisma.aluno.create({ data: { utilizadoriduser: aUser.iduser, encarregadoiduser: eeRecord.utilizadoriduser } }),
      `aluno (${aUser.nome})`
    );
  }

  // ── Salas ─────────────────────────────────────────────────────
  console.log("→ salas");
  const estSalaDisp   = await prisma.estadosala.findFirst({ where: { nomeestadosala: "Disponível" } });
  const tEstudio      = await prisma.tiposala.findFirst({ where: { nometiposala: "Estúdio" } });
  const tEnsaio       = await prisma.tiposala.findFirst({ where: { nometiposala: "Sala de Ensaio" } });
  const tAuditorio    = await prisma.tiposala.findFirst({ where: { nometiposala: "Auditório" } });
  const tSalaBallet   = await prisma.tiposala.findFirst({ where: { nometiposala: "Sala de Ballet" } });
  const tSalaMultiusos = await prisma.tiposala.findFirst({ where: { nometiposala: "Sala Multiusos" } });

  const salasData = [
    { nomesala: "Estúdio A - Principal",     capacidade: 20, estadosalaidestadosala: estSalaDisp.idestadosala, tiposalaidtiposala: tEstudio.idtiposala },
    { nomesala: "Estúdio B - Ensaio",        capacidade: 15, estadosalaidestadosala: estSalaDisp.idestadosala, tiposalaidtiposala: tEnsaio.idtiposala  },
    { nomesala: "Estúdio C - Multifuncional",capacidade: 10, estadosalaidestadosala: estSalaDisp.idestadosala, tiposalaidtiposala: tEnsaio.idtiposala  },
    { nomesala: "Sala de Ballet",            capacidade: 25, estadosalaidestadosala: estSalaDisp.idestadosala, tiposalaidtiposala: tSalaBallet.idtiposala },
    { nomesala: "Auditório",                 capacidade: 100, estadosalaidestadosala: estSalaDisp.idestadosala, tiposalaidtiposala: tAuditorio.idtiposala },
    { nomesala: "Sala Multiusos",            capacidade: 30, estadosalaidestadosala: estSalaDisp.idestadosala, tiposalaidtiposala: tSalaMultiusos.idtiposala },
    { nomesala: "Estúdio D",                 capacidade: 12, estadosalaidestadosala: estSalaDisp.idestadosala, tiposalaidtiposala: tEstudio.idtiposala },
    { nomesala: "Sala de Treino",            capacidade: 18, estadosalaidestadosala: estSalaDisp.idestadosala, tiposalaidtiposala: tEnsaio.idtiposala  },
  ];

  const salas = {};
  for (const s of salasData) {
    const record = await fc(
      () => prisma.sala.findFirst({ where: { nomesala: s.nomesala } }),
      () => prisma.sala.create({ data: s }),
      s.nomesala
    );
    salas[s.nomesala] = record;
  }

  // ── Modelos de figurino ───────────────────────────────────────
  console.log("→ modelofigurino");
  const tiposFig = {};
  for (const t of await prisma.tipofigurino.findMany()) {
    tiposFig[t.tipofigurino] = t;
  }

  const modelosData = [
    { nomemodelo: "Collant Clássico Rosa",   descricao: "Collant de ballet para iniciantes em tecido de alta qualidade", fotografia: "collant_classico_rosa.jpg", tipofigurinoidtipofigurino: tiposFig["Collant de Ballet"].idtipofigurino },
    { nomemodelo: "Collant Preto Premium",   descricao: "Collant profissional em licra preta",                        fotografia: "collant_preto.jpg",         tipofigurinoidtipofigurino: tiposFig["Collant de Ballet"].idtipofigurino },
    { nomemodelo: "Tutu Romântico Branco",   descricao: "Tutu para espetáculos de ballet clássico",                  fotografia: "tutu_romantico.jpg",        tipofigurinoidtipofigurino: tiposFig["Tutu"].idtipofigurino },
    { nomemodelo: "Leotard Preto",           descricao: "Leotard profissional para jazz e contemporânea",            fotografia: "leotard_preto.jpg",         tipofigurinoidtipofigurino: tiposFig["Leotard"].idtipofigurino },
    { nomemodelo: "Sapatilha Ballet Rosa Clara", descricao: "Sapatilha de Ballet em satin Rosa",                     fotografia: "sapatilha_rosa.jpg", tipofigurinoidtipofigurino: tiposFig["Sapatilha de Ballet"].idtipofigurino },
    { nomemodelo: "Sapatilha Jazz Preto",    descricao: "Sapatilha de jazz profissional",                            fotografia: "sapatilha_jazz.jpg",  tipofigurinoidtipofigurino: tiposFig["Sapatilha de Jazz"].idtipofigurino },
  ];

  const modelos = {};
  for (const m of modelosData) {
    const record = await fc(
      () => prisma.modelofigurino.findFirst({ where: { nomemodelo: m.nomemodelo } }),
      () => prisma.modelofigurino.create({ data: m }),
      m.nomemodelo
    );
    modelos[m.nomemodelo] = record;
  }

  // ── Modalidades por professor ─────────────────────────────────
  console.log("→ modalidadeprofessor");
  const modais = {};
  for (const m of await prisma.modalidade.findMany()) {
    modais[m.nome] = m;
  }

  const mpData = [
    [prof1User.iduser, modais["Ballet Clássico"].idmodalidade,  "João → Ballet Clássico"],
    [prof1User.iduser, modais["Jazz"].idmodalidade,             "João → Jazz"],
    [prof2User.iduser, modais["Dança Contemporânea"].idmodalidade, "Maria → Dança Contemporânea"],
    [prof2User.iduser, modais["Ballet Clássico"].idmodalidade,  "Maria → Ballet Clássico"],
    [prof3User.iduser, modais["Hip-Hop"].idmodalidade,          "Carlos → Hip-Hop"],
    [prof3User.iduser, modais["Dança Urbana"].idmodalidade,     "Carlos → Dança Urbana"],
    [prof4User.iduser, modais["Flamenco"].idmodalidade,         "Ana → Flamenco"],
    [prof4User.iduser, modais["Dança Criativa"].idmodalidade,   "Ana → Dança Criativa"],
  ];

  const modalidadeProfessor = {};
  for (const [profId, modId, label] of mpData) {
    const record = await fc(
      () => prisma.modalidadeprofessor.findFirst({ where: { professorutilizadoriduser: profId, modalidadeidmodalidade: modId } }),
      () => prisma.modalidadeprofessor.create({ data: { professorutilizadoriduser: profId, modalidadeidmodalidade: modId } }),
      label
    );
    const key = `${profId}_${modId}`;
    modalidadeProfessor[key] = record;
  }

  // ── Figurinos (stock) ─────────────────────────────────────────
  console.log("→ figurino");
  const cores = {}; for (const c of await prisma.cor.findMany()) cores[c.nomecor] = c;
  const generos = {}; for (const g of await prisma.genero.findMany()) generos[g.nomegenero] = g;
  const tamanhos = {}; for (const t of await prisma.tamanho.findMany()) tamanhos[t.nometamanho] = t;
  const estUsoDisp = await prisma.estadouso.findFirst({ where: { estadouso: "Disponível" } });
  const itemPrincipal = await prisma.itemfigurino.findFirst({ where: { localizacao: "Armazém Principal" } });
  const itemSecundario = await prisma.itemfigurino.findFirst({ where: { localizacao: "Armazém Secundário" } });
  const itemVitrine = await prisma.itemfigurino.findFirst({ where: { localizacao: "Vitrine Principal" } });

  const figurinoData = [
    { modelo: "Collant Clássico Rosa", genero: "Feminino", tamanho: "M",    cor: "Rosa",   qtd: 5, item: itemPrincipal },
    { modelo: "Collant Preto Premium", genero: "Unissexo", tamanho: "L",    cor: "Preto",  qtd: 8, item: itemPrincipal },
    { modelo: "Tutu Romântico Branco", genero: "Feminino", tamanho: "S",    cor: "Branco", qtd: 3, item: itemPrincipal },
    { modelo: "Leotard Preto",         genero: "Masculino", tamanho: "M",   cor: "Preto",  qtd: 4, item: itemSecundario },
    { modelo: "Sapatilha Ballet Rosa Clara", genero: "Feminino", tamanho: "36", cor: "Rosa", qtd: 6, item: itemVitrine },
    { modelo: "Sapatilha Jazz Preto",  genero: "Masculino", tamanho: "42",  cor: "Preto",  qtd: 5, item: itemVitrine },
  ];

  const figurinos = [];
  for (const f of figurinoData) {
    const mod = modelos[f.modelo];
    const record = await fc(
      () => prisma.figurino.findFirst({ where: { modelofigurinoidmodelo: mod.idmodelo, coridcor: cores[f.cor].idcor } }),
      () => prisma.figurino.create({
        data: {
          quantidadedisponivel: f.qtd,
          quantidadetotal: f.qtd,
          modelofigurinoidmodelo: mod.idmodelo,
          generoidgenero: generos[f.genero].idgenero,
          tamanhoidtamanho: tamanhos[f.tamanho].idtamanho,
          coridcor: cores[f.cor].idcor,
          estadousoidestado: estUsoDisp.idestado,
          direcaoutilizadoriduser: direcaoUser.iduser,
          itemfigurinoiditem: f.item.iditem,
        }
      }),
      `${f.modelo} | ${f.tamanho} | ${f.genero} | ${f.cor}`
    );
    figurinos.push(record);
  }

  // ── Grupos / Turmas ──────────────────────────────────────────
  console.log("→ grupos");
  const grupoData = [
    { nomegrupo: "Ballet Iniciantes",      modalidade: "Ballet Clássico",     nivel: "Iniciante",  faixaEtaria: "6-10 anos",  lotacaoMaxima: 15, horaInicio: "10:00", horaFim: "11:00", diasSemana: "Sábado",  cor: "#FF69B4", status: "ABERTA",  descricao: "Turma de ballet para crianças dos 6 aos 10 anos" },
    { nomegrupo: "Jazz Intermédio",        modalidade: "Jazz",                nivel: "Intermédio", faixaEtaria: "12-18 anos", lotacaoMaxima: 12, horaInicio: "14:00", horaFim: "15:30", diasSemana: "Quarta", cor: "#4169E1", status: "ABERTA",  descricao: "Aula de jazz com coreografia" },
    { nomegrupo: "Dança Contemporânea",    modalidade: "Dança Contemporânea", nivel: "Intermédio", faixaEtaria: "14-18 anos", lotacaoMaxima: 10, horaInicio: "18:00", horaFim: "19:30", diasSemana: "Segunda|Sexta", cor: "#9C27B0", status: "ABERTA", descricao: "Expressão corporal e técnica contemporânea" },
    { nomegrupo: "Hip-Hop Jovem",          modalidade: "Hip-Hop",             nivel: "Iniciante",  faixaEtaria: "12-18 anos", lotacaoMaxima: 20, horaInicio: "19:00", horaFim: "20:30", diasSemana: "Quarta", cor: "#FF5722", status: "ABERTA", descricao: "Estilos urbanos para adolescentes" },
  ];

  for (const g of grupoData) {
    await fc(
      () => prisma.grupo.findFirst({ where: { nomegrupo: g.nomegrupo } }),
      () => prisma.grupo.create({
        data: {
          nomegrupo: g.nomegrupo,
          status: g.status,
          descricao: g.descricao,
          modalidade: g.modalidade,
          nivel: g.nivel,
          faixaEtaria: g.faixaEtaria,
          lotacaoMaxima: g.lotacaoMaxima,
          horaInicio: g.horaInicio,
          horaFim: g.horaFim,
          diasSemana: g.diasSemana,
          cor: g.cor,
        }
      }),
      g.nomegrupo
    );
  }

  // ── Disponibilidades Mensais (futuras, dinâmicas) ─────────────
  console.log("→ disponibilidade_mensal");

  async function criarSlot(profUserId, mpKey, diasASomar, horaInicio, horaFim, salaNome) {
    const data = new Date(hoje);
    data.setDate(data.getDate() + diasASomar);
    const dataStr = data.toISOString().split('T')[0];
    const sala = salas[salaNome];

    const existing = await prisma.disponibilidade_mensal.findFirst({
      where: {
        professorutilizadoriduser: profUserId,
        data: new Date(dataStr),
        horainicio: new Date(`1970-01-01T${horaInicio}:00`),
      }
    });
    if (existing) return existing;

    const record = await prisma.disponibilidade_mensal.create({
      data: {
        professorutilizadoriduser: profUserId,
        modalidadesprofessoridmodalidadeprofessor: mpKey,
        data: new Date(dataStr),
        horainicio: new Date(`1970-01-01T${horaInicio}:00`),
        horafim: new Date(`1970-01-01T${horaFim}:00`),
        ativo: true,
        salaid: sala ? sala.idsala : 1,
        minutos_ocupados: 0,
      }
    });
    console.log(`  ✓ Slot ${dataStr} ${horaInicio}-${horaFim} (prof ${profUserId})`);
    return record;
  }

  const mpJoaoBallet   = modalidadeProfessor[`${prof1User.iduser}_${modais["Ballet Clássico"].idmodalidade}`];
  const mpJoaoJazz     = modalidadeProfessor[`${prof1User.iduser}_${modais["Jazz"].idmodalidade}`];
  const mpMariaContemp = modalidadeProfessor[`${prof2User.iduser}_${modais["Dança Contemporânea"].idmodalidade}`];
  const mpMariaBallet  = modalidadeProfessor[`${prof2User.iduser}_${modais["Ballet Clássico"].idmodalidade}`];
  const mpCarlosHipHop = modalidadeProfessor[`${prof3User.iduser}_${modais["Hip-Hop"].idmodalidade}`];
  const mpAnaFlamenco  = modalidadeProfessor[`${prof4User.iduser}_${modais["Flamenco"].idmodalidade}`];

  // João Santos — 3 slots futuros
  await criarSlot(prof1User.iduser, mpJoaoBallet.idmodalidadeprofessor, 1, "10:00", "11:00", "Estúdio A - Principal");
  await criarSlot(prof1User.iduser, mpJoaoBallet.idmodalidadeprofessor, 3, "14:00", "15:30", "Estúdio A - Principal");
  await criarSlot(prof1User.iduser, mpJoaoJazz.idmodalidadeprofessor,   5, "16:00", "17:00", "Estúdio B - Ensaio");

  // Maria Pereira — 2 slots futuros
  await criarSlot(prof2User.iduser, mpMariaContemp.idmodalidadeprofessor, 2, "10:00", "11:30", "Estúdio C - Multifuncional");
  await criarSlot(prof2User.iduser, mpMariaBallet.idmodalidadeprofessor,  4, "15:00", "16:30", "Sala de Ballet");

  // Carlos Ferreira — 2 slots futuros
  await criarSlot(prof3User.iduser, mpCarlosHipHop.idmodalidadeprofessor, 2, "14:00", "15:00", "Estúdio B - Ensaio");

  // Ana Rodrigues — 1 slot futuro
  await criarSlot(prof4User.iduser, mpAnaFlamenco.idmodalidadeprofessor,  4, "18:00", "19:30", "Estúdio A - Principal");

  // ── Anúncio APROVADO (para BPMN 3 — Aluguer de Figurino) ─────
  console.log("→ anuncio");
  const estadoAprovado = await prisma.estado.findFirst({ where: { tipoestado: "Aprovado" } });
  const figurinoParaAnuncio = figurinos[0]; // Collant Clássico Rosa

  await fc(
    () => prisma.anuncio.findFirst({
      where: { figurinoidfigurino: figurinoParaAnuncio.idfigurino, tipotransacao: "ALUGUER", estadoidestado: estadoAprovado.idestado }
    }),
    () => prisma.anuncio.create({
      data: {
        valor: 150.00,
        dataanuncio: new Date(),
        datainicio: new Date(),
        datafim: new Date(hoje.getTime() + 90 * 86400000),
        quantidade: 1,
        figurinoidfigurino: figurinoParaAnuncio.idfigurino,
        estadoidestado: estadoAprovado.idestado,
        direcaoutilizadoriduser: direcaoUser.iduser,
        tipotransacao: "ALUGUER",
      }
    }),
    "Anúncio APROVADO — Aluguer de Collant Clássico Rosa"
  );

  // ── Eventos ──────────────────────────────────────────────────
  console.log("→ evento");
  const eventoData = [
    { titulo: "Espetáculo de Fim de Ano", descricao: "Apresentação final dos alunos com coreografias de ballet, jazz e dança contemporânea.", dataevento: new Date(hoje.getTime() + 30 * 86400000), localizacao: "Teatro Municipal de Gaia", linkbilhetes: "https://bilhetes.espetaculo.pt", publicado: true, destaque: true },
    { titulo: "Workshop de Ballet Clássico", descricao: "Workshop com maestro de ballet clássico. Aberto a todos os níveis.", dataevento: new Date(hoje.getTime() + 10 * 86400000), localizacao: "Estúdio A", publicado: true, destaque: false },
    { titulo: "Aula Aberta de Dança Contemporânea", descricao: "Aula experimental aberta ao público.", dataevento: new Date(hoje.getTime() + 5 * 86400000), localizacao: "Estúdio C", publicado: false, destaque: false },
  ];

  for (const ev of eventoData) {
    await fc(
      () => prisma.evento.findFirst({ where: { titulo: ev.titulo } }),
      () => prisma.evento.create({
        data: {
          titulo: ev.titulo,
          descricao: ev.descricao,
          dataevento: ev.dataevento,
          localizacao: ev.localizacao,
          linkbilhetes: ev.linkbilhetes || null,
          publicado: ev.publicado,
          destaque: ev.destaque,
          direcaoutilizadoriduser: direcaoUser.iduser,
        }
      }),
      ev.titulo
    );
  }

  console.log("\n✅ Seed concluído!");
  process.exit(0);
};

seed().catch(e => {
  console.error("❌ Erro no seed:", e.message);
  process.exit(1);
});
