export const isAdmin = (req, res, next) => {
    if (req.session?.user?.role === 'admin') {
        next();
    } else {
        res.status(403).json({ status: 'error', message: 'Access denied. Admin only.' });
    }
};
