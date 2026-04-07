export function authorizeRole(...roles) {
  return async (req, reply) => {
    if (!roles.includes(req.user.role)) {
      return reply.status(403).send({
        error: "Acesso negado"
      });
    }
  };
}