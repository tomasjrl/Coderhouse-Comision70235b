import express from 'express';
import passport from 'passport';
import { userRepository } from '../repositories/index.js';
import { ValidationError, AuthenticationError } from '../utils/errorHandler.js';
import { generateToken } from '../utils/jwt.js';

const router = express.Router();

// Registro de usuario
router.post('/register', passport.authenticate('register', { session: false }), async (req, res, next) => {
    try {
        // Si la solicitud espera JSON (API)
        if (req.xhr || req.headers.accept.includes('application/json')) {
            res.status(201).json({ 
                status: 'success', 
                message: 'Usuario registrado exitosamente',
                user: req.user.toSafeObject()
            });
        } else {
            // Si es una solicitud normal del navegador
            res.redirect('/login');
        }
    } catch (error) {
        next(error);
    }
});

// Login de usuario
router.post('/login', (req, res, next) => {
    passport.authenticate('login', { session: false }, async (err, user, info) => {
        try {
            if (err) {
                return next(err);
            }
            
            if (!user) {
                throw new AuthenticationError(info?.message || 'Credenciales inválidas');
            }

            req.login(user, { session: false }, async (error) => {
                if (error) return next(error);

                const token = generateToken(user);
                await userRepository.update(user.id, { last_connection: new Date() });

                // Establecer la cookie JWT
                res.cookie('jwt', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production'
                });

                // Guardar usuario en la sesión
                req.session.user = user.toSafeObject();

                // Si la solicitud espera JSON (API)
                if (req.xhr || req.headers.accept.includes('application/json')) {
                    return res.json({
                        status: 'success',
                        message: 'Login exitoso',
                        token,
                        user: user.toSafeObject()
                    });
                } else {
                    // Si es una solicitud normal del navegador
                    return res.redirect('/');
                }
            });
        } catch (error) {
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return next(error);
            } else {
                return res.redirect('/login?error=' + encodeURIComponent(error.message));
            }
        }
    })(req, res, next);
});

// Logout de usuario
router.post('/logout', async (req, res, next) => {
    try {
        if (req.user) {
            await userRepository.update(req.user.id, { last_connection: new Date() });
        }
        
        req.session.destroy(err => {
            if (err) return next(err);
            res.clearCookie('jwt');
            
            // Si la solicitud espera JSON (API)
            if (req.xhr || req.headers.accept.includes('application/json')) {
                res.json({ status: 'success', message: 'Logout exitoso' });
            } else {
                // Si es una solicitud normal del navegador
                res.redirect('/login');
            }
        });
    } catch (error) {
        next(error);
    }
});

// Obtener usuario actual
router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
    if (req.xhr || req.headers.accept.includes('application/json')) {
        res.json({
            status: 'success',
            user: req.user.toSafeObject()
        });
    } else {
        res.redirect('/profile');
    }
});

export default router;
