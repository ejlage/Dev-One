import prisma from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createAuditLog } from "./audit.service.js";

/**
 * Registar um novo utilizador
 * @param {string} nome - Nome do utilizador
 * @param {string} email - Email do utilizador
 * @param {string} telemovel - Telemóvel do utilizador
 * @param {string} password - Password do utilizador
 * @param {string} [role="utilizador"] - Role do utilizador
 * @returns {Promise<object>} Utilizador criado
 */
export const register = async (nome, email, telemovel, password, role = "utilizador") => {
  const existingUser = await prisma.utilizador.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new Error("Email já registado");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.utilizador.create({
    data: {
      nome,
      email,
      telemovel,
      password: hashedPassword,
      estado: true,
      role
    }
  });

  return {
    id: user.iduser,
    nome: user.nome,
    email: user.email,
    role: parseRole(user.role)
  };
};

/**
 * Autenticar um utilizador
 * @param {string} email - Email do utilizador
 * @param {string} password - Password do utilizador
 * @returns {Promise<object>} Utilizador e token
 */
export const login = async (email, password) => {
  const user = await prisma.utilizador.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error("Utilizador não encontrado");
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    throw new Error("Password incorreta");
  }

  if (!user.estado) {
    throw new Error("Utilizador inativo");
  }

  // Detetar perfis existentes e construir roles
  const userRoles = [];

  // Consultar tabelas de perfil
  const [direcao, professor, encarregado, aluno] = await Promise.all([
    prisma.direcao.findUnique({ where: { utilizadoriduser: user.iduser } }),
    prisma.professor.findUnique({ where: { utilizadoriduser: user.iduser } }),
    prisma.encarregadoeducacao.findUnique({ where: { utilizadoriduser: user.iduser } }),
    prisma.aluno.findUnique({ where: { utilizadoriduser: user.iduser } })
  ]);

  if (direcao) userRoles.push('DIRECAO');
  if (professor) userRoles.push('PROFESSOR');
  if (encarregado) userRoles.push('ENCARREGADO');
  if (aluno) userRoles.push('ALUNO');

  // Se não tem nenhum perfil, é UTILIZADOR base
  if (userRoles.length === 0) userRoles.push('UTILIZADOR');

   // Se só tem 1 role, manter como string (compatibilidade)
   // Se tem múltiplas, retornar array
   const role = userRoles.length === 1 ? userRoles[0] : [...userRoles];

    // Available roles para o frontend usar no switcher
   const availableRoles = [...userRoles];
  const token = jwt.sign(
    { id: user.iduser, role: role, availableRoles: availableRoles, tokenVersion: user.tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  await createAuditLog(user.iduser, user.nome, 'LOGIN', 'Utilizador', user.iduser, 'Login bem-sucedido');

  return {
    success: true,
    message: "Login com sucesso",
    user: {
      id: user.iduser,
      nome: user.nome,
      email: user.email,
      telemovel: user.telemovel,
      role: role,
      availableRoles: availableRoles || userRoles,
      estado: user.estado,
      alunosIds: []
    },
    token
  };
};

/**
 * Validar token JWT
 * @param {string} token - Token JWT
 * @returns {Promise<object>} Dados do utilizador
 */
export const validateToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.utilizador.findUnique({
      where: { iduser: decoded.id }
    });

    if (!user || !user.estado) {
      throw new Error("Utilizador inválido ou inativo");
    }

    // Verificar revogação de tokens (tokenVersion não corresponde)
    if (decoded.tokenVersion !== undefined && user.tokenVersion !== decoded.tokenVersion) {
      throw new Error("Token revogado");
    }

    // Detetar perfis existentes para availableRoles
    const userRoles = [];
    const [direcao, professor, encarregado, aluno] = await Promise.all([
      prisma.direcao.findUnique({ where: { utilizadoriduser: user.iduser } }),
      prisma.professor.findUnique({ where: { utilizadoriduser: user.iduser } }),
      prisma.encarregadoeducacao.findUnique({ where: { utilizadoriduser: user.iduser } }),
      prisma.aluno.findUnique({ where: { utilizadoriduser: user.iduser } })
    ]);

    if (direcao) userRoles.push('DIRECAO');
    if (professor) userRoles.push('PROFESSOR');
    if (encarregado) userRoles.push('ENCARREGADO');
    if (aluno) userRoles.push('ALUNO');
    if (userRoles.length === 0) userRoles.push('UTILIZADOR');

    const role = userRoles.length === 1 ? userRoles[0] : userRoles;

    return {
      id: user.iduser,
      nome: user.nome,
      email: user.email,
      role: role,
      availableRoles: userRoles
    };
  } catch (error) {
    throw new Error("Token inválido");
  }
};

/**
 * Logout (mock - token é invalidado no frontend)
 * @returns {Promise<object>}
 */
export const logout = async () => {
  return { success: true, message: "Logout realizado com sucesso" };
};

/**
 * Recuperar password (mock - apenas retorna sucesso)
 * @param {string} email - Email do utilizador
 * @returns {Promise<object>}
 */
export const forgotPassword = async (email) => {
  const user = await prisma.utilizador.findUnique({
    where: { email }
  });

  // Sempre retornar sucesso por segurança
  return { 
    success: true, 
    message: "Email de recuperação enviado (se o email existir)" 
  };
};

/**
 * Reset password (mock)
 * @param {string} email - Email do utilizador
 * @param {string} password - Nova password
 * @returns {Promise<object>}
 */
export const resetPassword = async (email, password) => {
  const user = await prisma.utilizador.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error("Utilizador não encontrado");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.utilizador.update({
    where: { email },
    data: { password: hashedPassword }
  });

  return { success: true, message: "Password alterada com sucesso" };
};

/**
 * Obter perfil do utilizador
 * @param {number} userId - ID do utilizador
 * @returns {Promise<object>} Dados do utilizador
 */
const parseRole = (role) => {
  if (!role) return 'UTILIZADOR';
  try {
    const parsed = JSON.parse(role);
    if (Array.isArray(parsed)) return parsed;
  } catch (_) {}
  return role;
};

export const getProfile = async (userId) => {
  const user = await prisma.utilizador.findUnique({
    where: { iduser: userId }
  });

  if (!user) {
    throw new Error("Utilizador não encontrado");
  }

  return {
    id: user.iduser,
    nome: user.nome,
    email: user.email,
    telemovel: user.telemovel,
    role: parseRole(user.role),
    estado: user.estado
  };
};

/**
 * Atualizar perfil do utilizador
 * @param {number} userId - ID do utilizador
 * @param {object} data - Dados a atualizar
 * @returns {Promise<object>} Utilizador atualizado
 */
export const updateProfile = async (userId, data) => {
  const { nome, telemovel, password } = data;

  const updateData = {};
  
  if (nome) updateData.nome = nome;
  if (telemovel) updateData.telemovel = telemovel;
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  const user = await prisma.utilizador.update({
    where: { iduser: userId },
    data: updateData
  });

  return {
    id: user.iduser,
    nome: user.nome,
    email: user.email,
    telemovel: user.telemovel,
    role: parseRole(user.role)
  };
};
