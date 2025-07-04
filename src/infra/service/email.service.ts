import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function enviarEmailAssuntoSimples(numero: string, mensagem: string, estado: string) {
try {
    await transporter.sendMail({
      from: `"Bot SMJ" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      subject: "Novo atendimento encaminhado para análise",
      text: `Um novo usuário finalizou o atendimento.\n\nTelefone: ${numero}\nMensagem: ${mensagem}`,
    });

    console.log("✅ E-mail enviado com sucesso.");
  } catch (err) {
    console.error("❌ Erro ao enviar e-mail:", err);
  }
}
