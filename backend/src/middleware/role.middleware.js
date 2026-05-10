export function authorizeRole(...roles) {
  const allowed = roles.map(r => r.toUpperCase());
  return async (req, reply) => {
    // Use availableRoles if present, otherwise fall back to single role
    const allRoles = req.user.availableRoles || [req.user.role];
    const normalized = allRoles.map(r => (r || '').toUpperCase());
    const hasPermission = normalized.some(r => allowed.includes(r));
    if (!hasPermission) {
      return reply.status(403).send({
        error: "Acesso negado"
      });
    }
  };
}