import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export default class UserFileManager {
  constructor() {
    this.path = path.join(process.cwd(), "data", "users.json");
    this.initializeFile();
  }

  async initializeFile() {
    try {
      await fs.access(this.path);
    } catch {
      await fs.mkdir(path.dirname(this.path), { recursive: true });
      await fs.writeFile(this.path, "[]");
    }
  }

  async getAll() {
    const data = await fs.readFile(this.path, "utf-8");
    return JSON.parse(data);
  }

  async getById(id) {
    const users = await this.getAll();
    return users.find((user) => user.id === id);
  }

  async getByEmail(email) {
    const users = await this.getAll();
    return users.find((user) => user.email === email);
  }

  async create(userData) {
    const users = await this.getAll();
    const newUser = {
      id: uuidv4(),
      ...userData,
      createdAt: new Date(),
    };
    users.push(newUser);
    await fs.writeFile(this.path, JSON.stringify(users, null, 2));
    return newUser;
  }

  async update(id, userData) {
    const users = await this.getAll();
    const index = users.findIndex((user) => user.id === id);
    if (index === -1) return null;

    users[index] = {
      ...users[index],
      ...userData,
      updatedAt: new Date(),
    };

    await fs.writeFile(this.path, JSON.stringify(users, null, 2));
    return users[index];
  }

  async delete(id) {
    const users = await this.getAll();
    const index = users.findIndex((user) => user.id === id);
    if (index === -1) return null;

    const deletedUser = users.splice(index, 1)[0];
    await fs.writeFile(this.path, JSON.stringify(users, null, 2));
    return deletedUser;
  }
}
