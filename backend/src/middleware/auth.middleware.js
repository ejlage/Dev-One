import jwt from "jsonwebtoken";

export const normalizeRole = (role) => {
  if (!role) return null;
  const upperRole = role.toUpperCase();
  return upperRole;
};

export const hasRole = (userRole, ...allowedRoles) => {
  const normalized = normalizeRole(userRole);
  return allowedRoles.some(r => normalizeRole(r) === normalized);
};

export async function verifyToken(req, reply) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return reply.status(401).send({ error: "Token não fornecido" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { ...decoded, role: normalizeRole(decoded.role) };

  } catch (error) {
    return reply.status(401).send({ error: "Token inválido" });
  }
}