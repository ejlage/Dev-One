import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt'; 

const prisma = new PrismaClient();

async function main() {
  // 1. Setup do Utilizador (O teu código atual)
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash('admin123', saltRounds);

  await prisma.utilizador.upsert({
    where: { email: 'rui@entartes.pt' },
    update: { password: hashedPassword },
    create: {
      nome: 'Rui Admin',
      email: 'rui@entartes.pt',
      telemovel: '912345678',
      password: hashedPassword, 
      role: 'direcao',
      estado: true,
      direcao: { create: {} }
    },
  });
  console.log('Utilizador configurado.');

  // 2. Setup dos Catálogos (Para o T19 funcionar)
  await prisma.cor.upsert({ where: { idcor: 1 }, update: {}, create: { idcor: 1, nomecor: 'Preto' } });
  await prisma.tamanho.upsert({ where: { idtamanho: 1 }, update: {}, create: { idtamanho: 1, nometamanho: 'M' } });
  await prisma.genero.upsert({ where: { idgenero: 1 }, update: {}, create: { idgenero: 1, nomegenero: 'Unissexo' } });
  await prisma.estadouso.upsert({ where: { idestado: 1 }, update: {}, create: { idestado: 1, estadouso: 'Novo' } });
  await prisma.itemfigurino.upsert({ where: { iditem: 1 }, update: {}, create: { iditem: 1, localizacao: 'Armazém A' } });
  
  await prisma.tipofigurino.upsert({ where: { idtipofigurino: 1 }, update: {}, create: { idtipofigurino: 1, tipofigurino: 'Dança' } });

  await prisma.modelofigurino.upsert({
    where: { idmodelo: 1 },
    update: {},
    create: { 
      idmodelo: 1, 
      nomemodelo: 'Modelo Base', 
      descricao: 'Teste', 
      fotografia: 'sem_foto', 
      tipofigurinoidtipofigurino: 1 
    }
  });

  console.log("Catálogos inseridos! Base de dados pronta para a T19.");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());