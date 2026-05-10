import prisma from "../config/db.js";
import bcrypt from "bcrypt";
import { createAuditLog } from "./audit.service.js";

// Returns all users without passwords
/**
 * Obtém todos os utilizadores.
 * 
 * @returns {Promise<any>} {Promise<object[]>}
 */

  const users = await prisma.utilizador.findMany({
    select: {
      iduser: true,
      nome: true,
      email: true,
      telemovel: true,
      estado: true,
      role: true,
      aluno: {
        select: {
          idaluno: true,
          encarregadoiduser: true
        }
      }
    }
  });
  
  const usersWithAlunos = await Promise.all(users.map(async u => {
    let alunosIds = [];
    let alunosNomes = [];
    
    const userRole = parseRoleFromDb(u.role);
    if (typeof userRole === 'string' ? userRole?.toLowerCase() === 'encarregado' : userRole.includes?.('ENCARREGADO')) {
      const alunos = await prisma.aluno.findMany({
        where: { encarregadoiduser: u.iduser },
        select: { utilizadoriduser: true }
      });
      alunosIds = alunos.map(a => a.utilizadoriduser.toString());
      
      const alunosUsers = await prisma.utilizador.findMany({
        where: { iduser: { in: alunos.map(a => a.utilizadoriduser) } },
        select: { nome: true }
      });
      alunosNomes = alunosUsers.map(a => a.nome);
    }
    
    return {
      iduser: u.iduser,
      nome: u.nome,
      email: u.email,
      telemovel: u.telemovel,
      estado: u.estado,
      role: u.role,
      encarregadoId: u.aluno?.[0]?.encarregadoiduser?.toString() || null,
      alunosIds,
      alunosNomes
    };
  }));
  
  const result = await Promise.all(usersWithAlunos.map(async u => {
    let encarregadoNome = null;
    if (u.encarregadoId) {
      const enc = await prisma.utilizador.findUnique({
        where: { iduser: parseInt(u.encarregadoId) },
        select: { nome: true }
      });
      encarregadoNome = enc?.nome;
    }
    return {
      id: u.iduser.toString(),
      nome: u.nome,
      email: u.email,
      telemovel: u.telemovel,
      estado: u.estado,
      role: parseRoleFromDb(u.role),
      encarregadoId: u.encarregadoId,
      encarregadoNome,
      alunosIds: u.alunosIds,
      alunosNomes: u.alunosNomes
    };
  }));
  
  return result;
};

// Returns user by ID without password
/**
 * Obtém utilizador pelo ID.
 * @param {string|number} id
 * @returns {Promise<any>} {Promise<object|null>}
 */

  const user = await prisma.utilizador.findUnique({
    where: { iduser: id },
    select: {
      iduser: true,
      nome: true,
      email: true,
      telemovel: true,
      estado: true,
      role: true
    }
  });
  return user;
};

// Creates user with hashed password
/**
 * Cria utilizador.
 * @param {object} data
 * @returns {Promise<any>} {Promise<object>}
 */

  const { nome, email, telemovel, password, role, modalidades, encarregadoId } = data;

  const roles = Array.isArray(role) ? role : [role];

  if (roles.includes('ALUNO') && !encarregadoId) {
    throw new Error("Encarregado de educação é obrigatório para alunos");
  }

  const existingUser = await prisma.utilizador.findUnique({ where: { email } });
  if (existingUser) throw new Error("Email já registado");

  const hashedPassword = await bcrypt.hash(password, 10);

  const roleStr = roles.length === 1 ? roles[0] : JSON.stringify(roles);

  const user = await prisma.utilizador.create({
    data: {
      nome,
      email,
      telemovel,
      password: hashedPassword,
      estado: true,
      role: roleStr
    },
    select: {
      iduser: true,
      nome: true,
      email: true,
      telemovel: true,
      estado: true,
      role: true
    }
  });

  if (roles.includes('DIRECAO')) {
    await prisma.direcao.upsert({
      where: { utilizadoriduser: user.iduser },
      create: { utilizadoriduser: user.iduser },
      update: { utilizadoriduser: user.iduser }
    });
  }

  if (roles.includes('ENCARREGADO')) {
    await prisma.encarregadoeducacao.upsert({
      where: { utilizadoriduser: user.iduser },
      create: { utilizadoriduser: user.iduser },
      update: { utilizadoriduser: user.iduser }
    });
  }

  if (roles.includes('ALUNO')) {
    const encId = parseInt(encarregadoId);
    if (encId) {
      await prisma.encarregadoeducacao.upsert({
        where: { utilizadoriduser: encId },
        create: { utilizadoriduser: encId },
        update: { utilizadoriduser: encId }
      });
    }
    await prisma.aluno.create({
      data: { utilizadoriduser: user.iduser, encarregadoiduser: encId || null }
    });
  }

  if (roles.includes('PROFESSOR')) {
    await prisma.professor.upsert({
      where: { utilizadoriduser: user.iduser },
      create: { utilizadoriduser: user.iduser },
      update: { utilizadoriduser: user.iduser }
    });

    if (modalidades && modalidades.length > 0) {
      for (const modId of modalidades) {
        try {
          await prisma.modalidadeprofessor.create({
            data: {
              modalidadeidmodalidade: parseInt(modId),
              professorutilizadoriduser: user.iduser
            }
          });
        } catch (_) {
        }
      }
    }
  }

  await createAuditLog(auditUserId ? parseInt(auditUserId) : null, auditUserNome, 'CREATE', 'Utilizador', user.iduser, `Utilizador '${nome}' criado (role: ${roleStr})`);

  return user;
};

/**
 * Atualiza utilizador.
 * @param {string|number} id @param {object} data
 * @returns {Promise<any>} {Promise<object>}
 */

  const { nome, email, telemovel, password, role, estado, encarregadoId, modalidades } = data;

  const existingUser = await prisma.utilizador.findUnique({
    where: { iduser: id }
  });

  if (!existingUser) {
    throw new Error("Utilizador não encontrado");
  }

  if (email && email !== existingUser.email) {
    const emailExists = await prisma.utilizador.findUnique({ where: { email } });
    if (emailExists) throw new Error("Email já está em uso");
  }

  if (encarregadoId !== undefined) {
    const roleNorm = Array.isArray(role) ? role[0] : (typeof role === 'string' ? role : undefined);
    const existingRoleNorm = Array.isArray(existingUser.role) ? existingUser.role[0] : (typeof existingUser.role === 'string' ? existingUser.role : undefined);
    if (roleNorm?.toLowerCase() === 'aluno' || existingRoleNorm?.toLowerCase() === 'aluno') {
      const existsAluno = await prisma.aluno.findFirst({ where: { utilizadoriduser: id } });
      if (encarregadoId) {
        await prisma.encarregadoeducacao.upsert({
          where: { utilizadoriduser: parseInt(encarregadoId) },
          create: { utilizadoriduser: parseInt(encarregadoId) },
          update: { utilizadoriduser: parseInt(encarregadoId) }
        });
        if (existsAluno) {
          await prisma.aluno.update({ where: { idaluno: existsAluno.idaluno }, data: { encarregadoiduser: parseInt(encarregadoId) } });
        } else {
          await prisma.aluno.create({ data: { utilizadoriduser: id, encarregadoiduser: parseInt(encarregadoId) } });
        }
      } else if (existsAluno) {
        await prisma.aluno.update({ where: { idaluno: existsAluno.idaluno }, data: { encarregadoiduser: null } });
      }
    }
  }

  const roleStr = typeof role === 'string' ? role?.toLowerCase() : (Array.isArray(role) ? role[0]?.toLowerCase() : undefined);
  const roleArray = Array.isArray(role) ? role.map(r => r.toLowerCase()) : roleStr ? [roleStr] : [];
  const existingRoleStr = typeof existingUser.role === 'string' ? existingUser.role?.toLowerCase() : (Array.isArray(existingUser.role) ? existingUser.role[0]?.toLowerCase() : undefined);
  const existingRoleArray = Array.isArray(existingUser.role) ? existingUser.role.map(r => r.toLowerCase()) : existingRoleStr ? [existingRoleStr] : [];
  const rolesChanged = roleArray.length !== existingRoleArray.length || roleArray.some(r => !existingRoleArray.includes(r));

  if (rolesChanged && roleArray.includes('professor') && !existingRoleArray.includes('professor')) {
    await prisma.professor.upsert({ where: { utilizadoriduser: id }, create: { utilizadoriduser: id }, update: { utilizadoriduser: id } });
  }
  if (rolesChanged && roleArray.includes('encarregado') && !existingRoleArray.includes('encarregado')) {
    await prisma.encarregadoeducacao.upsert({ where: { utilizadoriduser: id }, create: { utilizadoriduser: id }, update: { utilizadoriduser: id } });
  }
  if (rolesChanged && roleArray.includes('direcao') && !existingRoleArray.includes('direcao')) {
    await prisma.direcao.upsert({ where: { utilizadoriduser: id }, create: { utilizadoriduser: id }, update: { utilizadoriduser: id } });
  }

  const updateData = {};
  if (nome) updateData.nome = nome;
  if (email) updateData.email = email;
  if (telemovel) updateData.telemovel = telemovel;
  if (role) {
    const roleValue = Array.isArray(role) ? JSON.stringify(role) : role;
    updateData.role = roleValue;
  }
  if (password) updateData.password = await bcrypt.hash(password, 10);
  if (estado !== undefined) {
    updateData.estado = estado;
  }
  if (estado === false || rolesChanged) {
    updateData.tokenVersion = { increment: 1 };
  }

  const user = await prisma.utilizador.update({
    where: { iduser: id },
    data: updateData,
    select: { iduser: true, nome: true, email: true, telemovel: true, estado: true, role: true }
  });

  if (roleArray.includes('aluno')) {
    const existsAluno = await prisma.aluno.findFirst({ where: { utilizadoriduser: id } });
    if (existsAluno) user.encarregadoId = existsAluno.encarregadoiduser?.toString() || null;
  }
  if (roleArray.includes('encarregado')) {
    const alunos = await prisma.aluno.findMany({ where: { encarregadoiduser: id }, select: { utilizadoriduser: true } });
    user.alunosIds = alunos.map(a => a.utilizadoriduser.toString());
  }
  if (roleArray.includes('professor') && modalidades !== undefined) {
    await prisma.modalidadeprofessor.deleteMany({ where: { professorutilizadoriduser: id } });
    for (const modId of modalidades) {
      try {
        await prisma.modalidadeprofessor.create({ data: { modalidadeidmodalidade: parseInt(modId), professorutilizadoriduser: id } });
      } catch (_) {}
    }
  }

  if (role && auditUserId) {
    const newRoleStr = typeof role === 'string' ? role : (Array.isArray(role) ? role[0] : existingUser.role);
    try {
      await createAuditLog(parseInt(auditUserId), auditUserNome, 'UPDATE', 'Utilizador', id, `Role alterada para ${newRoleStr}`);
    } catch (_) {}
  }

  return user;
};

const parseRoleFromDb = (roleValue) => {
  if (!roleValue) return 'UTILIZADOR';
  try {
    const parsed = JSON.parse(roleValue);
    if (Array.isArray(parsed)) return parsed;
  } catch (_) {}
  return roleValue;
};

// Soft-deletes user (keeps in DB for audit, just marks as inactive)
/**
 * Elimina utilizador.
 * @param {string|number} id
 * @returns {Promise<any>} {Promise<void>}
 */

  const existingUser = await prisma.utilizador.findUnique({
    where: { iduser: id }
  });

  if (!existingUser) {
    throw new Error("Utilizador não encontrado");
  }

  await prisma.utilizador.update({
    where: { iduser: id },
    data: {
      estado: false,
      tokenVersion: { increment: 1 },
    }
  });

  try {
    await createAuditLog(auditUserId ? parseInt(auditUserId) : null, auditUserNome || 'Direção', 'DELETE', 'Utilizador', id, `Utilizador '${existingUser.nome}' eliminado (soft delete)`);
  } catch (_) {}

  return { message: "Utilizador eliminado com sucesso" };
};

export const getUserModalidades = async (userId) => {
  const modalidades = await prisma.modalidadeprofessor.findMany({
    where: { professorutilizadoriduser: userId },
    select: {
      idmodalidadeprofessor: true,
      modalidadeidmodalidade: true
    }
  });
  return modalidades;
};