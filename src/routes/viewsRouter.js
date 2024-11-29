import express from "express";
import ProductManager from "../dao/managersDB/productManager.js";
import ProductFileManager from "../dao/managersFS/productManager.js";
import CartManager from "../dao/managersDB/cartManager.js";
import CartFileManager from "../dao/managersFS/cartManager.js";
import { isAuthenticated, redirectIfLoggedIn } from "../middlewares/auth.middleware.js";

const viewsRouter = (
  useMongoDBForProducts = true,
  useMongoDBForCarts = true
) => {
  const router = express.Router();

  const productManager = useMongoDBForProducts
    ? new ProductManager()
    : new ProductFileManager();
  const cartManager = useMongoDBForCarts
    ? new CartManager()
    : new CartFileManager();

  // Rutas públicas
  router.get("/", (req, res) => {
    try {
      res.render("index");
    } catch (error) {
      console.error("Error al renderizar la página de inicio:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor al cargar la página de inicio",
        error: error.message
      });
    }
  });

  router.get("/login", redirectIfLoggedIn, (req, res) => {
    try {
      const error = req.query.error;
      res.render("login", { error });
    } catch (error) {
      console.error("Error al renderizar la página de login:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor al cargar la página de login",
        error: error.message
      });
    }
  });

  router.get("/register", redirectIfLoggedIn, (req, res) => {
    try {
      const error = req.query.error;
      res.render("register", { error });
    } catch (error) {
      console.error("Error al renderizar la página de registro:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor al cargar la página de registro",
        error: error.message
      });
    }
  });

  // Rutas protegidas
  router.get("/products", isAuthenticated, async (req, res) => {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const sort = req.query.sort;
    const status = req.query.status;
    const category = req.query.category;
    const query = req.query.query;

    try {
      let products = await productManager.getAllProducts();

      if (sort === "asc") {
        products.sort((a, b) => a.price - b.price);
      } else if (sort === "desc") {
        products.sort((a, b) => b.price - a.price);
      }

      if (status === "true") {
        products = products.filter((product) => product.status === true);
      } else if (status === "false") {
        products = products.filter((product) => product.status === false);
      }

      if (category) {
        products = products.filter((product) => product.category === category);
      }

      if (query) {
        products = products.filter((product) => {
          return (
            product.title.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase()) ||
            product.category.toLowerCase().includes(query.toLowerCase()) ||
            product.price.toString().includes(query)
          );
        });
      }

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      const paginatedProducts = products
        .slice(startIndex, endIndex)
        .map((product) => {
          return {
            id: product._id.toString(),
            title: product.title,
            description: product.description,
            code: product.code,
            price: product.price,
            stock: product.stock,
            category: product.category,
          };
        });

      const categories = [...new Set(products.map(product => product.category))];
      const totalPages = Math.ceil(products.length / limit);

      res.render("product", {
        products: paginatedProducts,
        page,
        limit,
        totalPages,
        sort,
        status,
        category,
        query,
        categories,
        user: req.session.user,
        session: req.session
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al obtener productos" });
    }
  });

  router.get("/products/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id;
      const product = await productManager.getProductById(id);
      if (!product) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }

      const productDetails = {
        id: product._id.toString(),
        title: product.title,
        description: product.description,
        code: product.code,
        price: product.price,
        stock: product.stock,
        category: product.category,
      };

      const backUrl = req.headers.referer;
      res.render("product-details", { product: productDetails, backUrl });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al obtener producto" });
    }
  });

  router.get("/carts/:cid", isAuthenticated, async (req, res) => {
    try {
      const cartId = req.params.cid;
      const cart = await cartManager.getCart(cartId);

      if (!cart) {
        return res.status(404).json({ message: "Carrito no encontrado" });
      }

      const products = cart.products.map((product) => ({
        id: product.product._id.toString(),
        title: product.product.title,
        description: product.product.description,
        code: product.product.code,
        price: product.product.price,
        stock: product.product.stock,
        category: product.product.category,
        quantity: product.quantity,
      }));

      res.render("cart-details", { cart, products });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al obtener carrito" });
    }
  });

  router.get("/realtimeproducts", isAuthenticated, async (req, res) => {
    await renderProductsView(req, res, "realTimeProducts");
  });

  router.get("/profile", isAuthenticated, (req, res) => {
    if(!req.session.login) {
      return res.redirect("/login"); 
    }
    res.render("profile", {user: req.session.user}); 
  });

  const renderProductsView = async (req, res, viewName, page = 1, limit = 10) => {
    try {
      let products = await productManager.getAllProducts();
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      const paginatedProducts = products
        .slice(startIndex, endIndex)
        .map((product) => {
          return {
            id: product._id.toString(),
            title: product.title,
            description: product.description,
            code: product.code,
            price: product.price,
            stock: product.stock,
            category: product.category,
          };
        });

      const totalPages = Math.ceil(products.length / limit);
      res.render(viewName, {
        products: paginatedProducts,
        page,
        limit,
        totalPages,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al obtener productos" });
    }
  };

  return router;
};

export default viewsRouter;
