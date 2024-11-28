// passport.config.js
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JWTStrategy, ExtractJwt } from 'passport-jwt';
import UserModel from '../models/user.model.js'; 
import { createHash, isValidPassword } from '../utils/hashbcryp.js'; 

const JWT_SECRET = 'your-secret-key'; 

const initializePassport = () => {
    // JWT Strategy
    passport.use('jwt', new JWTStrategy({
        jwtFromRequest: ExtractJwt.fromExtractors([
            ExtractJwt.fromAuthHeaderAsBearerToken(),
            (req) => {
                let token = null;
                if (req && req.cookies) {
                    token = req.cookies['coderCookie'];
                }
                return token;
            }
        ]),
        secretOrKey: JWT_SECRET
    }, async (jwt_payload, done) => {
        try {
            const user = await UserModel.findById(jwt_payload.sub);
            if (!user) {
                return done(null, false, { message: 'Usuario no encontrado' });
            }
            return done(null, user);
        } catch (error) {
            return done(error, false);
        }
    }));

    // Local Strategy - Register
    passport.use("register", new LocalStrategy({
        passReqToCallback: true,
        usernameField: "email"
    }, async (req, username, password, done) => {
        const { first_name, last_name, email, age } = req.body;

        try {
            let user = await UserModel.findOne({ email });
            if (user) {
                return done(null, false, { message: 'El correo electrónico ya está registrado' });
            }

            let newUser = new UserModel({
                first_name,
                last_name,
                email,
                age,
                password: createHash(password) 
            });

            let result = await newUser.save(); 
            return done(null, result); 
        } catch (error) {
            return done(error);
        }
    }));

    // Local Strategy - Login
    passport.use('login', new LocalStrategy({
        usernameField: 'email'
    }, async (email, password, done) => {
        try {
            const user = await UserModel.findOne({ email });
            
            if (!user) {
                return done(null, false, { message: 'Usuario no encontrado' });
            }

            if (!isValidPassword(password, user)) {
                return done(null, false, { message: 'Contraseña incorrecta' });
            }

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }));

    passport.serializeUser((user, done) => {
        done(null, user._id); 
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

export { JWT_SECRET };
export default initializePassport; 
