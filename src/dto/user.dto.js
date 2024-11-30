export default class UserDTO {
    constructor(user) {
        this.id = user._id;
        this.fullName = `${user.first_name} ${user.last_name}`;
        this.first_name = user.first_name;
        this.last_name = user.last_name;
        this.email = user.email;
        this.password = user.password; // Necesario para la autenticación
        this.role = user.role;
        this.cart = user.cart;
        this.last_connection = user.last_connection;
    }

    // Método para obtener una versión segura del usuario (sin password)
    toSafeObject() {
        const safeUser = { ...this };
        delete safeUser.password;
        return safeUser;
    }
}
