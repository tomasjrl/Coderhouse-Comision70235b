import CartDTO from '../dto/cart.dto.js';

export default class CartRepository {
    constructor(dao) {
        this.dao = dao;
    }

    async getById(id) {
        const cart = await this.dao.getById(id);
        return cart ? new CartDTO(cart) : null;
    }

    async create() {
        const cart = await this.dao.create();
        return new CartDTO(cart);
    }

    async addProduct(cartId, productId, quantity = 1) {
        const updatedCart = await this.dao.addProduct(cartId, productId, quantity);
        return new CartDTO(updatedCart);
    }

    async removeProduct(cartId, productId) {
        const updatedCart = await this.dao.removeProduct(cartId, productId);
        return new CartDTO(updatedCart);
    }

    async updateCart(cartId, products) {
        const updatedCart = await this.dao.updateCart(cartId, products);
        return new CartDTO(updatedCart);
    }

    async clearCart(cartId) {
        const emptyCart = await this.dao.clearCart(cartId);
        return new CartDTO(emptyCart);
    }
}
