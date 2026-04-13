import jwt from "jsonwebtoken";

export async function verifyToken(req, reply) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return reply.status(401).send({ error: "Token não fornecido" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

  } catch (error) {
    return reply.status(401).send({ error: "Token inválido" });
  }
}                                    

export function autorizar(roles) {   
  return async function (req, reply) {
    await verifyToken(req, reply);

    if (reply.sent) return;

    if (!roles.includes(req.user?.role)) {
      return reply.status(403).send({
        error: `Acesso negado. Role '${req.user?.role}' não tem permissão.`,
      });
    }
  };
}