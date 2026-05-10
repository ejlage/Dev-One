import prisma from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
  // Verificar se utilizador já existe
  const existingUser = await prisma.utilizador.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new Error("Email já registado");
  }

  // Hash da password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Criar utilizador
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
    role: user.role
  };
};

/**
 * Autenticar um utilizador
 * @param {string} email - Email do utilizador
 * @param {string} password - Password do utilizador
 * @returns {Promise<object>} Utilizador e token
 */
export const login = async (email, password) => {
  // Procurar utilizador
  const user = await prisma.utilizador.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error("Utilizador não encontrado");
  }

  // Verificar password
  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    throw new Error("Password incorreta");
  }

  // Verificar se utilizador está ativo
  if (!user.estado) {
    throw new Error("Utilizador inativo");
  }

  // Gerar token
  const token = jwt.sign(
    { id: user.iduser, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    user: {
      id: user.iduser,
      nome: user.nome,
      email: user.email,
      telemovel: user.telemovel,
      role: user.role,
      estado: user.estado
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

    return {
      id: user.iduser,
      nome: user.nome,
      email: user.email,
      role: user.role
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

  // Hash da nova password
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
    role: user.role,
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
    role: user.role
  };
};
