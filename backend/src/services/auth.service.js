import prisma from "../config/db.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt.js";

export const register = async (email, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.utilizador.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  return user;
};

export const login = async (email, password) => {
  const user = await prisma.utilizador.findUnique({
    where: { email },
  });

  if (!user) throw new Error("Utilizador não encontrado");

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) throw new Error("Password inválida");

  const token = generateToken(user);

  return {
  user: {
    id: user.id,
    email: user.email
  },
  token
};

};