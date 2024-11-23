// passport.config.js
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import UserModel from '../models/user.model.js'; // Ajusta según tu estructura
import { createHash } from '../utils/hashbcryp.js'; // Asegúrate de tener esta función

const initializePassport = () => {
    passport.use("register", new LocalStrategy({
        passReqToCallback: true,
        usernameField: "email"
    }, async (req, username, password, done) => {
        const { first_name, last_name, email, age } = req.body;

        try {
            let user = await UserModel.findOne({ email });
            if (user) return done(null, false); // Si el usuario ya existe

            let newUser = new UserModel({
                first_name,
                last_name,
                email,
                age,
                password: createHash(password) // Hashea la contraseña
            });

            let result = await newUser.save(); // Guarda el nuevo usuario
            return done(null, result); // Devuelve el usuario creado
        } catch (error) {
            return done(error);
        }
    }));

    passport.serializeUser((user, done) => {
        done(null, user._id); // Usa _id para MongoDB
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await UserModel.findById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });
};

export default initializePassport; // Asegúrate de que esta línea esté presente
