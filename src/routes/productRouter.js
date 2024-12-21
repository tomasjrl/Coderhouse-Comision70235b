import express from "express";
import {
  checkRole,
  checkProductPermissions,
  ROLES,
} from "../middlewares/auth.js";
import { productRepository } from "../repositories/index.js";
import { ValidationError, NotFoundError } from "../utils/errorHandler.js";

const productRouter = () => {
  const router = express.Router();

  router.use((req, res, next) => {
    res.set("Content-Type", "application/json");
    res.set("Access-Control-Allow-Origin", "*");
    next();
  });

  router.get("/", async (req, res, next) => {
    try {
      const { page = 1, limit = 10, sort, query, category } = req.query;

      let filter = {};
      if (query) {
        filter.$or = [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ];
      }
      if (category) {
        filter.category = category;
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sort ? { price: sort === "asc" ? 1 : -1 } : undefined,
        filter,
      };

      const products = await productRepository.getAll(options);
      res.json({ status: "success", data: products });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const product = await productRepository.getById(req.params.id);
      if (!product) {
        throw new NotFoundError("Producto no encontrado");
      }
      res.json({ status: "success", data: product });
    } catch (error) {
      next(error);
    }
  });

  router.post(
    "/",
    checkRole([ROLES.ADMIN]),
    checkProductPermissions,
    async (req, res, next) => {
      try {
        if (!req.body.title || !req.body.price) {
          throw new ValidationError("Título y precio son requeridos");
        }
        const product = await productRepository.create(req.body);
        res.status(201).json({ status: "success", data: product });
      } catch (error) {
        next(error);
      }
    }
  );

  router.put(
    "/:id",
    checkRole([ROLES.ADMIN]),
    checkProductPermissions,
    async (req, res, next) => {
      try {
        const product = await productRepository.update(req.params.id, req.body);
        if (!product) {
          throw new NotFoundError("Producto no encontrado");
        }
        res.json({ status: "success", data: product });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    "/:id",
    checkRole([ROLES.ADMIN]),
    checkProductPermissions,
    async (req, res, next) => {
      try {
        const result = await productRepository.delete(req.params.id);
        if (!result) {
          throw new NotFoundError("Producto no encontrado");
        }
        res.json({ status: "success", message: "Producto eliminado" });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
};

export default productRouter;
