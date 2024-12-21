import passport from "passport";
import local from "passport-local";
import jwt from "passport-jwt";
import bcrypt from "bcrypt";
import { userRepository, cartRepository } from "../repositories/index.js";
import config from "./config.js";

const LocalStrategy = local.Strategy;
const JWTStrategy = jwt.Strategy;
const ExtractJWT = jwt.ExtractJwt;

const initializePassport = () => {
  passport.use(
    "register",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true,
      },
      async (req, email, password, done) => {
        try {
          const existingUser = await userRepository.getByEmail(email);
          if (existingUser) {
            return done(null, false, {
              message: "El correo electrónico ya está registrado",
            });
          }

          const hashedPassword = await bcrypt.hash(password, 10);
          const cart = await cartRepository.create();

          const userData = {
            ...req.body,
            password: hashedPassword,
            cart: cart.id,
          };

          const newUser = await userRepository.create(userData);
          done(null, newUser);
        } catch (error) {
          done(error);
        }
      }
    )
  );

  passport.use(
    "login",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await userRepository.getByEmail(email);

          if (!user) {
            return done(null, false, {
              message: "Usuario no encontrado",
            });
          }

          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            return done(null, false, {
              message: "Contraseña incorrecta",
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.use(
    "jwt",
    new JWTStrategy(
      {
        jwtFromRequest: ExtractJWT.fromExtractors([
          ExtractJWT.fromAuthHeaderAsBearerToken(),
          (req) => req.cookies.jwt,
        ]),
        secretOrKey: config.jwt.secret,
      },
      async (jwtPayload, done) => {
        try {
          const user = await userRepository.getById(jwtPayload.id);
          if (!user) {
            return done(null, false, {
              message: "No se encontró el usuario asociado al token",
            });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await userRepository.getById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
};

export default initializePassport;
