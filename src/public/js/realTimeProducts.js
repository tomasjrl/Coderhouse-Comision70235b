document.addEventListener("DOMContentLoaded", () => {
  const socket = io();
  const productForm = document.getElementById("productForm");
  const productsList = document.getElementById("productsList");

  productForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const code = document.getElementById("code").value;
    const price = document.getElementById("price").value;
    const stock = document.getElementById("stock").value;
    const category = document.getElementById("category").value;
    const status = document.getElementById("status").value === "true";

    const addProduct = {
      title,
      description,
      code,
      price,
      stock,
      category,
      status,
    };

    socket.emit("addProduct", addProduct);

    productForm.reset();
  });

  productsList.addEventListener("click", (event) => {
    if (event.target.classList.contains("submit-btn-delete")) {
      const productId = event.target.getAttribute("data-id");
      socket.emit("deleteProduct", productId);
    }
  });

  socket.on("products", (products) => {
    productsList.innerHTML = "";
    products.forEach((product) => {
      const productItem = document.createElement("li");
      productItem.className = "product";
      productItem.setAttribute("id", `product-${product._id}`);
      productItem.innerHTML = `
        <h2>${product.title}</h2>
        <h3>Descripción</h3>
        <p>${product.description}</p>
        <h3>Código: ${product.code}</h3>
        <h3>Precio: $${product.price}</h3> 
        <h3>Stock: ${product.stock}</h3> 
        <h3>Categoría:</h3> 
        <p>${product.category}</p>
        <button type="button" class="submit-btn-delete" data-id="${product._id}">Eliminar</button>
      `;
      productsList.appendChild(productItem);
    });
  });

  socket.emit("getProducts");
});
