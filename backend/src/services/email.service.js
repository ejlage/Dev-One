import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "entartesteste@gmail.com",
    pass: process.env.SMTP_PASS || "",
  },
});

export async function sendContactEmail({ nome, email, telemovel, modalidade, faixaEtaria, mensagem }) {
  const assunto = `Nova inscrição experimental — ${nome}`;

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#0a1a17">
      <div style="background:#0d6b5e;padding:24px 32px;border-radius:12px 12px 0 0">
        <h2 style="margin:0;color:#fff;font-size:20px">Nova Aula Experimental</h2>
      </div>
      <div style="background:#f4f9f8;padding:32px;border-radius:0 0 12px 12px;border:1px solid #d1e8e4">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#4d7068;font-size:13px;width:140px">Nome</td><td style="padding:8px 0;font-weight:600">${nome}</td></tr>
          <tr><td style="padding:8px 0;color:#4d7068;font-size:13px">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#0d6b5e">${email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#4d7068;font-size:13px">Telemóvel</td><td style="padding:8px 0">${telemovel}</td></tr>
          ${modalidade ? `<tr><td style="padding:8px 0;color:#4d7068;font-size:13px">Modalidade</td><td style="padding:8px 0">${modalidade}</td></tr>` : ''}
          ${faixaEtaria ? `<tr><td style="padding:8px 0;color:#4d7068;font-size:13px">Faixa etária</td><td style="padding:8px 0">${faixaEtaria}</td></tr>` : ''}
          ${mensagem ? `<tr><td style="padding:8px 0;color:#4d7068;font-size:13px;vertical-align:top">Mensagem</td><td style="padding:8px 0">${mensagem.replace(/\n/g, '<br>')}</td></tr>` : ''}
        </table>
      </div>
      <p style="font-size:11px;color:#8aaa9e;margin-top:16px;text-align:center">Ent'Artes — Sistema de Gestão</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Ent'Artes" <${process.env.SMTP_USER || "entartes@atomicmail.io"}>`,
    to: "entartes@atomicmail.io",
    subject: assunto,
    html,
    replyTo: email,
  });
}
