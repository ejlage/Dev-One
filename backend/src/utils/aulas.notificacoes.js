// ST56 — notifica encarregado quando professor comunica ausência

export async function notificarAusencia({ email, nome, idaula, data, motivo }) {
  console.log(`[ST56 AUSÊNCIA] Para: ${nome} <${email}> | aula #${idaula} em ${data} | motivo: ${motivo}`);
 
  // Descomenta quando tiveres SMTP configurado:
  // import nodemailer from "nodemailer";
  // const transporter = nodemailer.createTransport({
  //   host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT),
  //   auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  // });
  // await transporter.sendMail({
  //   from: `"ENT'ARTES" <noreply@entartes.pt>`,
  //   to: email,
  //   subject: `Ausência do professor – Aula de ${data}`,
  //   text: `Caro/a ${nome},\n\nO professor comunicou ausência na aula de ${data}.\nMotivo: ${motivo}\n\nENT'ARTES`,
  // });
}
 
// ST63 — notifica encarregado quando aula é remarcada
export async function notificarRemarcacao({ email, nome, idaula, data, horainicio, motivo }) {
  console.log(`[ST63 REMARCAÇÃO] Para: ${nome} <${email}> | aula #${idaula} → ${data} às ${horainicio} | motivo: ${motivo}`);
 
  // await transporter.sendMail({
  //   from: `"ENT'ARTES" <noreply@entartes.pt>`,
  //   to: email,
  //   subject: `Aula remarcada – ${data} às ${horainicio}`,
  //   text: `Caro/a ${nome},\n\nA sua aula foi remarcada para ${data} às ${horainicio}.\nMotivo: ${motivo}\n\nENT'ARTES`,
  // });
}