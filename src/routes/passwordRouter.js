import { Router } from "express";
import {
  requestPasswordReset,
  resetPassword,
} from "../controllers/passwordController.js";

const passwordRouter = Router();

passwordRouter.post("/reset-request", requestPasswordReset);
passwordRouter.post("/reset/:token", resetPassword);

export default passwordRouter;
