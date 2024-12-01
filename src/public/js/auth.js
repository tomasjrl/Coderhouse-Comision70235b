// Función para verificar el estado de autenticación
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/sessions/current', {
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Si no está autenticado, redirigir al login
                window.location.href = '/login';
                return;
            }
            throw new Error('Error al verificar autenticación');
        }

        const data = await response.json();
        return data.user;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// Función para cerrar sesión
async function logout() {
    try {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "¿Deseas cerrar la sesión?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, cerrar sesión',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            // Mostrar loading
            Swal.fire({
                title: 'Cerrando sesión...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const response = await fetch('/api/sessions/logout', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                // Limpiar cualquier dato de sesión en el cliente
                localStorage.removeItem('user');
                sessionStorage.clear();
                
                // Mostrar mensaje de éxito
                await Swal.fire({
                    icon: 'success',
                    title: '¡Sesión cerrada!',
                    text: 'Has cerrado sesión correctamente.',
                    timer: 1500,
                    showConfirmButton: false
                });

                // Redirigir al login
                window.location.href = data.redirectUrl || '/login';
            } else {
                throw new Error(data.message || 'Error al cerrar sesión');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'No se pudo cerrar la sesión. Por favor, intente nuevamente.'
        });
    }
}

// Manejador para el botón de logout
document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.querySelector('#logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            await logout();
        });
    }
});
