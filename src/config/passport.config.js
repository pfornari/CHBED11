import passport from "passport";
import passportLocal from "passport-local";
import { userModel } from "../daos/models/user.model.js";
import { createHash, isValidPassword } from "../utils.js";
import GitHubStrategy from "passport-github2";
import jwtStrategy from "passport-jwt";

const localStrategy = passportLocal.Strategy;

const JwtStrategy = jwtStrategy.Strategy;
const ExtractJWT = jwtStrategy.ExtractJwt

const initializePassport = () => {
  passport.use(
    "jwt",
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor]),
        secretOrKey: "CoderhouseBackendCourseSecretKeyJWT",
      },
      async (jwt_payload, done) => {
        console.log("Entrando a passport Strategy con JWT.");
        try {
          console.log("JWT obtenido del Payload");
          console.log(jwt_payload);
          return done(null, jwt_payload.user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.use(
    "register",
    new localStrategy(
      { passReqToCallback: true, usernameField: "email" },
      async (req, username, password, done) => {
        const { first_name, last_name, email } = req.body;

        try {
          const exist = await userModel.findOne({ email });

          if (exist) {
            console.log("El usuario ya existe.");
            done(null, false);
          }

          let user = {
            first_name,
            last_name,
            email,
            password: createHash(password),
          };

          // Asignar el rol "admin" solo si las credenciales coinciden
          if (
            user.email === "adminCoder@coder.com" &&
            password === "Cod3r123"
          ) {
            user.role = "admin";
          } else {
            user.role = "user"; // Asignar un rol predeterminado si no es un administrador
          }

          const result = await userModel.create(user);

          return done(null, result);
        } catch (error) {
          return done("Error registrando al usuario" + error);
        }
      }
    )
  );

  passport.use(
    "login",
    new localStrategy(
      { passReqToCallback: true, usernameField: "email" },
      async (req, username, password, done) => {
        const { email } = req.body;

        try {
          const user = await userModel.findOne({ email: username });

          if (!user) {
            console.warn("Usuario inexistente:" + username);
            return done(null, false);
          }

          if (!isValidPassword(user, password)) {
            console.warn("Credenciales invalidas");
            return done(null, false);
          }
          return done(null, user);
        } catch (error) {
          return done("Error de login" + error);
        }
      }
    )
  );

  passport.use(
    "github",
    new GitHubStrategy(
      {
        clientID: "Iv1.1229150a8868fa77",
        clientSecret: "9d32bd5287555b114b3923b6406a6bd2862cbc7a",
        callbackUrl: "http://localhost:8080/api/sessions/githubcallback",
      },
      async (accessToken, refreshToken, profile, done) => {
        console.log("Profile obtenido del usuario de GitHub: ");
        console.log(profile);
        try {
          const user = await userModel.findOne({ email: profile._json.email });
          console.log("Usuario encontrado para login:");
          console.log(user);
          if (!user) {
            console.warn(
              "User doesn't exists with username: " + profile._json.email
            );
            let newUser = {
              first_name: profile._json.name,
              last_name: "",
              age: 28,
              email: profile._json.email,
              password: "",
              loggedBy: "GitHub",
            };
            const result = await userModel.create(newUser);
            return done(null, result);
          } else {
            return done(null, user);
          }
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      let user = await userModel.findById(id);
      done(null, user);
    } catch (error) {
      console.error("Error deserializando el usuario: " + error);
    }
  });
  return passport;

};

const cookieExtractor = (req) => {
  let token = null;
  console.log("Entrando a Cookie Extractor");
  if (req && req.cookies) {
    console.log("Cookies presentes: ");
    console.log(req.cookies);
    token = req.cookies["jwtCookieToken"];
    console.log("Token obtenido desde Cookie:");
    console.log(token);
  }
  return token;
};

export default initializePassport;
