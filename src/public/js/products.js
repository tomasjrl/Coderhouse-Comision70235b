document.addEventListener("DOMContentLoaded", function () {
  const addToCartBtns = document.querySelectorAll(".btn-primary");

  fetch("/api/carts")
    .then((response) => response.json())
    .then((data) => {
      const cartId = data.cartId;

      addToCartBtns.forEach((btn) => {
        btn.addEventListener("click", function () {
          const productId = this.getAttribute("data-product-id");
          fetch(`/api/carts/${cartId}/products/${productId}`, {
            method: "POST",
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error("Error al agregar producto al carrito");
              }
              return response.json();
            })
            .then((data) => {
              console.log("Respuesta del servidor:", data);
              alert("Producto agregado al carrito");
            })
            .catch((error) => {
              console.error("Error al agregar producto al carrito:", error);
            });
        });
      });
    })
    .catch((error) => console.error(error));
});
