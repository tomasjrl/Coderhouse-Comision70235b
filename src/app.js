import express from "express";
import handlebars from "express-handlebars";
import http from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname } from "path";
import viewsRouter from "./routes/viewsRouter.js";
import cartRouter, { initializeCartRouter } from "./routes/cartRouter.js";
import productRouter from "./routes/productRouter.js";
import ProductManager from "./dao/managersDB/productManager.js";
import ProductFileManager from "./dao/managersFS/productManager.js";
import CartManager from "./dao/managersDB/cartManager.js";
import CartFileManager from "./dao/managersFS/cartManager.js";
import helpers from "./utils/helpersHandlebars.js";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import session from "express-session";
import FileStore from "session-file-store";
import MongoStore from "connect-mongo";

const fileStore = FileStore(session);
const app = express();
const PORT = process.env.PORT || 8080;
const server = http.createServer(app);
const io = new Server(server);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const newHelpers = { ...helpers };
newHelpers.isSelected = function (value, sort) {
  return value === sort ? "selected" : "";
};

app.engine("handlebars", handlebars.engine({ helpers: newHelpers }));
app.set("views", __dirname + "/views");
app.set("view engine", "handlebars");
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: "secretCoder", //valor para firmar la cookie
  resave: true,
  saveUninitialized: true,

  // store: new fileStore({path: "./src/sessions", ttl: 100, retries: 1}),

  store: MongoStore.create({
    mongoUrl: "mongodb+srv://usermongo:8wGHTRdShb2nNJU5@coder-cluster.fptla.mongodb.net/ecommerce?retryWrites=true&w=majority&appName=Coder-Cluster", ttl: 100
  })

}))

process.env.USE_MONGODB_FOR_PRODUCTS = "true";
process.env.USE_MONGODB_FOR_CARTS = "true"; 
process.env.MONGODB_URI =
  "mongodb+srv://usermongo:8wGHTRdShb2nNJU5@coder-cluster.fptla.mongodb.net/ecommerce?retryWrites=true&w=majority&appName=Coder-Cluster";

const DB_URL = process.env.MONGODB_URI;

async function connectToDatabase() {
  try {
    await mongoose.connect(DB_URL);
    console.log("Conectado con MongoDB");
  } catch (error) {
    console.error("Error al conectar con MongoDB:", error);
    process.exit(1);
  }
}

const useMongoDBForProducts = process.env.USE_MONGODB_FOR_PRODUCTS === "true";
const useMongoDBForCarts = process.env.USE_MONGODB_FOR_CARTS === "true";

let productManager;
let cartManager;

if (useMongoDBForProducts) {
  productManager = new ProductManager();
} else {
  productManager = new ProductFileManager();
}

if (useMongoDBForCarts) {
  cartManager = new CartManager();
} else {
  cartManager = new CartFileManager();
}

connectToDatabase()
  .then(() => {
    initializeCartRouter(useMongoDBForCarts);

    io.on("connection", async (socket) => {
      console.log("Un cliente se ha conectado a socket (realtimeproducts)");

      const products = await productManager.getAllProducts();
      socket.emit("products", products);

      socket.on("getProducts", async () => {
        const products = await productManager.getAllProducts();
        socket.emit("products", products);
      });

      socket.on("addProduct", async (product) => {
        await productManager.addProduct(product);
        const products = await productManager.getAllProducts();
        io.emit("products", products); 
      });

      socket.on("deleteProduct", async (productId) => {
        await productManager.deleteProduct(productId);
        const products = await productManager.getAllProducts();
        io.emit("products", products); 
      });

      socket.on("disconnect", () => {
        console.log(
          "Un cliente se ha desconectado de socket (realtimeproducts)"
        );
      });
    });

    app.use("/", viewsRouter(useMongoDBForProducts, useMongoDBForCarts));
    app.use("/api/products", productRouter(useMongoDBForProducts));
    app.use("/api/carts", cartRouter);
    app.use(
      "/realtimeproducts",
      viewsRouter(useMongoDBForProducts, useMongoDBForCarts)
    );

app.get("/login", (req, res) => {
  let usuario = req.query.usuario;

  req.session.usuario = usuario;
  res.send("Guardamos usuario por medio de query");
})

app.get("/usuario", (req,res) => {
  if(req.session.usuario) {
    return res.send(`El usuario esta registrado, su nombre es el siguiente: ${req.session.usuario}`);
  }
  res.send("No tenemos un usuario registrado.")
})

    server.listen(PORT, () => {
      console.log(`Servidor escuchando en PORT ${PORT}`);
      console.log(
        `Puedes acceder con el link: http://localhost:${PORT}/products`
      );
    });
  })
  .catch((err) => console.error("Error al conectar a la base de datos:", err));
