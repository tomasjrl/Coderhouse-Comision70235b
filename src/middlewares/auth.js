import {
  AuthenticationError,
  AuthorizationError,
} from "../utils/errorHandler.js";

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
};

export const checkAuth =
  (shouldBeAuthenticated = true) =>
  (req, res, next) => {
    const isUserAuthenticated = !!req.session?.user;

    if (shouldBeAuthenticated && !isUserAuthenticated) {
      if (req.headers.accept?.includes("application/json")) {
        return res.status(401).json({
          status: "error",
          message: "Por favor, inicia sesión primero",
        });
      }
      return res.redirect("/login");
    }

    if (!shouldBeAuthenticated && isUserAuthenticated) {
      return res.redirect("/");
    }

    next();
  };

export const isAuthenticated = checkAuth(true);
export const isNotAuthenticated = checkAuth(false);

export const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.session?.user) {
      throw new AuthenticationError("Por favor, inicia sesión primero");
    }

    const userRole = req.session.user.role;
    if (!roles.includes(userRole)) {
      throw new AuthorizationError(
        `Acceso denegado. Roles requeridos: ${roles.join(", ")}`
      );
    }
    next();
  };
};

export const isAdmin = (req, res, next) => {
  if (req.session?.user?.role === ROLES.ADMIN) {
    return next();
  }
  if (req.headers.accept?.includes("application/json")) {
    return res.status(403).json({
      status: "error",
      message: "Acceso denegado. Se requieren permisos de administrador",
    });
  }
  return res.status(403).render("error", {
    error: "Acceso denegado. Se requieren permisos de administrador",
    user: req.session.user,
    title: "Error - Acceso Denegado",
  });
};

export const isUser = (req, res, next) => {
  if (req.session?.user?.role === ROLES.USER) {
    return next();
  }
  return res.status(403).json({
    status: "error",
    message: "Acceso denegado. Se requieren permisos de usuario",
  });
};

export const checkCartOwnership = async (req, res, next) => {
  try {
    if (!req.session?.user) {
      throw new AuthenticationError("Por favor, inicia sesión primero");
    }

    const cartId = req.params.cid;
    if (!cartId) {
      throw new AuthorizationError("Se requiere ID del carrito");
    }

    if (req.session.user.role === ROLES.ADMIN) {
      throw new AuthorizationError(
        "Los administradores no pueden realizar operaciones con carritos"
      );
    }

    if (!req.session.user.cart && req.method === "POST") {
      return next();
    }

    if (req.session.user.cart && req.session.user.cart.toString() !== cartId) {
      throw new AuthorizationError("Solo puedes acceder a tu propio carrito");
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const checkProductPermissions = (req, res, next) => {
  const user = req.session.user;

  if (!user) {
    throw new AuthenticationError("Por favor, inicia sesión primero");
  }

  if (user.role === ROLES.ADMIN) {
    return next();
  }

  throw new AuthorizationError(
    "Solo los administradores pueden modificar productos"
  );
};

export const checkPurchasePermissions = (req, res, next) => {
  const user = req.session?.user || req.user;

  if (!user) {
    throw new AuthenticationError("Por favor, inicia sesión primero");
  }

  if (!user.email) {
    throw new AuthenticationError("Email de usuario no disponible");
  }

  if (user.role === ROLES.ADMIN) {
    throw new AuthorizationError(
      "Los administradores no pueden realizar compras"
    );
  }

  req.user = user;
  next();
};
