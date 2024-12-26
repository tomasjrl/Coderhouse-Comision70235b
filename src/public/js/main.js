let socket;
if (typeof io !== "undefined") {
  socket = io();

  socket.on("products", (products) => {
    updateProductList(products);
  });

  socket.on("error", (error) => {
    console.error("Error del servidor:", error);
    alert("Error: " + error.message);
  });
}

function updateProductList(products) {
  const productList = document.querySelector("#productList");
  if (!productList) return;

  productList.innerHTML = "";
  products.forEach((product) => {
    const productElement = createProductElement(product);
    productList.appendChild(productElement);
  });
}

function createProductElement(product) {
  const div = document.createElement("div");
  div.className = "col-md-4 mb-4";
  div.innerHTML = `
        <div class="card h-100">
            <div class="card-body">
                <h5 class="card-title">${product.title}</h5>
                <p class="card-text">${product.description}</p>
                <p class="card-text"><strong>Precio:</strong> $${product.price}</p>
                <p class="card-text"><strong>Stock:</strong> ${product.stock}</p>
                <p class="card-text"><strong>Categoría:</strong> ${product.category}</p>
                <div class="d-grid gap-2">
                    <a href="/products/${product._id}" class="btn btn-info">Ver detalles</a>
                    <button class="btn btn-primary add-to-cart" data-product-id="${product._id}">
                        Agregar al carrito
                    </button>
                </div>
            </div>
        </div>
    `;
  return div;
}

window.clearCart = async function (cartId) {
  if (!cartId) {
    console.error("Error: No se proporcionó el ID del carrito");
    return;
  }

  try {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Se eliminarán todos los productos del carrito",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, vaciar carrito",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      const response = await fetch(`/api/carts/${cartId}/clear`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al vaciar el carrito");
      }

      await Swal.fire(
        "¡Carrito vaciado!",
        "Tu carrito ha sido vaciado exitosamente",
        "success"
      );

      window.location.reload();
    }
  } catch (error) {
    console.error("Error:", error);
    Swal.fire(
      "Error",
      error.message || "No se pudo vaciar el carrito",
      "error"
    );
  }
};

window.finalizePurchase = async function (cartId) {
  if (!cartId) {
    console.error("Error: No se proporcionó el ID del carrito");
    return;
  }

  try {
    const result = await Swal.fire({
      title: "¿Confirmar compra?",
      text: "¿Deseas concretar la compra de todos los productos en el carrito?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sí, concretar compra",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      const response = await fetch(`/api/carts/${cartId}/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al procesar la compra");
      }

      if (data.status === "success" && data.data && data.data.ticket) {
        // Compra exitosa
        let message = `¡Compra exitosa!<br>Ticket: ${data.data.ticket.code}<br>Total: $${data.data.ticket.amount}`;
        
        if (data.data.failedProducts && data.data.failedProducts.length > 0) {
          message += '<br><br>Algunos productos no pudieron ser comprados por falta de stock:';
          message += '<ul>';
          data.data.failedProducts.forEach(item => {
            message += `<li>${item.product.title} (${item.quantity} unidades)</li>`;
          });
          message += '</ul>';
        }

        await Swal.fire({
          title: "¡Compra Realizada!",
          html: message,
          icon: "success",
          confirmButtonText: "Aceptar"
        });

        window.location.reload();
      } else {
        throw new Error("Error al procesar la compra: Respuesta inválida del servidor");
      }
    }
  } catch (error) {
    console.error("Error en la compra:", error);
    await Swal.fire({
      title: "Error",
      text: error.message || "No se pudo procesar la compra",
      icon: "error",
      confirmButtonText: "Aceptar"
    });
  }
};

document.addEventListener("DOMContentLoaded", function () {
  const productForm = document.getElementById("productForm");
  if (productForm) {
    productForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(productForm);
      const productData = {};
      formData.forEach((value, key) => {
        productData[key] = value;
      });

      try {
        const response = await fetch("/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
        });

        if (response.ok) {
          alert("Producto agregado exitosamente");
          productForm.reset();
          if (socket) {
            socket.emit("getProducts");
          }
        } else {
          throw new Error("Error al agregar producto");
        }
      } catch (error) {
        alert("Error al agregar el producto");
        console.error("Error:", error);
      }
    });
  }

  const addToCartButtons = document.querySelectorAll(".add-to-cart");
  addToCartButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      const productId = button.getAttribute("data-product-id");
      await addToCart(productId);
    });
  });

  async function addToCart(productId) {
    try {
      const button = event.target;
      const originalText = button.innerText;
      button.disabled = true;
      button.innerText = "Agregando...";

      const response = await fetch(
        `/api/carts/${cartId}/product/${productId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al agregar al carrito");
      }

      button.classList.remove("btn-primary");
      button.classList.add("btn-success");
      button.innerText = "¡Agregado!";

      setTimeout(() => {
        button.disabled = false;
        button.classList.remove("btn-success");
        button.classList.add("btn-primary");
        button.innerText = originalText;
      }, 2000);
    } catch (error) {
      console.error("Error:", error);
      const button = event.target;
      button.disabled = false;
      button.classList.remove("btn-primary");
      button.classList.add("btn-danger");
      button.innerText = "Error al agregar";

      setTimeout(() => {
        button.classList.remove("btn-danger");
        button.classList.add("btn-primary");
        button.innerText = "Agregar al carrito";
      }, 2000);
    }
  }
});
