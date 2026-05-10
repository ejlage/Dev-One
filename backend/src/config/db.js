import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
});

prisma.$on('error', (e) => {
  console.error('Prisma Error:', e);
});

export default prisma;