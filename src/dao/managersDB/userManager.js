import User from "../../models/user.model.js";

export default class UserManager {
  async getById(id) {
    try {
      return await User.findById(id).lean();
    } catch (error) {
      throw error;
    }
  }

  async getByEmail(email) {
    try {
      return await User.findOne({ email }).lean();
    } catch (error) {
      throw error;
    }
  }

  async create(userData) {
    try {
      return await User.create(userData);
    } catch (error) {
      throw error;
    }
  }

  async update(id, userData) {
    try {
      return await User.findByIdAndUpdate(
        id,
        { $set: userData },
        { new: true }
      ).lean();
    } catch (error) {
      throw error;
    }
  }

  async delete(id) {
    try {
      return await User.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  }
}
