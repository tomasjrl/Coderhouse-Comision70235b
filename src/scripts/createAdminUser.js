import mongoose from "mongoose";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import { config } from "../config/config.js";

const createAdminUser = async () => {
  try {
    await mongoose.connect(config.database.mongoUri);
    console.log("Connected to database");

    const existingAdmin = await User.findOne({ email: config.admin.email });
    if (existingAdmin) {
      console.log("Admin user already exists");
      await mongoose.connection.close();
      return;
    }

    const hashedPassword = await bcrypt.hash(config.admin.password, 10);
    const adminUser = new User({
      first_name: "Admin",
      last_name: "Coder",
      email: config.admin.email,
      password: hashedPassword,
      role: "admin",
    });

    await adminUser.save();
    console.log("Admin user created successfully");
    await mongoose.connection.close();
  } catch (error) {
    console.error("Error creating admin user:", error);
    await mongoose.connection.close();
  }
};

createAdminUser();
