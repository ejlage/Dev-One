import * as usersService from "../services/users.service.js";

export const getAllUsers = async (req, reply) => {
  try {
    const users = await usersService.getAllUsers();
    return reply.send({ success: true, data: users });
  } catch (err) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const getUserById = async (req, reply) => {
  try {
    const { id } = req.params;
    const user = await usersService.getUserById(id);

    if (!user) {
      return reply.status(404).send({ success: false, error: "Utilizador não encontrado" });
    }

    return reply.send({ success: true, data: user });
  } catch (err) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const createUser = async (req, reply) => {
  try {
    const user = await usersService.createUser(req.body, req.user.id, req.user.nome);
    return reply.status(201).send({ success: true, data: user });
  } catch (err) {
    return reply.status(400).send({ success: false, error: err.message });
  }
};

export const updateUser = async (req, reply) => {
  try {
    const { id } = req.params;
    const user = await usersService.updateUser(id, req.body, req.user.id, req.user.nome);

    if (!user) {
      return reply.status(404).send({ success: false, error: "Utilizador não encontrado" });
    }

    return reply.send({ success: true, data: user });
  } catch (err) {
    return reply.status(400).send({ success: false, error: err.message });
  }
};

export const deleteUser = async (req, reply) => {
  try {
    const { id } = req.params;
    await usersService.deleteUser(id, req.user.id, req.user.nome);
    return reply.send({ success: true, data: { message: "Utilizador eliminado" } });
  } catch (err) {
    return reply.status(400).send({ success: false, error: err.message });
  }
};

export const getUserModalidades = async (req, reply) => {
  try {
    const { id } = req.params;
    const modalidades = await usersService.getUserModalidades(id);
    return reply.send({ success: true, data: modalidades });
  } catch (err) {
    return reply.status(400).send({ success: false, error: err.message });
  }
};