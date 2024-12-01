import express from 'express';
import { isAuthenticated, checkRole, checkCartOwnership, checkPurchasePermissions, ROLES } from '../middlewares/auth.js';
import { cartRepository, productRepository } from '../repositories/index.js';
import { ValidationError, NotFoundError } from '../utils/errorHandler.js';

const cartRouter = () => {
    const router = express.Router();

    router.use(isAuthenticated);
    router.use(checkRole([ROLES.USER, ROLES.PREMIUM]));

    // Crear un nuevo carrito
    router.post('/', async (req, res, next) => {
        try {
            const cart = await cartRepository.create();
            res.status(201).json({ status: 'success', data: cart });
        } catch (error) {
            next(error);
        }
    });

    // Obtener un carrito por ID
    router.get('/:cid', checkCartOwnership, async (req, res, next) => {
        try {
            const cart = await cartRepository.getById(req.params.cid);
            if (!cart) {
                throw new NotFoundError('Carrito no encontrado');
            }
            res.json({ status: 'success', data: cart });
        } catch (error) {
            next(error);
        }
    });

    // Agregar producto al carrito
    router.post('/:cid/products/:pid', 
        checkCartOwnership,
        async (req, res, next) => {
            try {
                const product = await productRepository.getById(req.params.pid);
                
                // Verificar que el usuario premium no agregue sus propios productos
                if (req.session.user.role === ROLES.PREMIUM && 
                    product.owner === req.session.user.email) {
                    throw new ValidationError('No puedes agregar tus propios productos al carrito');
                }

                const result = await cartRepository.addProduct(
                    req.params.cid,
                    req.params.pid,
                    req.body.quantity || 1
                );
                
                res.json({ status: 'success', data: result });
            } catch (error) {
                next(error);
            }
    });

    // Eliminar producto del carrito
    router.delete('/:cid/products/:pid', 
        checkCartOwnership,
        async (req, res, next) => {
            try {
                const { cid, pid } = req.params;
                const cart = await cartRepository.removeProduct(cid, pid);
                if (!cart) {
                    throw new NotFoundError('Carrito o producto no encontrado');
                }
                res.json({ status: 'success', data: cart });
            } catch (error) {
                next(error);
            }
    });

    // Actualizar carrito
    router.put('/:cid', 
        checkCartOwnership,
        async (req, res, next) => {
            try {
                const cart = await cartRepository.updateCart(req.params.cid, req.body.products);
                if (!cart) {
                    throw new NotFoundError('Carrito no encontrado');
                }
                res.json({ status: 'success', data: cart });
            } catch (error) {
                next(error);
            }
    });

    // Finalizar compra
    router.post('/:cid/purchase', 
        checkCartOwnership,
        checkPurchasePermissions,
        async (req, res, next) => {
            try {
                const cart = await cartRepository.getById(req.params.cid);
                if (!cart) {
                    throw new NotFoundError('Carrito no encontrado');
                }

                if (!cart.products || cart.products.length === 0) {
                    throw new ValidationError('El carrito está vacío');
                }

                // Verificar stock y procesar la compra
                const purchaseResult = await cartRepository.processPurchase(req.params.cid, req.session.user.email);
                
                if (purchaseResult.success) {
                    res.json({ 
                        status: 'success', 
                        message: 'Compra realizada exitosamente',
                        ticket: purchaseResult.ticket,
                        failedProducts: purchaseResult.failedProducts
                    });
                } else {
                    throw new ValidationError('No se pudo procesar la compra');
                }
            } catch (error) {
                next(error);
            }
    });

    // Vaciar carrito
    router.delete('/:cid/clear', 
        checkCartOwnership,
        async (req, res, next) => {
            try {
                const cart = await cartRepository.clearCart(req.params.cid);
                if (!cart) {
                    throw new NotFoundError('Carrito no encontrado');
                }
                res.json({ status: 'success', message: 'Carrito vaciado exitosamente' });
            } catch (error) {
                next(error);
            }
    });

    // Vaciar carrito
    router.delete('/:cid', async (req, res, next) => {
        try {
            const cart = await cartRepository.clearCart(req.params.cid);
            if (!cart) {
                throw new NotFoundError('Carrito no encontrado');
            }
            res.json({ status: 'success', data: cart });
        } catch (error) {
            next(error);
        }
    });

    return router;
};

export default cartRouter;
