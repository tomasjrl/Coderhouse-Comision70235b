import CartDTO from '../dto/cart.dto.js';
import { productRepository } from './index.js';

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

    async processPurchase(cartId, userEmail) {
        const cart = await this.dao.getById(cartId);
        if (!cart || !cart.products) {
            throw new Error('Carrito no encontrado o vacío');
        }

        const failedProducts = [];
        const successProducts = [];
        let total = 0;

        // Verificar stock y procesar cada producto
        for (const item of cart.products) {
            // Obtener el producto actualizado de la base de datos
            const product = await productRepository.getById(item.product._id);
            if (!product) {
                failedProducts.push(item);
                continue;
            }

            if (product.stock >= item.quantity) {
                // Actualizar stock
                product.stock -= item.quantity;
                await productRepository.update(product._id, { stock: product.stock });
                
                // Calcular subtotal
                total += product.price * item.quantity;
                successProducts.push(item);
            } else {
                failedProducts.push(item);
            }
        }

        // Si hay productos exitosos, crear ticket
        if (successProducts.length > 0) {
            const ticket = await this.dao.createTicket({
                amount: total,
                purchaser: userEmail
            });

            // Actualizar carrito solo con productos fallidos
            await this.dao.updateCart(cartId, failedProducts);

            return {
                success: true,
                ticket,
                failedProducts
            };
        }

        return {
            success: false,
            failedProducts
        };
    }
}
