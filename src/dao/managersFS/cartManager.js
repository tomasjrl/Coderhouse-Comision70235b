import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const cartsFilePath = path.join(__dirname, "../../data/carts.json");

class CartFileManager {
  constructor() {
    this.carts = [];
    this.loadCarts();
  }

  loadCarts() {
    if (fs.existsSync(cartsFilePath)) {
      const data = fs.readFileSync(cartsFilePath, "utf-8");
      this.carts = JSON.parse(data);
    }
  }

  saveCarts() {
    fs.writeFileSync(cartsFilePath, JSON.stringify(this.carts, null, 2));
  }

  createCart(products) {
    const newCart = { id: this.carts.length + 1, products: [] };
    if (products && Array.isArray(products)) {
      newCart.products = products.map((item) => ({
        product: item.product,
        quantity: item.quantity,
      }));
    }
    this.carts.push(newCart);
    this.saveCarts();
    return newCart;
  }

  getCart(cartId) {
    return this.carts.find((cart) => cart.id === cartId);
  }

  getAllCarts() {
    return this.carts;
  }

  addProductToCart(cartId, productId) {
    const cart = this.getCart(cartId);
    if (!cart) throw new Error("Carrito no encontrado");

    const productIndex = cart.products.findIndex(
      (p) => p.product === productId
    );
    if (productIndex !== -1) {
      cart.products[productIndex].quantity++;
    } else {
      cart.products.push({ product: productId, quantity: 1 });
    }

    this.saveCarts();

    return cart;
  }

  updateProductsInCart(cartId, products) {
    const cart = this.getCart(cartId);
    if (!cart) throw new Error("Carrito no encontrado");

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
      return { product: item.product, quantity: item.quantity };
    });

    cart.products = updatedProducts;
    this.saveCarts();

    return { id: cartId, products: updatedProducts };
  }

  updateProductQuantityInCart(cartId, productId, newQuantity) {
    const cart = this.getCart(cartId);
    if (!cart) throw new Error("Carrito no encontrado");

    const productIndex = cart.products.findIndex(
      (p) => p.product === productId
    );

    if (productIndex !== -1) {
      if (newQuantity > 0) {
        cart.products[productIndex].quantity = newQuantity;
      } else {
        throw new Error("La cantidad debe ser mayor a 0");
      }

      this.saveCarts();
      return cart;
    } else {
      throw new Error(`Producto no encontrado en el carrito ${cartId}`);
    }
  }

  clearProductsInCart(cartId) {
    const cart = this.getCart(cartId);

    if (!cart) throw new Error("Carrito no encontrado");

    cart.products = [];
    this.saveCarts();

    return { message: "Productos eliminados del carrito" };
  }

  async removeProductFromCart(cartId, productId) {
    const numericCartId = Number(cartId);
    const cart = await this.getCart(numericCartId);

    if (!cart) throw new Error("Carrito no encontrado");

    const numericProductId = Number(productId);

    const productIndex = cart.products.findIndex(
      (p) => p.product === numericProductId
    );

    if (productIndex !== -1) {
      cart.products.splice(productIndex, 1);
      await this.saveCarts();
      return cart;
    } else {
      throw new Error(`Producto no encontrado en el carrito ${cartId}`);
    }
  }
}

export default CartFileManager;
