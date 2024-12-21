import UserDTO from "../dto/user.dto.js";

export default class UserRepository {
  constructor(dao) {
    this.dao = dao;
  }

  async getById(id) {
    const user = await this.dao.getById(id);
    return user ? new UserDTO(user) : null;
  }

  async getByEmail(email) {
    const user = await this.dao.getByEmail(email);
    return user ? new UserDTO(user) : null;
  }

  async create(userData) {
    const user = await this.dao.create(userData);
    return new UserDTO(user);
  }

  async update(id, userData) {
    const updatedUser = await this.dao.update(id, userData);
    return updatedUser ? new UserDTO(updatedUser) : null;
  }

  async delete(id) {
    return await this.dao.delete(id);
  }
}
