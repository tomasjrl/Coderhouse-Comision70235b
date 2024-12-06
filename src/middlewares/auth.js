import { AuthenticationError, AuthorizationError } from '../utils/errorHandler.js';

export const ROLES = {
    ADMIN: 'admin',
    USER: 'user'
};

// Middleware de autenticación unificado
export const checkAuth = (shouldBeAuthenticated = true) => (req, res, next) => {
    const isUserAuthenticated = !!req.session?.user;
    
    if (shouldBeAuthenticated && !isUserAuthenticated) {
        if (req.headers.accept?.includes('application/json')) {
            return res.status(401).json({ 
                status: 'error',
                message: 'Por favor, inicia sesión primero'
            });
        }
        return res.redirect('/login');
    }
    
    if (!shouldBeAuthenticated && isUserAuthenticated) {
        return res.redirect('/');
    }
    
    next();
};

// Exportar funciones auxiliares para mantener la compatibilidad
export const isAuthenticated = checkAuth(true);
export const isNotAuthenticated = checkAuth(false);

// Middleware de autorización basada en roles
export const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.session?.user) {
            throw new AuthenticationError('Por favor, inicia sesión primero');
        }

        const userRole = req.session.user.role;
        if (!roles.includes(userRole)) {
            throw new AuthorizationError(`Acceso denegado. Roles requeridos: ${roles.join(', ')}`);
        }
        next();
    };
};

// Middleware para verificar rol de administrador
export const isAdmin = (req, res, next) => {
    if (req.session?.user?.role === ROLES.ADMIN) {
        return next();
    }
    if (req.headers.accept?.includes('application/json')) {
        return res.status(403).json({ 
            status: 'error',
            message: 'Acceso denegado. Se requieren permisos de administrador'
        });
    }
    return res.status(403).render('error', {
        error: 'Acceso denegado. Se requieren permisos de administrador',
        user: req.session.user,
        title: 'Error - Acceso Denegado'
    });
};

// Middleware para verificar rol de usuario
export const isUser = (req, res, next) => {
    if (req.session?.user?.role === ROLES.USER) {
        return next();
    }
    return res.status(403).json({ 
        status: 'error',
        message: 'Acceso denegado. Se requieren permisos de usuario'
    });
};

// Middleware para verificar propiedad del carrito
export const checkCartOwnership = async (req, res, next) => {
    try {
        if (!req.session?.user) {
            throw new AuthenticationError('Por favor, inicia sesión primero');
        }

        const cartId = req.params.cid;
        if (!cartId) {
            throw new AuthorizationError('Se requiere ID del carrito');
        }

        // Denegar acceso a administradores
        if (req.session.user.role === ROLES.ADMIN) {
            throw new AuthorizationError('Los administradores no pueden realizar operaciones con carritos');
        }

        // Permitir crear carrito si el usuario no tiene uno
        if (!req.session.user.cart && req.method === 'POST') {
            return next();
        }

        // Verificar propiedad del carrito para otras operaciones
        if (req.session.user.cart && req.session.user.cart.toString() !== cartId) {
            throw new AuthorizationError('Solo puedes acceder a tu propio carrito');
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
        throw new AuthenticationError('Por favor, inicia sesión primero');
    }

    // Solo los administradores pueden modificar productos
    if (user.role === ROLES.ADMIN) {
        return next();
    }

    throw new AuthorizationError('Solo los administradores pueden modificar productos');
};

// Middleware para verificar permisos de compra
export const checkPurchasePermissions = (req, res, next) => {
    const user = req.session.user;

    if (!user) {
        throw new AuthenticationError('Por favor, inicia sesión primero');
    }

    if (user.role === ROLES.ADMIN) {
        throw new AuthorizationError('Los administradores no pueden realizar compras');
    }

    next();
};
