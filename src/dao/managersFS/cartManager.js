import fs from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class CartFileManager {
  constructor() {
    this.path = join(__dirname, "../../../data/carts.json");
    this.initializeFile();
  }

  async initializeFile() {
    try {
      await fs.access(this.path);
    } catch {
      await fs.mkdir(dirname(this.path), { recursive: true });
      await fs.writeFile(this.path, "[]");
    }
  }

  async getAll() {
    const data = await fs.readFile(this.path, "utf-8");
    return JSON.parse(data);
  }

  async create() {
    const carts = await this.getAll();
    const newCart = {
      id: uuidv4(),
      products: [],
      createdAt: new Date(),
    };
    carts.push(newCart);
    await fs.writeFile(this.path, JSON.stringify(carts, null, 2));
    return newCart;
  }

  async getById(cartId) {
    const carts = await this.getAll();
    return carts.find((cart) => cart.id === cartId);
  }

  async addProduct(cartId, productId, quantity = 1) {
    const carts = await this.getAll();
    const cartIndex = carts.findIndex((cart) => cart.id === cartId);

    if (cartIndex === -1) {
      throw new Error("Carrito no encontrado");
    }

    const cart = carts[cartIndex];
    const productIndex = cart.products.findIndex(
      (item) => item.product === productId
    );

    if (productIndex === -1) {
      cart.products.push({ product: productId, quantity });
    } else {
      cart.products[productIndex].quantity += quantity;
    }

    cart.updatedAt = new Date();
    await fs.writeFile(this.path, JSON.stringify(carts, null, 2));
    return cart;
  }

  async removeProduct(cartId, productId) {
    const carts = await this.getAll();
    const cartIndex = carts.findIndex((cart) => cart.id === cartId);

    if (cartIndex === -1) return null;

    const cart = carts[cartIndex];
    cart.products = cart.products.filter((item) => item.product !== productId);
    cart.updatedAt = new Date();

    await fs.writeFile(this.path, JSON.stringify(carts, null, 2));
    return cart;
  }

  async updateCart(cartId, products) {
    const carts = await this.getAll();
    const cartIndex = carts.findIndex((cart) => cart.id === cartId);

    if (cartIndex === -1) return null;

    carts[cartIndex].products = products;
    carts[cartIndex].updatedAt = new Date();

    await fs.writeFile(this.path, JSON.stringify(carts, null, 2));
    return carts[cartIndex];
  }

  async clearCart(cartId) {
    const carts = await this.getAll();
    const cartIndex = carts.findIndex((cart) => cart.id === cartId);

    if (cartIndex === -1) return null;

    carts[cartIndex].products = [];
    carts[cartIndex].updatedAt = new Date();

    await fs.writeFile(this.path, JSON.stringify(carts, null, 2));
    return carts[cartIndex];
  }
}

export default CartFileManager;
