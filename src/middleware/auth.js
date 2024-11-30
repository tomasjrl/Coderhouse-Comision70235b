export const isAuthenticated = (req, res, next) => {
    if (!req.session?.user) {
        return res.redirect('/login');
    }
    next();
};

export const isNotAuthenticated = (req, res, next) => {
    if (req.session?.user) {
        return res.redirect('/');
    }
    next();
};

export const isAdmin = (req, res, next) => {
    if (req.session?.user?.role === 'admin') {
        return next();
    }
    // Si es una petición de API (espera JSON)
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(403).json({ 
            status: 'error',
            message: 'Acceso denegado. Se requieren permisos de administrador.' 
        });
    }
    // Si es una petición web (espera HTML)
    return res.status(403).render('error', {
        error: 'Acceso denegado. Se requieren permisos de administrador.',
        user: req.session.user,
        title: 'Error - Acceso Denegado'
    });
};

export const isUser = (req, res, next) => {
    if (req.session?.user?.role === 'user') {
        return next();
    }
    res.status(403).json({ 
        status: 'error',
        message: 'Acceso denegado. Se requieren permisos de usuario.' 
    });
};

// Middleware para verificar que el usuario solo pueda acceder a su propio carrito
export const checkCartOwnership = (req, res, next) => {
    const user = req.session?.user;
    if (!user || !user.cart) {
        return res.status(403).json({
            status: 'error',
            message: 'Acceso denegado. Usuario no autenticado o sin carrito asignado.'
        });
    }

    const requestedCartId = req.params.cid;
    const userCartId = user.cart.toString();

    if (requestedCartId !== userCartId) {
        console.log('Intento de acceso no autorizado al carrito:', {
            usuarioId: user._id,
            carritoDelUsuario: userCartId,
            carritoSolicitado: requestedCartId
        });
        
        return res.status(403).json({
            status: 'error',
            message: 'Acceso denegado. No puedes acceder al carrito de otro usuario.'
        });
    }

    next();
};
