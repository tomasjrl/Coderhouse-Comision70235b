export class CustomError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends CustomError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

export class ValidationError extends CustomError {
  constructor(message = "Invalid input data") {
    super(message, 400);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message = "Unauthorized access") {
    super(message, 401);
  }
}

export class ForbiddenError extends CustomError {
  constructor(message = "Access forbidden") {
    super(message, 403);
  }
}

export class ConflictError extends CustomError {
  constructor(message = "Conflict with current state") {
    super(message, 409);
  }
}
