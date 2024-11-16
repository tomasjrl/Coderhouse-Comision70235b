import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const productsFilePath = path.join(__dirname, "../../data/products.json");

class ProductFileManager {
  constructor() {
    this.products = [];
    this.loadProducts();
  }

  loadProducts() {
    if (fs.existsSync(productsFilePath)) {
      const data = fs.readFileSync(productsFilePath, "utf-8");
      this.products = JSON.parse(data);
    }
  }

  saveProducts() {
    fs.writeFileSync(productsFilePath, JSON.stringify(this.products, null, 2));
  }

  getAllProducts() {
    return this.products;
  }

  getProductById(id) {
    const numericId = Number(id);

    const product = this.products.find((p) => p.id === numericId);
    return product || null;
  }

  addProduct(productData) {
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

    const existingProduct = this.products.find(
      (p) => p.code === productData.code
    );
    if (existingProduct) {
      throw new Error(
        `Ya existe un producto con el código ${productData.code}`
      );
    }

    const newProduct = {
      id: this.products.length + 1,
      ...productData,
    };

    this.products.push(newProduct);
    this.saveProducts();
    return newProduct;
  }

  updateProduct(id, updates) {
    if (updates.id !== undefined) {
      throw new Error("No se permite actualizar el ID del producto");
    }

    const numericId = Number(id);
    const productIndex = this.products.findIndex(
      (product) => product.id === numericId
    );

    if (productIndex === -1) {
      throw new Error(
        `No se puede actualizar. Producto no encontrado con ID ${id}`
      );
    }

    const allowedFields = [
      "title",
      "description",
      "code",
      "price",
      "status",
      "stock",
      "category",
      "thumbnails",
    ];

    const unknownFields = Object.keys(updates).filter(
      (field) => !allowedFields.includes(field)
    );
    if (unknownFields.length > 0) {
      throw new Error(
        `No se permiten los siguientes campos: ${unknownFields.join(", ")}`
      );
    }

    const filteredUpdates = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (
      filteredUpdates.title !== undefined &&
      typeof filteredUpdates.title !== "string"
    ) {
      throw new Error("El campo title debe ser un string");
    }

    if (
      filteredUpdates.description !== undefined &&
      typeof filteredUpdates.description !== "string"
    ) {
      throw new Error("El campo description debe ser un string");
    }

    if (filteredUpdates.price !== undefined) {
      if (
        typeof filteredUpdates.price !== "number" ||
        filteredUpdates.price <= 0
      ) {
        throw new Error("El campo price debe ser un número positivo");
      }
    }

    if (filteredUpdates.stock !== undefined) {
      if (
        typeof filteredUpdates.stock !== "number" ||
        filteredUpdates.stock < 0
      ) {
        throw new Error("El campo stock debe ser un número 0 o positivo");
      }
    }

    if (
      filteredUpdates.category !== undefined &&
      typeof filteredUpdates.category !== "string"
    ) {
      throw new Error("El campo category debe ser un string");
    }

    if (
      filteredUpdates.status !== undefined &&
      typeof filteredUpdates.status !== "boolean"
    ) {
      throw new Error("El campo status debe ser un booleano (true o false)");
    }

    if (filteredUpdates.thumbnails !== undefined) {
      if (!Array.isArray(filteredUpdates.thumbnails)) {
        throw new Error(
          "El campo thumbnails debe ser un arreglo vacío o de strings"
        );
      }

      if (
        filteredUpdates.thumbnails.length > 0 &&
        !filteredUpdates.thumbnails.every(
          (thumbnail) => typeof thumbnail === "string"
        )
      ) {
        throw new Error("El campo thumbnails solo puede contener strings");
      }
    }

    if (filteredUpdates.code !== undefined) {
      if (typeof filteredUpdates.code !== "string") {
        throw new Error("El campo code debe ser un string");
      }

      if (
        this.products.some(
          (p) => p.code === filteredUpdates.code && p.id !== numericId
        )
      ) {
        throw new Error(
          `Ya existe un producto con el código ${filteredUpdates.code}`
        );
      }
    }

    this.products[productIndex] = {
      ...this.products[productIndex],
      ...filteredUpdates,
    };

    this.saveProducts();
    return this.products[productIndex];
  }

  deleteProduct(id) {
    const numericId = Number(id);
    const productIndex = this.products.findIndex((p) => p.id === numericId);

    if (productIndex === -1) {
      throw new Error("No se puede eliminar. Producto no encontrado");
    }

    this.products.splice(productIndex, 1);
    this.saveProducts();

    return { message: `Producto con ID ${numericId} eliminado` };
  }
}

export default ProductFileManager;
