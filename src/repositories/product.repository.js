import ProductDTO from "../dto/product.dto.js";

export default class ProductRepository {
  constructor(dao) {
    this.dao = dao;
  }

  async getAll(options = {}) {
    const result = await this.dao.getAll(options);
    return {
      ...result,
      docs: result.docs.map((product) => new ProductDTO(product)),
    };
  }

  async getById(id) {
    const product = await this.dao.getById(id);
    return product ? new ProductDTO(product) : null;
  }

  async create(productData) {
    const product = await this.dao.create(productData);
    return new ProductDTO(product);
  }

  async update(id, productData) {
    const updatedProduct = await this.dao.update(id, productData);
    return updatedProduct ? new ProductDTO(updatedProduct) : null;
  }

  async delete(id) {
    return await this.dao.delete(id);
  }

  async update(id, productData) {
    const updatedProduct = await this.dao.update(id, productData);
    return updatedProduct ? new ProductDTO(updatedProduct) : null;
  }
}
