import express from "express";
import CartManager from "../dao/managersDB/cartManager.js";
import CartFileManager from "../dao/managersFS/cartManager.js";
import ProductManager from "../dao/managersDB/productManager.js";
import ProductFileManager from "../dao/managersFS/productManager.js";

import mongoose from "mongoose";

const {
  Types: { ObjectId },
} = mongoose;

const cartRouter = express.Router();
let cartManager;
let productManager;

const initializeCartRouter = (
  useMongoDBForCarts = true,
  useMongoDBForProducts = true
) => {
  if (useMongoDBForCarts) {
    cartManager = new CartManager();
  } else {
    cartManager = new CartFileManager();
  }

  if (useMongoDBForProducts) {
    productManager = new ProductManager();
  } else {
    productManager = new ProductFileManager();
  }
};

cartRouter.post("/", async (req, res) => {
  try {
    const { products } = req.body;
    const newCart = await cartManager.createCart(products);
    res.status(201).json({ cart: newCart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno al crear el carrito" });
  }
});

cartRouter.get("/", async (req, res) => {
  try {
    const carts = await cartManager.getAllCarts();
    if (carts.length > 0) {
      res.json({ cartId: carts[0]._id || carts[0].id }); // Manejar ID según el tipo de almacenamiento
    } else {
      res.json({ cartId: null });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno al obtener carritos" });
  }
});

cartRouter.get("/:cid", async (req, res) => {
  try {
    const cartId = req.params.cid;

    const id = String(cartId);

    if (cartManager instanceof CartManager && !ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({
          status: "error",
          message:
            "ID inválido. Debe ser una cadena hexadecimal de 24 caracteres.",
        });
    }

    const finalId =
      cartManager instanceof CartManager
        ? ObjectId.createFromHexString(id)
        : parseInt(id); // Crear ObjectId o convertir a número

    const cart = await cartManager.getCart(finalId);

    if (!cart) {
      return res
        .status(404)
        .json({
          status: "error",
          message: `Carrito con ID ${cartId} no encontrado`,
        });
    }

    res.json({ status: "success", payload: cart });
  } catch (error) {
    console.error("Error al obtener carrito:", error);

    if (error.message.startsWith("Carrito no encontrado")) {
      return res.status(404).json({ status: "error", message: error.message });
    }

    res
      .status(500)
      .json({ status: "error", message: "Error interno del servidor" });
  }
});

cartRouter.put("/:cid", async (req, res) => {
  try {
    const cartId = req.params.cid;
    const { products } = req.body;

    const updatedCart = await cartManager.updateProductsInCart(
      cartId,
      products
    );

    res.status(200).json(updatedCart);
  } catch (error) {
    if (error.message.includes("Carrito no encontrado")) {
      res.status(404).json({ message: "Carrito no encontrado" });
    } else {
      console.error(error);
      res.status(500).json({
        message: "Error interno al actualizar productos en el carrito",
      });
    }
  }
});

cartRouter.delete("/:cid", async (req, res) => {
  try {
    const cartId = req.params.cid;

    const id = String(cartId);

    if (cartManager instanceof CartManager && !ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({
          status: "error",
          message:
            "ID inválido. Debe ser una cadena hexadecimal de 24 caracteres.",
        });
    }

    const finalId =
      cartManager instanceof CartManager
        ? ObjectId.createFromHexString(id)
        : parseInt(id);

    const clearedCart = await cartManager.clearProductsInCart(finalId);

    if (!clearedCart) {
      return res
        .status(404)
        .json({
          status: "error",
          message: `Carrito con ID ${cartId} no encontrado`,
        });
    }

    res.json({ status: "success", payload: clearedCart });
  } catch (error) {
    console.error("Error al eliminar productos del carrito:", error);

    if (error.message.includes("Carrito no encontrado")) {
      return res
        .status(404)
        .json({ status: "error", message: "Carrito no encontrado" });
    }

    res
      .status(500)
      .json({
        status: "error",
        message: "Error interno al eliminar productos del carrito",
      });
  }
});

cartRouter.post("/:cid/products/:pid", async (req, res) => {
  try {
    const cartId = req.params.cid;
    const productId = req.params.pid;

    const cartIdStr = String(cartId);
    const productIdStr = String(productId);

    const isMongoDB = cartManager instanceof CartManager;

    if (isMongoDB && !ObjectId.isValid(cartIdStr)) {
      return res.status(400).json({
        message:
          "ID del carrito inválido. Debe ser una cadena hexadecimal de 24 caracteres.",
      });
    }

    const finalCartId = isMongoDB
      ? ObjectId.createFromHexString(cartIdStr)
      : parseInt(cartIdStr); // Crear ObjectId o convertir a número

    if (isMongoDB && !ObjectId.isValid(productIdStr)) {
      return res.status(400).json({
        message:
          "ID del producto inválido. Debe ser una cadena hexadecimal de 24 caracteres.",
      });
    }

    const finalProductId = isMongoDB
      ? ObjectId.createFromHexString(productIdStr)
      : parseInt(productIdStr); // Crear ObjectId o convertir a número

    const updatedCart = await cartManager.addProductToCart(
      finalCartId,
      finalProductId
    );

    const populatedCart = await cartManager.getCart(finalCartId);

    res.status(200).json(populatedCart);
  } catch (error) {
    if (error.message.includes("Carrito no encontrado")) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    } else if (error.message.includes("Producto con ID")) {
      return res.status(404).json({ message: error.message });
    } else {
      console.error(error);
      res
        .status(500)
        .json({ message: "Error interno al agregar producto al carrito" });
    }
  }
});

cartRouter.put("/:cid/products/:pid", async (req, res) => {
  try {
    const cartId = req.params.cid;
    const productId = req.params.pid;

    const { quantity } = req.body;

    if (!quantity || typeof quantity !== "number") {
      return res.status(400).json({
        message:
          "Debe proporcionar una cantidad válida en el cuerpo de la solicitud",
      });
    }

    if (quantity < 0) {
      return res
        .status(400)
        .json({ message: "La cantidad no puede ser un número negativo." });
    }

    const cartIdStr = String(cartId);
    const productIdStr = String(productId);

    const isMongoDB = cartManager instanceof CartManager;

    if (isMongoDB && !ObjectId.isValid(cartIdStr)) {
      return res
        .status(400)
        .json({
          status: "error",
          message:
            "ID de carrito inválido. Debe ser una cadena hexadecimal de 24 caracteres.",
        });
    }

    const finalCartId = isMongoDB
      ? ObjectId.createFromHexString(cartIdStr)
      : parseInt(cartIdStr); // Crear ObjectId o convertir a número

    if (isMongoDB && !ObjectId.isValid(productIdStr)) {
      return res
        .status(400)
        .json({
          status: "error",
          message:
            "ID de producto inválido. Debe ser una cadena hexadecimal de 24 caracteres.",
        });
    }

    const finalProductId = isMongoDB
      ? ObjectId.createFromHexString(productIdStr)
      : parseInt(productIdStr); // Crear ObjectId o convertir a número

    const updatedCart = await cartManager.updateProductQuantityInCart(
      finalCartId,
      finalProductId,
      quantity
    );

    res.status(200).json(updatedCart);
  } catch (error) {
    if (error.message.includes("Carrito no encontrado")) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    } else if (error.message.includes("Producto no encontrado")) {
      return res
        .status(404)
        .json({ message: "Producto no encontrado en el carrito" });
    } else {
      console.error(error);
      res.status(500).json({
        message:
          "Error interno al actualizar cantidad del producto en el carrito",
      });
    }
  }
});

cartRouter.delete("/:cid/products/:pid", async (req, res) => {
  try {
    const cartId = req.params.cid;
    const productId = req.params.pid;

    const cartIdStr = String(cartId);
    const productIdStr = String(productId);

    const isMongoDB = cartManager instanceof CartManager;

    if (isMongoDB && !ObjectId.isValid(cartIdStr)) {
      return res
        .status(400)
        .json({
          status: "error",
          message:
            "ID de carrito inválido. Debe ser una cadena hexadecimal de 24 caracteres.",
        });
    }

    if (isMongoDB && !ObjectId.isValid(productIdStr)) {
      return res
        .status(400)
        .json({
          status: "error",
          message:
            "ID de producto inválido. Debe ser una cadena hexadecimal de 24 caracteres.",
        });
    }

    const finalCartId = isMongoDB
      ? ObjectId.createFromHexString(cartIdStr)
      : cartIdStr;
    const finalProductId = isMongoDB
      ? ObjectId.createFromHexString(productIdStr)
      : productIdStr;

    const updatedCart = await cartManager.removeProductFromCart(
      finalCartId,
      finalProductId
    );

    if (!updatedCart) {
      return res
        .status(404)
        .json({
          status: "error",
          message: `Carrito con ID ${cartId} no encontrado`,
        });
    }

    res.status(200).json({ status: "success", payload: updatedCart });
  } catch (error) {
    if (error.message.includes("Carrito no encontrado")) {
      return res
        .status(404)
        .json({ status: "error", message: "Carrito no encontrado" });
    } else if (error.message.includes("Producto no encontrado")) {
      return res
        .status(404)
        .json({
          status: "error",
          message: "Producto no encontrado en el carrito",
        });
    }

    res
      .status(500)
      .json({
        status: "error",
        message: "Error interno al eliminar producto del carrito",
      });
  }
});

export default cartRouter;

export { initializeCartRouter };
