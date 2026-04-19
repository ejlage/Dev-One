import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt'; // Importar o bcrypt
const prisma = new PrismaClient();

async function main() {
  // Encriptar a password antes de guardar
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash('admin123', saltRounds);

  const rui = await prisma.utilizador.upsert({
    where: { email: 'rui@entartes.pt' },
    update: { password: hashedPassword }, // Atualiza se já existir
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
  console.log('Seed atualizado: Rui agora tem password encriptada.');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());