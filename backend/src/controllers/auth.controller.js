import * as authService from "../services/auth.service.js";

export const register = async (req, reply) => {
  const { email, password } = req.body;

  const user = await authService.register(email, password);

  reply.send(user);
};

export const login = async (req, reply) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  reply.send(result);
};