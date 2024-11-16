import mongoose from "mongoose";
import Producto from "../models/productModel.js";

class ProductManager {
  constructor() {
    this.collection = Producto;
  }

  async getAllProducts() {
    return await this.collection.find();
  }

  async getCategories() {
    const products = await this.getAllProducts();
    const categories = [
      ...new Set(products.map((product) => product.category)),
    ];
    return categories;
  }

  async getProductById(id) {
    const product = await this.collection.findById(id);
    if (!product) {
      return null;
    }
    return product;
  }

  async addProduct(productData) {
    const requiredLabels = [
      "title",
      "description",
      "code",
      "price",
      "status",
      "stock",
      "category",
    ];

    const missingLabels = requiredLabels.filter(
      (label) => !(label in productData)
    );
    if (missingLabels.length > 0) {
      throw new Error(
        `Faltan los siguientes campos requeridos: ${missingLabels.join(", ")}`
      );
    }

    let {
      title,
      description,
      code,
      price,
      status = true,
      stock,
      category,
    } = productData;

    if (typeof title !== "string") {
      throw new Error("El título debe ser un string");
    }
    if (typeof description !== "string") {
      throw new Error("La descripción debe ser un string");
    }
    if (typeof code !== "string") {
      throw new Error("El código debe ser un string");
    }

    const existingProduct = await this.collection.findOne({ code });
    if (existingProduct) {
      throw new Error(`Ya existe un producto con el código ${code}`);
    }

    if (typeof status !== "boolean") {
      throw new Error(
        "El estado (status) debe ser un valor booleano (true/false)"
      );
    }

    if (typeof stock === "string") {
      stock = parseInt(stock);
    }
    if (!Number.isInteger(stock) || stock < 0) {
      throw new Error("El stock debe ser un número entero no negativo");
    }

    if (typeof price === "string") {
      price = parseFloat(price);
    }
    if (typeof price !== "number" || price <= 0) {
      throw new Error("El precio debe ser un número positivo");
    }

    const newProduct = {
      title,
      description,
      code,
      price,
      status,
      stock,
      category,
    };

    const result = await this.collection.create(newProduct);
    return { id: result._id, ...newProduct };
  }

  async updateProduct(id, updates) {
    if (updates.id !== undefined) {
      throw new Error("No se permite actualizar el ID del producto");
    }

    const product = await this.getProductById(id);
    if (!product) {
      throw new Error(
        `No se puede actualizar. Producto no encontrado con ID ${id}`
      );
    }

    if (updates.code !== undefined) {
      if (typeof updates.code !== "string") {
        throw new Error("El código debe ser un string");
      }

      const existingProduct = await this.collection.findOne({
        code: updates.code,
      });

      if (existingProduct && existingProduct._id.toString() !== id) {
        throw new Error(`Ya existe un producto con el código ${updates.code}`);
      }
    }

    if (updates.status !== undefined && typeof updates.status !== "boolean") {
      throw new Error("El status debe ser un valor booleano (true/false)");
    }

    if (updates.stock !== undefined) {
      if (!Number.isInteger(updates.stock) || updates.stock < 0) {
        throw new Error("El stock debe ser un número entero no negativo");
      }
    }

    if (updates.price !== undefined) {
      if (typeof updates.price !== "number" || updates.price <= 0) {
        throw new Error("El precio debe ser un número positivo");
      }
    }

    if (updates.title !== undefined && typeof updates.title !== "string") {
      throw new Error("El campo title debe ser un string");
    }

    if (
      updates.description !== undefined &&
      typeof updates.description !== "string"
    ) {
      throw new Error("El campo description debe ser un string");
    }

    if (
      updates.category !== undefined &&
      typeof updates.category !== "string"
    ) {
      throw new Error("El campo category debe ser un string");
    }

    if (updates.thumbnails !== undefined) {
      if (!Array.isArray(updates.thumbnails)) {
        throw new Error(
          "El campo thumbnails debe ser un arreglo vacío o de strings"
        );
      }

      if (
        updates.thumbnails.length > 0 &&
        !updates.thumbnails.every((thumbnail) => typeof thumbnail === "string")
      ) {
        throw new Error("El campo thumbnails solo puede contener strings");
      }
    }

    const updatedProduct = { ...product.toObject(), ...updates };

    await this.collection.updateOne({ _id: id }, { $set: updatedProduct });

    return updatedProduct;
  }

  async deleteProduct(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(
        "ID inválido. Debe ser una cadena hexadecimal de 24 caracteres."
      );
    }

    const result = await this.collection.deleteOne({
      _id: new mongoose.Types.ObjectId(id),
    });

    if (result.deletedCount === 0) {
      throw new Error(
        `No se puede eliminar. Producto no encontrado con ID ${id}`
      );
    }

    return { message: `Producto con ID ${id} eliminado` };
  }
}

export default ProductManager;
