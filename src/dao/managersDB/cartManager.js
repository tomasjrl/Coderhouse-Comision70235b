import Cart from '../../models/cart.model.js';

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
            return await Cart.findById(cartId)
                .populate('products.product')
                .lean();
        } catch (error) {
            throw error;
        }
    }

    async addProduct(cartId, productId, quantity = 1) {
        try {
            const cart = await Cart.findOne({ _id: cartId });
            if (!cart) {
                throw new Error('Carrito no encontrado');
            }

            // Find if the product already exists in the cart
            const existingProduct = cart.products.find(
                item => item.product._id.toString() === productId || // For populated products
                       item.product.toString() === productId        // For non-populated products
            );

            if (existingProduct) {
                // Update quantity if product exists
                existingProduct.quantity += quantity;
            } else {
                // Add new product if it doesn't exist
                cart.products.push({ product: productId, quantity });
            }

            await cart.save();
            return (await cart.populate('products.product')).toObject();
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
            const cart = await Cart.findByIdAndUpdate(
                cartId,
                { $set: { products } },
                { new: true }
            ).lean();
            return cart;
        } catch (error) {
            throw error;
        }
    }

    async clearCart(cartId) {
        try {
            const cart = await Cart.findByIdAndUpdate(
                cartId,
                { $set: { products: [] } },
                { new: true }
            ).lean();
            return cart;
        } catch (error) {
            throw error;
        }
    }
}

export default CartManager;
