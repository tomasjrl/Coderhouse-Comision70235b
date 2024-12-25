import Cart from "../../models/cart.model.js";
import Ticket from "../../models/ticket.model.js";

class CartManager {
  async create() {
    try {
      const cart = new Cart({ products: [] });
      await cart.save();
      return cart.toObject();
    } catch (error) {
      throw error;
    }
  }

  async getById(cartId) {
    try {
      return await Cart.findById(cartId).populate("products.product").lean();
    } catch (error) {
      throw error;
    }
  }

  async addProduct(cartId, productId, quantity = 1) {
    try {
      const cart = await Cart.findOne({ _id: cartId });
      if (!cart) {
        throw new Error("Carrito no encontrado");
      }

      const existingProduct = cart.products.find(
        (item) =>
          item.product._id.toString() === productId ||
          item.product.toString() === productId
      );

      if (existingProduct) {
        existingProduct.quantity += quantity;
      } else {
        cart.products.push({ product: productId, quantity });
      }

      await cart.save();
      return (await cart.populate("products.product")).toObject();
    } catch (error) {
      throw error;
    }
  }

  async removeProduct(cartId, productId) {
    try {
      const cart = await Cart.findByIdAndUpdate(
        cartId,
        { $pull: { products: { product: productId } } },
        { new: true }
      ).lean();
      return cart;
    } catch (error) {
      throw error;
    }
  }

  async updateCart(cartId, products) {
    try {
      const cart = await Cart.findById(cartId);
      if (!cart) {
        throw new Error("Carrito no encontrado");
      }

      cart.products = products;
      await cart.save();
      return cart.toObject();
    } catch (error) {
      console.error("Error al actualizar carrito:", error);
      throw error;
    }
  }

  async clearCart(cartId) {
    try {
      const cart = await Cart.findById(cartId);
      if (!cart) {
        throw new Error("Carrito no encontrado");
      }

      cart.products = [];
      return await cart.save();
    } catch (error) {
      throw error;
    }
  }

  async createTicket(ticketData) {
    try {
      if (!ticketData.amount || !ticketData.purchaser) {
        throw new Error("Datos de ticket inválidos");
      }

      const ticket = new Ticket({
        amount: ticketData.amount,
        purchaser: ticketData.purchaser
      });

      await ticket.save();
      return ticket.toObject();
    } catch (error) {
      console.error("Error al crear ticket:", error);
      throw error;
    }
  }
}

export default CartManager;
