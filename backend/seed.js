import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Reference data (skip duplicates)
  await prisma.tiposala.createMany({ data: [{ nometiposala: 'Estúdio' }, { nometiposala: 'Sala de Ballet' }, { nometiposala: 'Sala Polivalente' }], skipDuplicates: true });
  await prisma.estadosala.createMany({ data: [{ nomeestadosala: 'Disponível' }, { nomeestadosala: 'Em Uso' }, { nomeestadosala: 'Manutenção' }], skipDuplicates: true });
  await prisma.estadouso.createMany({ data: [{ estadouso: 'Disponível' }, { estadouso: 'Reservado' }, { estadouso: 'Em Uso' }], skipDuplicates: true });
  await prisma.estadoaula.createMany({ data: [{ nomeestadoaula: 'Pendente' }, { nomeestadoaula: 'Confirmada' }, { nomeestadoaula: 'Cancelada' }, { nomeestadoaula: 'Concluída' }], skipDuplicates: true });
  await prisma.estado.createMany({ data: [{ tipoestado: 'Pendente' }, { tipoestado: 'Confirmado' }, { tipoestado: 'Cancelado' }, { tipoestado: 'Concluído' }], skipDuplicates: true });
  await prisma.tipoaula.createMany({ data: [{ nometipoaula: 'Individual' }, { nometipoaula: 'Privada' }, { nometipoaula: 'Grupo' }], skipDuplicates: true });
  await prisma.tipofigurino.createMany({ data: [{ tipofigurino: 'Vestido' }, { tipofigurino: 'Calças' }, { tipofigurino: 'Saias' }, { tipofigurino: 'Tops' }], skipDuplicates: true });
  await prisma.tamanho.createMany({ data: [{ nometamanho: 'XS' }, { nometamanho: 'S' }, { nometamanho: 'M' }, { nometamanho: 'L' }, { nometamanho: 'XL' }], skipDuplicates: true });
  await prisma.cor.createMany({ data: [{ nomecor: 'Preto' }, { nomecor: 'Branco' }, { nomecor: 'Rosa' }, { nomecor: 'Vermelho' }, { nomecor: 'Azul' }], skipDuplicates: true });
  await prisma.genero.createMany({ data: [{ nomegenero: 'Masculino' }, { nomegenero: 'Feminino' }, { nomegenero: 'Unisex' }], skipDuplicates: true });
  await prisma.modalidade.createMany({ data: [{ nome: 'Ballet' }, { nome: 'Jazz' }, { nome: 'Hip-Hop' }, { nome: 'Contemporâneo' }], skipDuplicates: true });
  await prisma.itemfigurino.createMany({ data: [{ localizacao: 'Armário 1' }, { localizacao: 'Armário 2' }, { localizacao: 'Armário 3' }], skipDuplicates: true });
  console.log('✓ Reference data created');

  const password = await bcrypt.hash('password123', 10);

  // Users with upsert (handle existing)
  const direcao = await prisma.utilizador.upsert({
    where: { email: 'direcao@entartes.pt' },
    update: {},
    create: { nome: 'Direção Ent\'Artes', email: 'direcao@entartes.pt', telemovel: '964693247', password, estado: true, role: 'DIRECAO' }
  });
  await prisma.direcao.upsert({ where: { utilizadoriduser: direcao.iduser }, update: {}, create: { utilizadoriduser: direcao.iduser } });

  const joao = await prisma.utilizador.upsert({
    where: { email: 'joao.santos@entartes.pt' },
    update: {},
    create: { nome: 'Prof. João Santos', email: 'joao.santos@entartes.pt', telemovel: '912345678', password, estado: true, role: 'PROFESSOR' }
  });
  await prisma.professor.upsert({ where: { utilizadoriduser: joao.iduser }, update: {}, create: { utilizadoriduser: joao.iduser } });

  const maria = await prisma.utilizador.upsert({
    where: { email: 'maria.costa@entartes.pt' },
    update: {},
    create: { nome: 'Prof. Maria Costa', email: 'maria.costa@entartes.pt', telemovel: '912345679', password, estado: true, role: 'PROFESSOR' }
  });
  await prisma.professor.upsert({ where: { utilizadoriduser: maria.iduser }, update: {}, create: { utilizadoriduser: maria.iduser } });

  const pedro = await prisma.utilizador.upsert({
    where: { email: 'pedro.oliveira@email.pt' },
    update: {},
    create: { nome: 'Pedro Oliveira', email: 'pedro.oliveira@email.pt', telemovel: '912345680', password, estado: true, role: 'ENCARREGADO' }
  });
  await prisma.encarregadoeducacao.upsert({ where: { utilizadoriduser: pedro.iduser }, update: {}, create: { utilizadoriduser: pedro.iduser } });

  const ana = await prisma.utilizador.upsert({
    where: { email: 'ana.santos@email.pt' },
    update: {},
    create: { nome: 'Ana Santos', email: 'ana.santos@email.pt', telemovel: '912345681', password, estado: true, role: 'ENCARREGADO' }
  });
  await prisma.encarregadoeducacao.upsert({ where: { utilizadoriduser: ana.iduser }, update: {}, create: { utilizadoriduser: ana.iduser } });

  const miguel = await prisma.utilizador.upsert({
    where: { email: 'miguel.oliveira@email.pt' },
    update: {},
    create: { nome: 'Miguel Oliveira', email: 'miguel.oliveira@email.pt', telemovel: '912345682', password, estado: true, role: 'ALUNO' }
  });
  await prisma.aluno.upsert({ where: { idaluno: miguel.iduser }, update: {}, create: { utilizadoriduser: miguel.iduser } });

  const sofia = await prisma.utilizador.upsert({
    where: { email: 'sofia.santos@email.pt' },
    update: {},
    create: { nome: 'Sofia Santos', email: 'sofia.santos@email.pt', telemovel: '912345683', password, estado: true, role: 'ALUNO' }
  });
  await prisma.aluno.upsert({ where: { idaluno: sofia.iduser }, update: {}, create: { utilizadoriduser: sofia.iduser } });

  console.log('✓ Users created');

  const tiposalas = await prisma.tiposala.findMany();
  const estadosalas = await prisma.estadosala.findMany();
  
  // Check if salas exist
  const existingSalas = await prisma.sala.count();
  if (existingSalas === 0) {
    await prisma.sala.create({ data: { nomesala: 1, capacidade: 20, estadosalaidestadosala: estadosalas[0].idestadosala, tiposalaidtiposala: tiposalas[0].idtiposala } });
    await prisma.sala.create({ data: { nomesala: 2, capacidade: 15, estadosalaidestadosala: estadosalas[0].idestadosala, tiposalaidtiposala: tiposalas[0].idtiposala } });
    await prisma.sala.create({ data: { nomesala: 3, capacidade: 10, estadosalaidestadosala: estadosalas[0].idestadosala, tiposalaidtiposala: tiposalas[1].idtiposala } });
    console.log('✓ Salas created');
  } else {
    console.log('✓ Salas already exist');
  }

  // Check if grupos exist
  const existingGrupos = await prisma.grupo.count();
  if (existingGrupos === 0) {
    await prisma.grupo.create({ data: { nomegrupo: 'Ballet Infantil' } });
    await prisma.grupo.create({ data: { nomegrupo: 'Jazz Jovem' } });
    console.log('✓ Grupos created');
  } else {
    console.log('✓ Grupos already exist');
  }

  // Check if modelos exist
  const existingModelos = await prisma.modelofigurino.count();
  if (existingModelos === 0) {
    const tipofigurinos = await prisma.tipofigurino.findMany();
    await prisma.modelofigurino.create({ data: { nomemodelo: 'Vestido Clássico', descricao: 'Vestido de ballet clássico', fotografia: '', tipofigurinoidtipofigurino: tipofigurinos[0].idtipofigurino } });
    await prisma.modelofigurino.create({ data: { nomemodelo: 'Calças Jazz', descricao: 'Calças cómodas para jazz', fotografia: '', tipofigurinoidtipofigurino: tipofigurinos[1].idtipofigurino } });
    console.log('✓ Modelos created');
  } else {
    console.log('✓ Modelos already exist');
  }

  // Check if figurinos exist
  const existingFigurinos = await prisma.figurino.count();
  if (existingFigurinos === 0) {
    const modelos = await prisma.modelofigurino.findMany();
    const generos = await prisma.genero.findMany();
    const tamanhoss = await prisma.tamanho.findMany();
    const cores = await prisma.cor.findMany();
    const estouso = await prisma.estadouso.findMany();

    await prisma.figurino.create({ data: { quantidadedisponivel: 5, quantidadetotal: 10, modelofigurinoidmodelo: modelos[0].idmodelo, generoidgenero: generos[1].idgenero, tamanhoidtamanho: tamanhoss[1].idtamanho, coridcor: cores[0].idcor, estadousoidestado: estouso[0].idestado, direcaoutilizadoriduser: direcao.iduser, encarregadoeducacaoutilizadoriduser: pedro.iduser, professorutilizadoriduser: joao.iduser, itemfigurinoiditem: 1 } });
    await prisma.figurino.create({ data: { quantidadedisponivel: 3, quantidadetotal: 8, modelofigurinoidmodelo: modelos[1].idmodelo, generoidgenero: generos[0].idgenero, tamanhoidtamanho: tamanhoss[2].idtamanho, coridcor: cores[1].idcor, estadousoidestado: estouso[0].idestado, direcaoutilizadoriduser: direcao.iduser, encarregadoeducacaoutilizadoriduser: pedro.iduser, professorutilizadoriduser: joao.iduser, itemfigurinoiditem: 2 } });
    console.log('✓ Figurinos created');
  } else {
    console.log('✓ Figurinos already exist');
  }

  console.log('✅ Seed complete!');
  console.log('\n📋 Test accounts:');
  console.log('   Email: direcao@entartes.pt | Password: password123 | Role: DIRECAO');
  console.log('   Email: joao.santos@entartes.pt | Password: password123 | Role: PROFESSOR');
  console.log('   Email: pedro.oliveira@email.pt | Password: password123 | Role: ENCARREGADO');
  console.log('   Email: miguel.oliveira@email.pt | Password: password123 | Role: ALUNO');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());