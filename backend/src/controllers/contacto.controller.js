let contactos = [];

export const submitContact = async (req, reply) => {
  const { nome, email, telemovel, modalidade, faixaEtaria, mensagem } = req.body;

  if (!nome || !email || !telemovel) {
    return reply.status(400).send({ success: false, error: "Nome, email e telemovel são obrigatórios" });
  }

  const novoContacto = {
    id: contactos.length + 1,
    nome,
    email,
    telemovel,
    modalidade: modalidade || null,
    faixaEtaria: faixaEtaria || null,
    mensagem: mensagem || null,
    createdAt: new Date()
  };

  contactos.push(novoContacto);

  console.log(`[Contacto] Nova inscrição: ${nome} <${email}> tel:${telemovel} — ${modalidade || 'sem modalidade'}`);

  return reply.status(201).send({ success: true, data: novoContacto });
};