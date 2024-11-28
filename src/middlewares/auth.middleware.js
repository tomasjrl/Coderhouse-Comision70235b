export const isAuthenticated = (req, res, next) => {
    if (req.session.login) {
        return next();
    }
    
    // Si es una petición de API
    if (req.headers['content-type'] === 'application/json') {
        return res.status(401).json({ 
            status: "error", 
            error: "No autorizado. Debe iniciar sesión." 
        });
    }
    
    // Si es una petición web
    return res.redirect('/login');
};

// Middleware para redirigir usuarios ya autenticados
export const redirectIfLoggedIn = (req, res, next) => {
    if (req.session.login) {
        return res.redirect('/profile');
    }
    next();
};
