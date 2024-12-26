import express from "express";
import {
  isAuthenticated,
  checkRole,
  checkCartOwnership,
  checkPurchasePermissions,
  ROLES,
} from "../middlewares/auth.js";
import { cartRepository, productRepository } from "../repositories/index.js";
import { NotFoundError } from "../utils/errorHandler.js";

const cartRouter = () => {
  const router = express.Router();

  router.use(isAuthenticated);
  router.use(checkRole([ROLES.USER]));

  router.post("/", async (req, res, next) => {
    try {
      const cart = await cartRepository.create();
      res.status(201).json({ status: "success", data: cart });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:cid", checkCartOwnership, async (req, res, next) => {
    try {
      const cart = await cartRepository.getById(req.params.cid);
      if (!cart) {
        throw new NotFoundError("Carrito no encontrado");
      }
      res.json({ status: "success", data: cart });
    } catch (error) {
      next(error);
    }
  });

  router.post(
    "/:cid/products/:pid",
    checkCartOwnership,
    async (req, res, next) => {
      try {
        const product = await productRepository.getById(req.params.pid);
        if (!product) {
          throw new NotFoundError("Producto no encontrado");
        }
        const result = await cartRepository.addProduct(
          req.params.cid,
          req.params.pid,
          req.body.quantity || 1
        );

        res.json({ status: "success", data: result });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    "/:cid/products/:pid",
    checkCartOwnership,
    async (req, res, next) => {
      try {
        const { cid, pid } = req.params;
        const cart = await cartRepository.removeProduct(cid, pid);
        if (!cart) {
          throw new NotFoundError("Carrito o producto no encontrado");
        }
        res.json({ status: "success", data: cart });
      } catch (error) {
        next(error);
      }
    }
  );

  router.put("/:cid", checkCartOwnership, async (req, res, next) => {
    try {
      const cart = await cartRepository.updateCart(
        req.params.cid,
        req.body.products
      );
      if (!cart) {
        throw new NotFoundError("Carrito no encontrado");
      }
      res.json({ status: "success", data: cart });
    } catch (error) {
      next(error);
    }
  });

  router.post(
    "/:cid/purchase",
    checkCartOwnership,
    checkPurchasePermissions,
    async (req, res, next) => {
      try {
        const cartId = req.params.cid;
        const userEmail = req.user?.email || req.session?.user?.email;

        if (!userEmail) {
          return res.status(400).json({
            status: "error",
            error: "Usuario no autenticado o email no disponible"
          });
        }

        const result = await cartRepository.processPurchase(cartId, userEmail);

        if (result.success) {
          if (!result.ticket) {
            throw new Error("Error al generar el ticket de compra");
          }

          return res.status(200).json({
            status: "success",
            data: {
              ticket: {
                code: result.ticket.code,
                amount: result.ticket.amount,
                purchaser: result.ticket.purchaser,
                purchase_datetime: result.ticket.purchase_datetime
              },
              failedProducts: result.failedProducts.length > 0 ? result.failedProducts : []
            }
          });
        } else {
          return res.status(400).json({
            status: "error",
            error: "No se pudo procesar ningún producto del carrito",
            failedProducts: result.failedProducts
          });
        }
      } catch (error) {
        console.error("Error en la compra:", error);
        return res.status(500).json({
          status: "error",
          error: error.message || "Error al procesar la compra"
        });
      }
    }
  );

  router.delete("/:cid/clear", checkCartOwnership, async (req, res, next) => {
    try {
      const cart = await cartRepository.clearCart(req.params.cid);
      if (!cart) {
        throw new NotFoundError("Carrito no encontrado");
      }
      res.json({ status: "success", message: "Carrito vaciado exitosamente" });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:cid", async (req, res, next) => {
    try {
      const cart = await cartRepository.clearCart(req.params.cid);
      if (!cart) {
        throw new NotFoundError("Carrito no encontrado");
      }
      res.json({ status: "success", data: cart });
    } catch (error) {
      next(error);
    }
  });

  return router;
};

export default cartRouter;
