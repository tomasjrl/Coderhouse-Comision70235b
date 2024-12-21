async function checkAuthStatus() {
  try {
    const response = await fetch("/api/sessions/current", {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("No autorizado");
    }

    const data = await response.json();
    return data.payload.user;
  } catch (error) {
    console.error("Error al verificar autenticación:", error);
    return null;
  }
}

async function logout() {
  try {
    const response = await fetch("/api/sessions/logout", {
      method: "POST",
      credentials: "include",
    });

    console.log("Respuesta del servidor:", response.status);

    localStorage.removeItem("user");
    sessionStorage.clear();

    window.location.href = "/login";
  } catch (error) {
    console.error("Error durante el logout:", error);
    window.location.href = "/login";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const logoutButtons = document.querySelectorAll(
    "#logout-button, #navbar-logout-button"
  );
  logoutButtons.forEach((button) => {
    if (button) {
      button.addEventListener("click", logout);
    }
  });
});
