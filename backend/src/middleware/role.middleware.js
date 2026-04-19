export function authorizeRole(...roles) {
  return async (req, reply) => {
    const userRole = req.user.role?.toUpperCase();
    if (!userRole || !roles.map(r => r.toUpperCase()).includes(userRole)) {
      return reply.status(403).send({
        error: "Acesso negado"
      });
    }
  };
}