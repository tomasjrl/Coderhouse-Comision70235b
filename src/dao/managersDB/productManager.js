import Product from "../../models/product.model.js";

class ProductManager {
  async getAll({ filter = {}, sort = {}, page = 1, limit = 10 } = {}) {
    try {
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sort,
        lean: true,
      };

      if (typeof Product.paginate === "function") {
        const result = await Product.paginate(filter, options);
        return result;
      } else {
        let query = Product.find(filter).lean();

        if (sort && Object.keys(sort).length > 0) {
          query = query.sort(sort);
        }

        const totalDocs = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalDocs / limit);
        const skip = (page - 1) * limit;

        const docs = await query.skip(skip).limit(limit);

        return {
          docs,
          totalDocs,
          limit,
          totalPages,
          page,
          hasPrevPage: page > 1,
          hasNextPage: page < totalPages,
          prevPage: page > 1 ? page - 1 : null,
          nextPage: page < totalPages ? page + 1 : null,
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async getById(id) {
    try {
      return await Product.findById(id).lean();
    } catch (error) {
      throw error;
    }
  }

  async create(productData) {
    try {
      const product = new Product(productData);
      await product.save();
      return product.toObject();
    } catch (error) {
      throw error;
    }
  }

  async update(id, productData) {
    try {
      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { $set: productData },
        { new: true }
      ).lean();
      return updatedProduct;
    } catch (error) {
      throw error;
    }
  }

  async delete(id) {
    try {
      return await Product.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  }
}

export default ProductManager;
