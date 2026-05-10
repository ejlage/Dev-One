import { sendContactEmail } from "../services/email.service.js";

export async function getContactos(req, reply) {
  try {
    const prisma = (await import("../config/db.js")).default;
    const contactos = await prisma.contacto.findMany({
      orderBy: { datacriacao: 'desc' }
    });
    return { success: true, data: contactos };
  } catch (error) {
    console.error('Error getting contactos:', error);
    return reply.status(500).send({ success: false, error: error.message });
  }
}

export async function submitContactForm(req, reply) {
  try {
    const { nome, email, telemovel, mensagem, modalidade, faixaEtaria, tipo } = req.body;

    if (!nome || !email) {
      return reply.status(400).send({ success: false, error: 'Nome e email são obrigatórios' });
    }

    await sendContactEmail({
      nome,
      email,
      telemovel: telemovel || '',
      mensagem: mensagem || '',
      modalidade,
      faixaEtaria,
      tipo: tipo || 'contacto',
    });

    return reply.send({ success: true, message: 'Mensagem enviada com sucesso' });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return reply.status(500).send({ success: false, error: error.message });
  }
}