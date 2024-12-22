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
import { Ticket } from "../models/ticket.model.js";

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
        const cart = await cartRepository.getById(req.params.cid);
        if (!cart) {
          throw new NotFoundError("Carrito no encontrado");
        }

        const failedProducts = [];
        const successfulProducts = [];
        let totalAmount = 0;

        for (const item of cart.products) {
          const product = await productRepository.getById(item.product._id);
          
          if (!product) {
            failedProducts.push(item.product._id);
            continue;
          }

          if (product.stock >= item.quantity) {
            product.stock -= item.quantity;
            await productRepository.update(product._id, { stock: product.stock });
            
            successfulProducts.push(item.product._id);
            totalAmount += product.price * item.quantity;
          } else {
            failedProducts.push(item.product._id);
          }
        }

        if (successfulProducts.length > 0) {
          const ticket = await Ticket.create({
            amount: totalAmount,
            purchaser: req.user.email
          });

          cart.products = cart.products.filter(item => 
            failedProducts.includes(item.product._id.toString())
          );
          await cart.save();

          res.json({
            status: "success",
            data: {
              ticket,
              failedProducts: failedProducts.length > 0 ? failedProducts : undefined
            }
          });
        } else {
          res.status(400).json({
            status: "error",
            message: "No se pudo procesar ningún producto",
            failedProducts
          });
        }
      } catch (error) {
        next(error);
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
