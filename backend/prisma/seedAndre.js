import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

function dateOnly(value) {
  return new Date(value);
}

function timeOnly(hhmmss) {
  return new Date(`1970-01-01T${hhmmss}`);
}

async function main() {
  console.log("A iniciar seed...");

  // =========================
  // LOOKUPS / TABELAS BASE
  // =========================

  await prisma.estadoaula.createMany({
    data: [
      { nomeestadoaula: "PENDENTE" },
      { nomeestadoaula: "CONFIRMADA" },
      { nomeestadoaula: "REALIZADA" },
      { nomeestadoaula: "REJEITADA" },
    ],
    skipDuplicates: true,
  });

  await prisma.estado.createMany({
    data: [
      { tipoestado: "PENDENTE" },
      { tipoestado: "CONFIRMADA" },
      { tipoestado: "REJEITADA" },
    ],
    skipDuplicates: true,
  });

  await prisma.tiposala.createMany({
    data: [
      { nometiposala: "Estúdio" },
      { nometiposala: "Palco" },
    ],
    skipDuplicates: true,
  });

  await prisma.estadosala.createMany({
    data: [
      { nomeestadosala: "Ativa" },
      { nomeestadosala: "Indisponível" },
    ],
    skipDuplicates: true,
  });

  await prisma.tipoaula.createMany({
    data: [
      { nometipoaula: "Individual" },
      { nometipoaula: "Grupo" },
    ],
    skipDuplicates: true,
  });

  await prisma.modalidade.createMany({
    data: [
      { nome: "Hip-Hop" },
      { nome: "Ballet" },
    ],
    skipDuplicates: true,
  });

  // Grupo
  let grupoTeste = await prisma.grupo.findFirst({
    where: { nomegrupo: "Grupo Teste" },
  });

  if (!grupoTeste) {
    grupoTeste = await prisma.grupo.create({
      data: { nomegrupo: "Grupo Teste" },
    });
  }

  const estadoPedidoPendente = await prisma.estado.findFirst({
    where: { tipoestado: "PENDENTE" },
  });

  const estadoPedidoConfirmada = await prisma.estado.findFirst({
    where: { tipoestado: "CONFIRMADA" },
  });

  const estadoAulaPendente = await prisma.estadoaula.findFirst({
    where: { nomeestadoaula: "PENDENTE" },
  });

  const estadoAulaConfirmada = await prisma.estadoaula.findFirst({
    where: { nomeestadoaula: "CONFIRMADA" },
  });

  const tipoSalaEstudio = await prisma.tiposala.findFirst({
    where: { nometiposala: "Estúdio" },
  });

  const estadoSalaAtiva = await prisma.estadosala.findFirst({
    where: { nomeestadosala: "Ativa" },
  });

  const tipoAulaIndividual = await prisma.tipoaula.findFirst({
    where: { nometipoaula: "Individual" },
  });

  const modalidadeHipHop = await prisma.modalidade.findFirst({
    where: { nome: "Hip-Hop" },
  });

  // =========================
  // SALAS
  // nomesala é Int no teu schema
  // =========================

  let sala1 = await prisma.sala.findFirst({
    where: { nomesala: 1 },
  });

  if (!sala1) {
    sala1 = await prisma.sala.create({
      data: {
        nomesala: 1,
        capacidade: 20,
        estadosalaidestadosala: estadoSalaAtiva.idestadosala,
        tiposalaidtiposala: tipoSalaEstudio.idtiposala,
      },
    });
  }

  let sala2 = await prisma.sala.findFirst({
    where: { nomesala: 2 },
  });

  if (!sala2) {
    sala2 = await prisma.sala.create({
      data: {
        nomesala: 2,
        capacidade: 25,
        estadosalaidestadosala: estadoSalaAtiva.idestadosala,
        tiposalaidtiposala: tipoSalaEstudio.idtiposala,
      },
    });
  }

  // =========================
  // UTILIZADORES
  // =========================

  const passwordHash = await bcrypt.hash("Entartes2026!", 10);

  const direcaoUser = await prisma.utilizador.upsert({
    where: { email: "direcao@entartes.pt" },
    update: {
      nome: "Direção Teste",
      telemovel: "910000001",
      estado: true,
      role: "DIRECAO",
      password: passwordHash,
    },
    create: {
      nome: "Direção Teste",
      email: "direcao@entartes.pt",
      telemovel: "910000001",
      password: passwordHash,
      estado: true,
      role: "DIRECAO",
    },
  });

  const professorUser = await prisma.utilizador.upsert({
    where: { email: "professor@entartes.pt" },
    update: {
      nome: "Professor Teste",
      telemovel: "910000002",
      estado: true,
      role: "PROFESSOR",
      password: passwordHash,
    },
    create: {
      nome: "Professor Teste",
      email: "professor@entartes.pt",
      telemovel: "910000002",
      password: passwordHash,
      estado: true,
      role: "PROFESSOR",
    },
  });

  const encarregadoUser = await prisma.utilizador.upsert({
    where: { email: "encarregado@entartes.pt" },
    update: {
      nome: "Encarregado Teste",
      telemovel: "910000003",
      estado: true,
      role: "ENCARREGADO",
      password: passwordHash,
    },
    create: {
      nome: "Encarregado Teste",
      email: "encarregado@entartes.pt",
      telemovel: "910000003",
      password: passwordHash,
      estado: true,
      role: "ENCARREGADO",
    },
  });

  const alunoUser1 = await prisma.utilizador.upsert({
    where: { email: "aluno1@entartes.pt" },
    update: {
      nome: "Aluno Teste 1",
      telemovel: "910000004",
      estado: true,
      role: "ALUNO",
      password: passwordHash,
    },
    create: {
      nome: "Aluno Teste 1",
      email: "aluno1@entartes.pt",
      telemovel: "910000004",
      password: passwordHash,
      estado: true,
      role: "ALUNO",
    },
  });

  const alunoUser2 = await prisma.utilizador.upsert({
    where: { email: "aluno2@entartes.pt" },
    update: {
      nome: "Aluno Teste 2",
      telemovel: "910000005",
      estado: true,
      role: "ALUNO",
      password: passwordHash,
    },
    create: {
      nome: "Aluno Teste 2",
      email: "aluno2@entartes.pt",
      telemovel: "910000005",
      password: passwordHash,
      estado: true,
      role: "ALUNO",
    },
  });

  // =========================
  // PAPÉIS / TABELAS RELACIONADAS
  // AQUI NÃO USAR upsert com utilizadoriduser
  // =========================

  let direcao = await prisma.direcao.findFirst({
    where: { utilizadoriduser: direcaoUser.iduser },
  });

  if (!direcao) {
    direcao = await prisma.direcao.create({
      data: { utilizadoriduser: direcaoUser.iduser },
    });
  }

  let professor = await prisma.professor.findFirst({
    where: { utilizadoriduser: professorUser.iduser },
  });

  if (!professor) {
    professor = await prisma.professor.create({
      data: { utilizadoriduser: professorUser.iduser },
    });
  }

  let encarregado = await prisma.encarregadoeducacao.findFirst({
    where: { utilizadoriduser: encarregadoUser.iduser },
  });

  if (!encarregado) {
    encarregado = await prisma.encarregadoeducacao.create({
      data: { utilizadoriduser: encarregadoUser.iduser },
    });
  }

  let aluno1 = await prisma.aluno.findFirst({
    where: { utilizadoriduser: alunoUser1.iduser },
  });

  if (!aluno1) {
    aluno1 = await prisma.aluno.create({
      data: { utilizadoriduser: alunoUser1.iduser },
    });
  }

  let aluno2 = await prisma.aluno.findFirst({
    where: { utilizadoriduser: alunoUser2.iduser },
  });

  if (!aluno2) {
    aluno2 = await prisma.aluno.create({
      data: { utilizadoriduser: alunoUser2.iduser },
    });
  }

  // =========================
  // ALUNOS NO GRUPO
  // =========================

  let alunogrupo1 = await prisma.alunogrupo.findFirst({
    where: {
      alunoidaluno: aluno1.idaluno,
      grupoidgrupo: grupoTeste.idgrupo,
    },
  });

  if (!alunogrupo1) {
    alunogrupo1 = await prisma.alunogrupo.create({
      data: {
        alunoidaluno: aluno1.idaluno,
        grupoidgrupo: grupoTeste.idgrupo,
      },
    });
  }

  let alunogrupo2 = await prisma.alunogrupo.findFirst({
    where: {
      alunoidaluno: aluno2.idaluno,
      grupoidgrupo: grupoTeste.idgrupo,
    },
  });

  if (!alunogrupo2) {
    alunogrupo2 = await prisma.alunogrupo.create({
      data: {
        alunoidaluno: aluno2.idaluno,
        grupoidgrupo: grupoTeste.idgrupo,
      },
    });
  }

  // =========================
  // MODALIDADE DO PROFESSOR
  // =========================

  let modalidadeProfessor = await prisma.modalidadeprofessor.findFirst({
    where: {
      modalidadeidmodalidade: modalidadeHipHop.idmodalidade,
      professorutilizadoriduser: professor.utilizadoriduser,
    },
  });

  if (!modalidadeProfessor) {
    modalidadeProfessor = await prisma.modalidadeprofessor.create({
      data: {
        modalidadeidmodalidade: modalidadeHipHop.idmodalidade,
        professorutilizadoriduser: professor.utilizadoriduser,
      },
    });
  }

  // =========================
  // DISPONIBILIDADE DO PROFESSOR
  // Ajusta estes campos se o teu schema tiver nomes diferentes
  // =========================

  let disponibilidade = await prisma.disponibilidade.findFirst({
    where: {
      professorutilizadoriduser: professor.utilizadoriduser,
      modalidadeprofessoridmodalidadeprofessor:
        modalidadeProfessor.idmodalidadeprofessor,
      tipoaulaidtipoaula: tipoAulaIndividual.idtipoaula,
    },
  });

  if (!disponibilidade) {
    disponibilidade = await prisma.disponibilidade.create({
      data: {
        datainicio: dateOnly("2026-04-01"),
        datafim: dateOnly("2026-12-31"),
        duracaominima: timeOnly("00:30:00"),
        duracaomaxima: timeOnly("02:00:00"),
        modalidadeprofessoridmodalidadeprofessor:
          modalidadeProfessor.idmodalidadeprofessor,
        tipoaulaidtipoaula: tipoAulaIndividual.idtipoaula,
        professorutilizadoriduser: professor.utilizadoriduser,
      },
    });
  }

  // =========================
  // PEDIDOS DE AULA
  // =========================

  let pedido1 = await prisma.pedidodeaula.findFirst({
    where: {
      encarregadoeducacaoutilizadoriduser: encarregado.utilizadoriduser,
      grupoidgrupo: grupoTeste.idgrupo,
      data: dateOnly("2026-04-20"),
    },
  });

  if (!pedido1) {
    pedido1 = await prisma.pedidodeaula.create({
      data: {
        data: dateOnly("2026-04-20"),
        horainicio: timeOnly("10:00:00"),
        duracaoaula: timeOnly("01:00:00"),
        maxparticipantes: 2,
        datapedido: dateOnly("2026-04-10"),
        privacidade: false,
        disponibilidadeiddisponibilidade: disponibilidade.iddisponibilidade,
        grupoidgrupo: grupoTeste.idgrupo,
        estadoidestado: estadoPedidoConfirmada.idestado,
        salaidsala: sala1.idsala,
        encarregadoeducacaoutilizadoriduser: encarregado.utilizadoriduser,
      },
    });
  }

  let pedido2 = await prisma.pedidodeaula.findFirst({
    where: {
      encarregadoeducacaoutilizadoriduser: encarregado.utilizadoriduser,
      grupoidgrupo: grupoTeste.idgrupo,
      data: dateOnly("2026-04-21"),
    },
  });

  if (!pedido2) {
    pedido2 = await prisma.pedidodeaula.create({
      data: {
        data: dateOnly("2026-04-21"),
        horainicio: timeOnly("11:00:00"),
        duracaoaula: timeOnly("01:00:00"),
        maxparticipantes: 2,
        datapedido: dateOnly("2026-04-11"),
        privacidade: true,
        disponibilidadeiddisponibilidade: disponibilidade.iddisponibilidade,
        grupoidgrupo: grupoTeste.idgrupo,
        estadoidestado: estadoPedidoPendente.idestado,
        salaidsala: sala2.idsala,
        encarregadoeducacaoutilizadoriduser: encarregado.utilizadoriduser,
      },
    });
  }

  // =========================
  // AULAS
  // =========================

  let aula1 = await prisma.aula.findFirst({
    where: {
      pedidodeaulaidpedidoaula: pedido1.idpedidoaula,
    },
  });

  if (!aula1) {
    aula1 = await prisma.aula.create({
      data: {
        pedidodeaulaidpedidoaula: pedido1.idpedidoaula,
        salaidsala: sala1.idsala,
        estadoaulaidestadoaula: estadoAulaConfirmada.idestadoaula,
      },
    });
  }

  let aula2 = await prisma.aula.findFirst({
    where: {
      pedidodeaulaidpedidoaula: pedido2.idpedidoaula,
    },
  });

  if (!aula2) {
    aula2 = await prisma.aula.create({
      data: {
        pedidodeaulaidpedidoaula: pedido2.idpedidoaula,
        salaidsala: sala2.idsala,
        estadoaulaidestadoaula: estadoAulaPendente.idestadoaula,
      },
    });
  }

  // =========================
  // ALUNOS NA AULA
  // =========================

  let alunoAula1 = await prisma.alunoaula.findFirst({
    where: {
      alunoidaluno: aluno1.idaluno,
      aulaidaula: aula1.idaula,
    },
  });

  if (!alunoAula1) {
    alunoAula1 = await prisma.alunoaula.create({
      data: {
        alunoidaluno: aluno1.idaluno,
        aulaidaula: aula1.idaula,
      },
    });
  }

  let alunoAula2 = await prisma.alunoaula.findFirst({
    where: {
      alunoidaluno: aluno2.idaluno,
      aulaidaula: aula1.idaula,
    },
  });

  if (!alunoAula2) {
    alunoAula2 = await prisma.alunoaula.create({
      data: {
        alunoidaluno: aluno2.idaluno,
        aulaidaula: aula1.idaula,
      },
    });
  }

  console.log("Seed concluído com sucesso.");
  console.log("Credenciais de teste:");
  console.log("Direção: direcao@entartes.pt / Entartes2026!");
  console.log("Professor: professor@entartes.pt / Entartes2026!");
  console.log("Encarregado: encarregado@entartes.pt / Entartes2026!");
  console.log("Aluno1: aluno1@entartes.pt / Entartes2026!");
  console.log("Aluno2: aluno2@entartes.pt / Entartes2026!");
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });