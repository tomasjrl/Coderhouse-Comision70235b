export default class UserDTO {
  constructor(user) {
    this.id = user._id;
    this.fullName = `${user.first_name} ${user.last_name}`;
    this.first_name = user.first_name;
    this.last_name = user.last_name;
    this.email = user.email;
    this.password = user.password;
    this.role = user.role;
    this.cart = user.cart;
    this.last_connection = user.last_connection;
  }

  toSafeObject() {
    const safeUser = { ...this };
    delete safeUser.password;
    return safeUser;
  }
}
