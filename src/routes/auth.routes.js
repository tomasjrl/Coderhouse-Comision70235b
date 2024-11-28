import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/passport.config.js';

const router = Router();

// Register route
router.post('/register', 
    passport.authenticate('register', { session: false }),
    async (req, res) => {
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: req.user._id,
                email: req.user.email,
                first_name: req.user.first_name,
                last_name: req.user.last_name,
                role: req.user.role
            }
        });
    }
);

// Login route
router.post('/login',
    passport.authenticate('login', { session: false }),
    (req, res) => {
        const token = jwt.sign(
            { sub: req.user._id, email: req.user.email, role: req.user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: req.user._id,
                email: req.user.email,
                first_name: req.user.first_name,
                last_name: req.user.last_name,
                role: req.user.role
            }
        });
    }
);

// JWT authentication middleware
export const authenticateJWT = passport.authenticate('jwt', { session: false });

// Protected route example
router.get('/current', authenticateJWT, (req, res) => {
    res.json({
        user: {
            id: req.user._id,
            email: req.user.email,
            first_name: req.user.first_name,
            last_name: req.user.last_name,
            role: req.user.role
        }
    });
});

export default router;
