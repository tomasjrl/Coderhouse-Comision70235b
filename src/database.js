import mongoose from "mongoose";

mongoose.connect("mongodb+srv://usermongo:8wGHTRdShb2nNJU5@coder-cluster.fptla.mongodb.net/ecommerce?retryWrites=true&w=majority&appName=Coder-Cluster")
    .then(() => console.log("Conexion Exitosa!"))
    .catch((error) => console.log("Error al conectar", error))