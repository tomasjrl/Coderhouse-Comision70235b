import fs from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ProductFileManager {
  constructor() {
    this.path = join(__dirname, "../../../data/products.json");
    this.initializeFile();
  }

  async initializeFile() {
    try {
      await fs.access(this.path);
    } catch {
      await fs.mkdir(dirname(this.path), { recursive: true });
      await fs.writeFile(this.path, "[]");
    }
  }

  async getAll({ filter = {}, sort = {}, page = 1, limit = 10 } = {}) {
    const data = await fs.readFile(this.path, "utf-8");
    let products = JSON.parse(data);

    if (filter.title) {
      const regex = new RegExp(filter.title, "i");
      products = products.filter((p) => regex.test(p.title));
    }
    if (filter.category) {
      products = products.filter((p) => p.category === filter.category);
    }

    if (sort.price) {
      products.sort((a, b) => {
        return sort.price === "asc" ? a.price - b.price : b.price - a.price;
      });
    }

    const totalDocs = products.length;
    const totalPages = Math.ceil(totalDocs / limit);
    const skip = (page - 1) * limit;
    products = products.slice(skip, skip + limit);

    return {
      docs: products,
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

  async getById(id) {
    const products = await this.getAll();
    return products.docs.find((product) => product.id === id);
  }

  async create(productData) {
    const products = await this.getAll();
    const newProduct = {
      id: uuidv4(),
      ...productData,
      createdAt: new Date(),
    };
    products.docs.push(newProduct);
    await fs.writeFile(this.path, JSON.stringify(products.docs, null, 2));
    return newProduct;
  }

  async update(id, productData) {
    const products = await this.getAll();
    const index = products.docs.findIndex((product) => product.id === id);

    if (index === -1) return null;

    products.docs[index] = {
      ...products.docs[index],
      ...productData,
      updatedAt: new Date(),
    };

    await fs.writeFile(this.path, JSON.stringify(products.docs, null, 2));
    return products.docs[index];
  }

  async delete(id) {
    const products = await this.getAll();
    const index = products.docs.findIndex((product) => product.id === id);

    if (index === -1) return null;

    const deletedProduct = products.docs.splice(index, 1)[0];
    await fs.writeFile(this.path, JSON.stringify(products.docs, null, 2));
    return deletedProduct;
  }
}

export default ProductFileManager;
