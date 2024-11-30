// Clase base para errores personalizados
export class CustomError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Error para recursos no encontrados
export class NotFoundError extends CustomError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}

// Error para validación de datos
export class ValidationError extends CustomError {
    constructor(message = 'Invalid input data') {
        super(message, 400);
    }
}

// Error para acceso no autorizado
export class UnauthorizedError extends CustomError {
    constructor(message = 'Unauthorized access') {
        super(message, 401);
    }
}

// Error para acceso prohibido
export class ForbiddenError extends CustomError {
    constructor(message = 'Access forbidden') {
        super(message, 403);
    }
}

// Error para conflictos
export class ConflictError extends CustomError {
    constructor(message = 'Conflict with current state') {
        super(message, 409);
    }
}
