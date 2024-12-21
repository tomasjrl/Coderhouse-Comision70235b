import nodemailer from "nodemailer";
import { config } from "../config/config.js";

const transporter = nodemailer.createTransport({
  service: config.email.service,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

export const sendResetPasswordEmail = async (email, resetToken) => {
  const resetUrl = `http://localhost:${config.server.port}/reset-password/${resetToken}`;

  const mailOptions = {
    from: config.email.user,
    to: email,
    subject: "Restablecer Contraseña",
    html: `
            <h1>Solicitud de restablecimiento de contraseña</h1>
            <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente botón para continuar:</p>
            <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px;">
                Restablecer Contraseña
            </a>
            <p>Este enlace expirará en 1 hora.</p>
            <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.</p>
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error("Error al enviar el correo de restablecimiento");
  }
};
