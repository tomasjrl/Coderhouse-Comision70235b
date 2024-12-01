import { UnauthorizedError, ForbiddenError, ValidationError } from '../utils/customError.js';

// Roles disponibles
export const ROLES = {
    ADMIN: 'admin',
    USER: 'user',
    PREMIUM: 'premium'
};

// Middleware para verificar roles específicos
export const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.session?.user) {
            throw new UnauthorizedError('Please login first');
        }

        const userRole = req.session.user.role;
        if (!roles.includes(userRole)) {
            throw new ForbiddenError(`Access denied. Required roles: ${roles.join(', ')}`);
        }
        next();
    };
};

// Middleware para verificar propiedad del carrito
export const checkCartOwnership = async (req, res, next) => {
    try {
        if (!req.session?.user) {
            throw new UnauthorizedError('Please login first');
        }

        const cartId = req.params.cid;
        if (!cartId) {
            throw new ValidationError('Cart ID is required');
        }

        // Si es admin, denegar acceso a operaciones del carrito
        if (req.session.user.role === ROLES.ADMIN) {
            throw new ForbiddenError('Administrators cannot perform cart operations');
        }

        // Si el usuario no tiene un carrito asignado, permitir crear uno
        if (!req.session.user.cart && req.method === 'POST') {
            return next();
        }

        // Para otras operaciones, verificar que el carrito pertenezca al usuario
        if (req.session.user.cart && req.session.user.cart.toString() !== cartId) {
            throw new ForbiddenError('You can only access your own cart');
        }

        next();
    } catch (error) {
        next(error);
    }
};

// Middleware para verificar permisos de productos
export const checkProductPermissions = (req, res, next) => {
    const user = req.session.user;
    
    if (!user) {
        throw new UnauthorizedError('Please login first');
    }

    // Administradores tienen acceso total
    if (user.role === ROLES.ADMIN) {
        return next();
    }

    // Usuarios premium solo pueden modificar sus propios productos
    if (user.role === ROLES.PREMIUM) {
        const productOwner = req.body.owner || req.query.owner;
        if (productOwner && productOwner === user.email) {
            return next();
        }
    }

    throw new ForbiddenError('You do not have permission to perform this action');
};

// Middleware para verificar permisos de compra
export const checkPurchasePermissions = (req, res, next) => {
    const user = req.session.user;

    if (!user) {
        throw new UnauthorizedError('Please login first');
    }

    if (user.role === ROLES.ADMIN) {
        throw new ForbiddenError('Administrators cannot make purchases');
    }

    next();
};
