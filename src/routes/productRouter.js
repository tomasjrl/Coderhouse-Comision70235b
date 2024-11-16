import express from "express";
import { ObjectId } from "mongodb";
import ProductManager from "../dao/managersDB/productManager.js";
import ProductFileManager from "../dao/managersFS/productManager.js";

const productRouter = (useMongoDB = true) => {
  const router = express.Router();
  const productManager = useMongoDB
    ? new ProductManager()
    : new ProductFileManager();

  router.get("/", async (req, res) => {
    try {
      let products = await productManager.getAllProducts();
      const category = req.query.category;
      const stock = req.query.stock;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;

      if (isNaN(page) || page < 1) {
        return res.status(400).json({ error: "Número de página inválido" });
      }

      if (isNaN(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({ error: "Límite de productos inválido" });
      }

      if (category) {
        const normalizedCategory = category
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        products = products.filter((product) =>
          product.category.toLowerCase().includes(normalizedCategory)
        );
        if (products.length === 0) {
          return res
            .status(404)
            .json({
              message: `No se encontraron productos con la categoría '${category}'`,
            });
        }
      }

      if (stock === "true") {
        products = products.filter((product) => product.stock > 0);
      } else if (stock === "false") {
        products = products.filter((product) => product.stock === 0);
      }

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProducts = products.slice(startIndex, endIndex);

      const totalPages = Math.ceil(products.length / limit);
      const hasPrevPage = page > 1;
      const hasNextPage = page < totalPages;

      const response = {
        status: "success",
        payload: paginatedProducts,
        totalPages,
        page,
        hasPrevPage,
        hasNextPage,
        prevLink: hasPrevPage ? `?page=${page - 1}&limit=${limit}` : null,
        nextLink: hasNextPage ? `?page=${page + 1}&limit=${limit}` : null,
      };

      res.json(response);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ status: "error", message: "Error al obtener productos" });
    }
  });

  router.get("/:pid", async (req, res) => {
    try {
      const productId = req.params.pid;

      const id = String(productId);

      if (useMongoDB && !ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({
            status: "error",
            message:
              "ID inválido. Debe ser una cadena hexadecimal de 24 caracteres.",
          });
      }

      const finalId = useMongoDB ? ObjectId.createFromHexString(id) : id;

      const product = await productManager.getProductById(finalId);

      if (!product) {
        return res
          .status(404)
          .json({
            status: "error",
            message: `Producto con ID ${productId} no encontrado`,
          });
      }

      res.json({ status: "success", payload: product });
    } catch (error) {
      console.error("Error al obtener producto:", error);

      if (error.message.startsWith("Producto no encontrado")) {
        return res
          .status(404)
          .json({ status: "error", message: error.message });
      }

      res
        .status(500)
        .json({ status: "error", message: "Error interno del servidor" });
    }
  });

  router.put("/:pid", async (req, res) => {
    const productId = req.params.pid;

    const id = String(productId);

    if (useMongoDB && !ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({
          status: "error",
          message:
            "ID inválido. Debe ser una cadena hexadecimal de 24 caracteres.",
        });
    }

    const finalId = useMongoDB ? ObjectId.createFromHexString(id) : id;

    try {
      const updatedProduct = await productManager.updateProduct(
        finalId,
        req.body
      );

      res.json({ status: "success", payload: updatedProduct });
    } catch (error) {
      if (error.message.startsWith("Producto no encontrado")) {
        return res
          .status(404)
          .json({ status: "error", message: error.message });
      }

      res.status(400).json({ status: "error", message: error.message });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const requiredLabels = [
        "title",
        "description",
        "code",
        "price",
        "status",
        "stock",
        "category",
      ];

      for (const label of requiredLabels) {
        if (!req.body[label]) {
          return res
            .status(400)
            .json({
              status: "error",
              message: `El campo ${label} es requerido`,
            });
        }
      }

      if (typeof req.body.title !== "string") {
        return res
          .status(400)
          .json({ status: "error", message: "El título debe ser un string" });
      }
      if (typeof req.body.description !== "string") {
        return res
          .status(400)
          .json({
            status: "error",
            message: "La descripción debe ser un string",
          });
      }
      if (typeof req.body.code !== "string") {
        return res
          .status(400)
          .json({ status: "error", message: "El código debe ser un string" });
      }
      if (typeof req.body.price !== "number" || req.body.price <= 0) {
        return res
          .status(400)
          .json({
            status: "error",
            message: "El precio debe ser un número positivo",
          });
      }
      if (typeof req.body.status !== "boolean") {
        return res
          .status(400)
          .json({
            status: "error",
            message: "El estado (status) debe ser un valor booleano",
          });
      }

      if (typeof req.body.stock !== "number") {
        return res
          .status(400)
          .json({
            status: "error",
            message: "El campo stock debe ser un número",
          });
      }

      if (!Number.isInteger(req.body.stock) || req.body.stock < 0) {
        return res
          .status(400)
          .json({
            status: "error",
            message: "El stock debe ser un número entero no negativo",
          });
      }

      if (typeof req.body.category !== "string") {
        return res
          .status(400)
          .json({
            status: "error",
            message: "La categoría debe ser un string",
          });
      }

      const result = await productManager.addProduct(req.body);

      res.status(201).json({ status: "success", payload: result });
    } catch (error) {
      if (error.message.startsWith("Ya existe un producto con el código")) {
        return res
          .status(400)
          .json({ status: "error", message: error.message });
      }

      if (error.message.startsWith("No se puede agregar")) {
        return res
          .status(404)
          .json({ status: "error", message: error.message });
      }

      res
        .status(500)
        .json({ status: "error", message: "Error al crear producto" });
    }
  });

  router.delete("/:pid", async (req, res) => {
    try {
      const productId = req.params.pid;

      const id = String(productId);

      if (useMongoDB && !ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({
            status: "error",
            message:
              "ID inválido. Debe ser una cadena hexadecimal de 24 caracteres.",
          });
      }

      const finalId = useMongoDB ? ObjectId.createFromHexString(id) : id;

      await productManager.deleteProduct(finalId);

      res
        .status(200)
        .json({ status: "success", message: "Producto eliminado con éxito" });
    } catch (error) {
      if (
        error.message.startsWith("No se puede eliminar. Producto no encontrado")
      ) {
        return res
          .status(404)
          .json({ status: "error", message: error.message });
      }

      res
        .status(500)
        .json({ status: "error", message: "Error al eliminar producto" });
    }
  });

  return router;
};

export default productRouter;
