let contactos = [];

export const submitContact = async (req, reply) => {
  const { nome, email, mensagem } = req.body;

  if (!nome || !email || !mensagem) {
    return reply.status(400).send({ success: false, error: "Nome, email e mensagem são obrigatórios" });
  }

  const novoContacto = {
    id: contactos.length + 1,
    nome,
    email,
    mensagem,
    createdAt: new Date()
  };

  contactos.push(novoContacto);

  return reply.status(201).send({ success: true, data: novoContacto });
};