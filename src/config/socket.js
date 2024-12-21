import { Server } from "socket.io";
import { productRepository } from "../repositories/index.js";

let io;

export const initializeSocket = (server) => {
  io = new Server(server);

  io.on("connection", async (socket) => {
    console.log("Cliente conectado");

    const products = await productRepository.getAll();
    socket.emit("productos", products);

    socket.on("eliminarProducto", async (id) => {
      try {
        await productRepository.delete(id);
        const updatedProducts = await productRepository.getAll();
        io.emit("productos", updatedProducts);
      } catch (error) {
        console.error("Error al eliminar producto:", error);
      }
    });

    socket.on("agregarProducto", async (producto) => {
      try {
        await productRepository.create(producto);
        const updatedProducts = await productRepository.getAll();
        io.emit("productos", updatedProducts);
      } catch (error) {
        console.error("Error al agregar producto:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("Cliente desconectado");
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
