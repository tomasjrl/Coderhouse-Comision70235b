import express from 'express';
import passport from 'passport';
import { userRepository } from '../repositories/index.js';
import { ValidationError, AuthenticationError } from '../utils/errorHandler.js';
import { generateToken } from '../utils/jwt.js';

const router = express.Router();

// Registro de usuario
router.post('/register', passport.authenticate('register', { session: false }), async (req, res, next) => {
    try {
        res.status(201).json({ 
            status: 'success',
            payload: {
                user: req.user.toSafeObject()
            },
            message: 'Usuario registrado exitosamente'
        });
    } catch (error) {
        next(error);
    }
});

// Login de usuario
router.post('/login', (req, res, next) => {
    passport.authenticate('login', { session: false }, async (err, user, info) => {
        try {
            if (err) {
                return res.status(500).json({
                    status: 'error',
                    error: err.message,
                    details: 'Error interno del servidor'
                });
            }
            
            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    error: 'UNAUTHORIZED',
                    message: info?.message || 'Credenciales inválidas',
                    details: {
                        reason: 'Autenticación fallida',
                        action: 'Verifique sus credenciales'
                    }
                });
            }

            req.login(user, { session: false }, async (error) => {
                if (error) {
                    return res.status(500).json({
                        status: 'error',
                        error: error.message,
                        details: 'Error al iniciar sesión'
                    });
                }

                const token = generateToken(user);
                await userRepository.update(user.id, { last_connection: new Date() });

                // Establecer la cookie JWT
                res.cookie('jwt', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production'
                });

                // Guardar usuario en la sesión
                req.session.user = user.toSafeObject();

                return res.json({
                    status: 'success',
                    payload: {
                        user: user.toSafeObject(),
                        token
                    },
                    message: 'Login exitoso'
                });
            });
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                error: error.message,
                details: 'Error inesperado durante el login'
            });
        }
    })(req, res, next);
});

// Logout de usuario
router.post('/logout', async (req, res) => {
    try {
        // Actualizar última conexión si hay usuario
        if (req.user) {
            await userRepository.update(req.user.id, { last_connection: new Date() });
        }
        
        // Limpiar la cookie JWT
        res.clearCookie('jwt');

        // Destruir la sesión si existe
        if (req.session) {
            req.session.destroy();
        }

        return res.json({ 
            status: 'success',
            message: 'Sesión cerrada exitosamente'
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            error: error.message,
            details: 'Error al cerrar sesión'
        });
    }
});

// Obtener usuario actual
router.get('/current', (req, res) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            return res.status(500).json({
                status: 'error',
                error: err.message,
                details: 'Error al verificar autenticación'
            });
        }

        if (!user) {
            return res.status(401).json({
                status: 'error',
                error: 'UNAUTHORIZED',
                message: info?.message || 'No autorizado',
                details: {
                    reason: 'Token no válido o expirado',
                    action: 'Por favor, inicie sesión nuevamente'
                }
            });
        }

        return res.json({
            status: 'success',
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
    })(req, res);
});

export default router;
