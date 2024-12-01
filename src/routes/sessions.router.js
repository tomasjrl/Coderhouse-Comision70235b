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
        // Actualizar última conexión si hay usuario
        if (req.user) {
            await userRepository.update(req.user.id, { last_connection: new Date() });
        }
        
        // Limpiar la cookie JWT con las mismas opciones con las que fue creada
        res.clearCookie('jwt', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        // Destruir la sesión si existe
        if (req.session) {
            req.session.destroy(err => {
                if (err) {
                    console.error('Error al destruir la sesión:', err);
                }
            });
        }

        // Si la solicitud espera JSON (API)
        if (req.xhr || req.headers.accept.includes('application/json')) {
            res.json({ 
                status: 'success', 
                message: 'Logout exitoso',
                redirectUrl: '/login'
            });
        } else {
            // Si es una solicitud normal del navegador
            res.redirect('/login');
        }
    } catch (error) {
        if (req.xhr || req.headers.accept.includes('application/json')) {
            res.status(500).json({ 
                status: 'error', 
                message: 'Error al cerrar sesión'
            });
        } else {
            next(error);
        }
    }
});

// Obtener usuario actual
router.get('/current', (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            return next(new Error('Error en la autenticación: ' + err.message));
        }

        // Si no hay usuario (token inválido o expirado)
        if (!user) {
            return res.status(401).json({
                status: 'error',
                code: 'UNAUTHORIZED',
                message: info?.message || 'No autorizado. Token no válido o expirado',
                details: {
                    reason: info?.message || 'Token no proporcionado o inválido',
                    action: 'Por favor, inicie sesión nuevamente'
                }
            });
        }

        // Si la petición espera JSON
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.json({
                status: 'success',
                message: 'Usuario autenticado correctamente',
                payload: {
                    user: {
                        id: user.id,
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        role: user.role,
                        cart: user.cart
                    }
                }
            });
        } 
        
        // Si es una petición web normal
        return res.redirect('/profile');
    })(req, res, next);
});

export default router;
