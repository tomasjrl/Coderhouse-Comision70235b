import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import { sendResetPasswordEmail } from "../services/emailService.js";
import { config } from "../config/config.js";

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "Usuario no encontrado" });
    }

    const resetToken = jwt.sign({ userId: user._id }, config.jwt.secret, {
      expiresIn: config.jwt.resetPasswordExpiry,
    });

    await sendResetPasswordEmail(email, resetToken);

    res.json({
      status: "success",
      message: "Correo de restablecimiento enviado",
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "Usuario no encontrado" });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        status: "error",
        message: "La nueva contraseña no puede ser igual a la actual",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({
      status: "success",
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "error",
        message: "El enlace ha expirado",
        expired: true,
      });
    }
    res.status(500).json({ status: "error", message: error.message });
  }
};
