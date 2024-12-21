import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../../.env"),
});

const persistenceType = process.env.PERSISTENCE || "MONGO";
const useMongoForProducts = process.env.USE_MONGODB_FOR_PRODUCTS === "true";
const useMongoForCarts = process.env.USE_MONGODB_FOR_CARTS === "true";

export const createManagers = async () => {
  let productManager;
  let cartManager;
  let userManager;

  switch (persistenceType.toUpperCase()) {
    case "MONGO":
      const { default: ProductManagerMongo } = await import(
        "../dao/managersDB/productManager.js"
      );
      const { default: CartManagerMongo } = await import(
        "../dao/managersDB/cartManager.js"
      );
      const { default: UserManagerMongo } = await import(
        "../dao/managersDB/userManager.js"
      );

      productManager = useMongoForProducts
        ? new ProductManagerMongo()
        : (await import("../dao/managersFS/productManager.js")).default;
      cartManager = useMongoForCarts
        ? new CartManagerMongo()
        : (await import("../dao/managersFS/cartManager.js")).default;
      userManager = new UserManagerMongo();
      break;

    case "FILE":
      const { default: ProductManagerFile } = await import(
        "../dao/managersFS/productManager.js"
      );
      const { default: CartManagerFile } = await import(
        "../dao/managersFS/cartManager.js"
      );
      const { default: UserManagerFile } = await import(
        "../dao/managersFS/userManager.js"
      );

      productManager = new ProductManagerFile();
      cartManager = new CartManagerFile();
      userManager = new UserManagerFile();
      break;

    default:
      throw new Error(`Tipo de persistencia no soportado: ${persistenceType}`);
  }

  return {
    productManager,
    cartManager,
    userManager,
  };
};

export const getPersistenceConfig = () => ({
  type: persistenceType,
  useMongoForProducts,
  useMongoForCarts,
  mongoUri: process.env.MONGODB_URI,
});
