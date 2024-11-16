import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";
import mongoose from "mongoose";

const {
  Types: { ObjectId },
} = mongoose;

class CartManager {
  constructor() {
    this.collection = Cart;
  }

  async createCart(products) {
    const newCart = { products: [] };

    if (products && Array.isArray(products)) {
      newCart.products = products.map((item) => ({
        product: item.product,
        quantity: item.quantity,
      }));
    }

    const result = await this.collection.create(newCart);
    return { _id: result._id, ...newCart };
  }

  async getCart(cartId) {
    return await this.collection.findById(cartId).populate("products.product");
  }

  async getAllCarts() {
    try {
      const carts = await Cart.find().populate("products.product");
      return carts;
    } catch (error) {
      throw error;
    }
  }

  async addProductToCart(cartId, productId) {
    const cart = await this.getCart(cartId);

    if (!ObjectId.isValid(productId)) {
      throw new Error(`ID de producto inválido: ${productId}`);
    }

    const productExists = await Product.findById(productId);
    if (!productExists) {
      throw new Error(`Producto con ID ${productId} no encontrado.`);
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);

    const productIndex = cart.products.findIndex((p) =>
      p.product.equals(productObjectId)
    );

    if (productIndex !== -1) {
      cart.products[productIndex].quantity++;
    } else {
      cart.products.push({ product: productObjectId, quantity: 1 });
    }

    await this.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(cartId) },
      { $set: { products: cart.products } }
    );
    return cart;
  }

  async updateProductsInCart(cartId, products) {
    const cart = await this.getCart(cartId);

    if (!Array.isArray(products)) {
      throw new Error("Los productos deben ser un arreglo.");
    }

    const updatedProducts = products.map((item) => {
      if (
        !item.product ||
        typeof item.quantity !== "number" ||
        item.quantity <= 0
      ) {
        throw new Error(
          "Cada producto debe tener un ID y una cantidad válida mayor a 0."
        );
      }
      return {
        product: new mongoose.Types.ObjectId(item.product),
        quantity: item.quantity,
      };
    });

    await this.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(cartId) },
      { $set: { products: updatedProducts } }
    );

    return { _id: cartId, products: updatedProducts };
  }

  async updateProductQuantityInCart(cartId, productId, newQuantity) {
    const cart = await this.getCart(cartId);
    const productObjectId = new mongoose.Types.ObjectId(productId);

    const productIndex = cart.products.findIndex((p) =>
      p.product.equals(productObjectId)
    );

    if (productIndex !== -1) {
      if (newQuantity > 0) {
        cart.products[productIndex].quantity = newQuantity;
      } else {
        throw new Error("La cantidad debe ser mayor a 0");
      }

      await this.collection.updateOne(
        { _id: new mongoose.Types.ObjectId(cartId) },
        { $set: { products: cart.products } }
      );
      return cart;
    } else {
      throw new Error(`Producto no encontrado en el carrito ${cartId}`);
    }
  }

  async clearProductsInCart(cartId) {
    await this.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(cartId) },
      { $set: { products: [] } }
    );
    return { message: "Productos eliminados del carrito" };
  }

  async removeProductFromCart(cartId, productId) {
    const cart = await this.getCart(cartId);

    if (!ObjectId.isValid(productId)) {
      throw new Error("ID inválido para el producto.");
    }

    const productIndex = cart.products.findIndex((p) =>
      p.product.equals(new ObjectId(productId))
    );

    if (productIndex !== -1) {
      cart.products.splice(productIndex, 1);
      await this.collection.updateOne(
        { _id: new ObjectId(cartId) },
        { $set: { products: cart.products } }
      );
      return cart;
    } else {
      throw new Error(`Producto no encontrado en el carrito ${cartId}`);
    }
  }
}

export default CartManager;
