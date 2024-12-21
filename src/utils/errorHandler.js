export class AppError extends Error {
  constructor(message, status = 500, code = "INTERNAL_SERVER_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Not authorized") {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  if (err instanceof AppError) {
    return res.status(err.status).json({
      status: "error",
      code: err.code,
      message: err.message,
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      status: "error",
      code: "VALIDATION_ERROR",
      message: Object.values(err.errors)
        .map((e) => e.message)
        .join(", "),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      status: "error",
      code: "INVALID_ID",
      message: "Invalid ID format",
    });
  }

  return res.status(500).json({
    status: "error",
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
  });
};
