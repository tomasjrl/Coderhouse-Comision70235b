import dotenv from "dotenv";
import fs from "fs";

const envFilePath = fs.existsSync(".env") ? ".env" : ".example.env";
dotenv.config({ path: envFilePath });
console.log(`Loaded environment variables from: ${envFilePath}`);

export const config = {
  server: {
    port: process.env.PORT || 8080,
    nodeEnv: process.env.NODE_ENV || "development",
  },
  database: {
    mongoUri: process.env.MONGODB_URI,
  },
  session: {
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  },
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
  features: {
    useMongoDBForProducts: process.env.USE_MONGODB_FOR_PRODUCTS === "true",
    useMongoDBForCarts: process.env.USE_MONGODB_FOR_CARTS === "true",
  },
  email: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
    service: process.env.EMAIL_SERVICE,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    resetPasswordExpiry:
      parseInt(process.env.JWT_RESET_PASSWORD_EXPIRY) || 3600,
  },
  persistence: process.env.PERSISTENCE || "MONGO",
};

export default config;
