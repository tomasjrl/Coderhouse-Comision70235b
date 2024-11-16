fetch('/api/carts')
  .then(response => response.json())
  .then(data => {
    const cartId = data.cartId;
    const cartLink = document.querySelector('a#carrito');
    
    if (cartId) {
      cartLink.href = `/carts/${cartId}`;
    } else {
      cartLink.href = ``;
      cartLink.textContent = `Carrito`;
    }
  })
  .catch(error => console.error(error));