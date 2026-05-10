const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const result = await prisma.$queryRaw`SELECT NOW()`;
  console.log(result);
}

test();