export const getProfile = async (req, reply) => {
  return {
    message: "Acesso autorizado",
    user: req.user,
  };
};
