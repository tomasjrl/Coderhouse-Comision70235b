import { Router } from "express";
const router = Router(); 
import { createHash, isValidPassword } from "../utils/hashbcryp.js";
import UserModel from "../models/user.model.js";
import passport from "passport";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/passport.config.js';

const isAPI = (req) => req.headers['content-type'] === 'application/json';

//Register con Passport
router.post("/register", (req, res, next) => {
    passport.authenticate("register", (err, user, info) => {
        if (err) {
            if (isAPI(req)) {
                return res.status(500).json({ 
                    status: "error", 
                    error: "Error al registrar el usuario" 
                });
            }
            return res.redirect('/register?error=' + encodeURIComponent("Error al registrar el usuario"));
        }
        if (!user) {
            const errorMessage = info.message || "El usuario ya existe";
            if (isAPI(req)) {
                return res.status(400).json({ 
                    status: "error", 
                    error: errorMessage 
                });
            }
            return res.redirect('/register?error=' + encodeURIComponent(errorMessage));
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            req.session.user = {
                first_name: user.first_name,
                last_name: user.last_name
            };
            req.session.login = true;

            if (isAPI(req)) {
                return res.status(201).json({ 
                    status: "success", 
                    message: "Usuario registrado exitosamente",
                    user: {
                        id: user._id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        role: user.role
                    }
                });
            }
            return res.redirect("/profile");
        });
    })(req, res, next);
});

//Login con Passport
router.post("/login", (req, res, next) => {
    passport.authenticate("login", (err, user, info) => {
        if (err) {
            if (isAPI(req)) {
                return res.status(500).json({ 
                    status: "error", 
                    error: "Error en el servidor" 
                });
            }
            return res.redirect('/login?error=' + encodeURIComponent("Error en el servidor"));
        }
        if (!user) {
            const errorMessage = info.message || "Credenciales inválidas";
            if (isAPI(req)) {
                return res.status(401).json({ 
                    status: "error", 
                    error: errorMessage 
                });
            }
            return res.redirect('/login?error=' + encodeURIComponent(errorMessage));
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            req.session.user = {
                first_name: user.first_name,
                last_name: user.last_name
            };
            req.session.login = true;

            // Generar token JWT
            const token = jwt.sign(
                { 
                    sub: user._id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Establecer la cookie con el token
            res.cookie('coderCookie', token, {
                maxAge: 24 * 60 * 60 * 1000, // 24 horas
                httpOnly: true
            });

            if (isAPI(req)) {
                return res.status(200).json({ 
                    status: "success", 
                    message: "Login exitoso",
                    user: {
                        id: user._id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        role: user.role
                    }
                });
            }
            return res.redirect("/products");
        });
    })(req, res, next);
});

// Ruta /current para obtener el usuario actual
router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
    if (!req.user) {
        return res.status(401).json({ 
            status: "error", 
            error: "No hay usuario autenticado" 
        });
    }

    res.json({ 
        status: "success",
        user: {
            id: req.user._id,
            email: req.user.email,
            first_name: req.user.first_name,
            last_name: req.user.last_name,
            role: req.user.role
        }
    });
});

//Logout
router.get("/logout", (req, res) => {
    if(req.session.login) {
        req.session.destroy(); 
    }
    if (isAPI(req)) {
        return res.status(200).json({ 
            status: "success", 
            message: "Sesión cerrada exitosamente" 
        });
    }
    res.redirect("/login"); 
});

export default router;