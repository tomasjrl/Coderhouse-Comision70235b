import { getUserDAO, getProductDAO, getCartDAO } from "../dao/factory.js";
import UserRepository from "./user.repository.js";
import ProductRepository from "./product.repository.js";
import CartRepository from "./cart.repository.js";

export const userRepository = new UserRepository(getUserDAO());
export const productRepository = new ProductRepository(getProductDAO());
export const cartRepository = new CartRepository(getCartDAO());
