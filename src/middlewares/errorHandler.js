import { CustomError } from '../utils/customError.js';

export const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // En desarrollo, enviar el stack trace
    if (process.env.NODE_ENV === 'development') {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }

    // En producción, enviar mensaje de error limpio
    if (err instanceof CustomError) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }

    // Error 500 genérico para errores no operacionales
    return res.status(500).json({
        status: 'error',
        message: 'Something went wrong!'
    });
};
