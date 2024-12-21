import config from "../config/config.js";

let userDao;
let productDao;
let cartDao;

switch (config.persistence) {
  case "MONGO":
    const { default: UserManager } = await import(
      "./managersDB/userManager.js"
    );
    const { default: ProductManager } = await import(
      "./managersDB/productManager.js"
    );
    const { default: CartManager } = await import(
      "./managersDB/cartManager.js"
    );

    userDao = new UserManager();
    productDao = new ProductManager();
    cartDao = new CartManager();
    break;

  case "FILE":
    const { default: UserFileManager } = await import(
      "./managersFS/userManager.js"
    );
    const { default: ProductFileManager } = await import(
      "./managersFS/productManager.js"
    );
    const { default: CartFileManager } = await import(
      "./managersFS/cartManager.js"
    );

    userDao = new UserFileManager();
    productDao = new ProductFileManager();
    cartDao = new CartFileManager();
    break;

  default:
    throw new Error("Persistence method not supported");
}

export const getUserDAO = () => userDao;
export const getProductDAO = () => productDao;
export const getCartDAO = () => cartDao;
