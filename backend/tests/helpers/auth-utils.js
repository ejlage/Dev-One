import jwt from 'jsonwebtoken';
import prisma from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'entartes_secret_key_2026_dev';

export function generateToken(user) {
  const userId = user.iduser ?? user.id;
  return jwt.sign(
    { id: userId, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

export async function getTokenForUser(email) {
  const user = await prisma.utilizador.findUnique({ where: { email } });
  if (!user) throw new Error(`Utilizador "${email}" não encontrado`);
  return { token: generateToken(user), user };
}

export { JWT_SECRET };
