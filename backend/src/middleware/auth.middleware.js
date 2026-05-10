import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const normalizeRole = (role) => {
  if (!role) return null;
  const upperRole = role.toUpperCase();
  return upperRole;
};

export const hasRole = (userRole, ...allowedRoles) => {
  const normalizeUserRole = (r) => {
    if (!r) return null;
    return r.toUpperCase();
  };

  const userRoles = Array.isArray(userRole) 
    ? userRole.map(normalizeUserRole)
    : [normalizeUserRole(userRole)];

  return allowedRoles.some(allowed => 
    userRoles.includes(normalizeRole(allowed))
  );
};

export async function verifyToken(req, reply) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return reply.status(401).send({ error: "Token não fornecido" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.utilizador.findUnique({
      where: { iduser: decoded.id },
      select: { estado: true, tokenVersion: true, role: true },
    });

    if (!user) {
      return reply.status(401).send({ error: "Utilizador não encontrado" });
    }

    if (user.estado === false) {
      return reply.status(401).send({ error: "Utilizador desativado" });
    }

    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
      return reply.status(401).send({ error: "Token expirado — a sua role ou estado foi alterado" });
    }

    let roleValue = decoded.role;
    // Prisma stores role as text — JSON array strings like '["X","Y"]' are NOT parsed
    if (typeof roleValue === 'string' && roleValue.startsWith('[')) {
      try {
        roleValue = JSON.parse(roleValue);
      } catch (_) {}
    }
    const normalizedRoles = Array.isArray(roleValue) 
      ? roleValue.map(r => r.toUpperCase())
      : [roleValue?.toUpperCase()];

    req.user = { 
      ...decoded, 
      role: decoded.role,
      normalizedRoles,
      availableRoles: decoded.availableRoles || normalizedRoles,
    };

    const activeRoleHeader = req.headers['x-active-role'];
    if (activeRoleHeader && typeof activeRoleHeader === 'string') {
      req.user.role = activeRoleHeader.toUpperCase();
      req.user.normalizedRoles = [activeRoleHeader.toUpperCase()];
    }

  } catch (error) {
    return reply.status(401).send({ error: "Token inválido" });
  }
}