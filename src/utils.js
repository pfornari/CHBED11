import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import passport from "passport";
import config from "./config/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createHash = (password) =>
  bcrypt.hashSync(password, bcrypt.genSaltSync(10));
export const isValidPassword = (user, password) =>
  bcrypt.compareSync(password, user.password);


export const generateJWToken = (user) => {
  return jwt.sign({ user }, config.privateKey, { expiresIn: "90s" });
};

export const authToken = (req, res, next) => {
  const authHeader = req.headers.cookie;
  console.log("Token present in header auth:");
  console.log(authHeader);

  if (!authHeader) {
    return res
      .status(401)
      .send({ error: "Usuario no encontrado o token inválido." });
  }

  const token = authHeader
    .split("; ")
    .find((row) => row.startsWith("jwtCookieToken="))
    .split("=")[1];

  jwt.verify(token, config.privateKey, (error, credentials) => {
    if (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).send({
          error: "Token expirado. Por favor, inicie sesión nuevamente.",
        });
      }
      return res.status(403).send({ error: "Token no válido, no autorizado." });
    }

    req.user = credentials.user;
    console.log("Se extrae la información del Token:");
    console.log(req.user);
    next();
  });
};

export const passportCall = (strategy) => {
  return async (req, res, next) => {
      console.log("Entrando a llamar strategy: ");
      console.log(strategy);
      passport.authenticate(strategy, function (err, user, info) {
          if (err) return next(err);
          if (!user) {
              return res.status(401).send({error: info.messages?info.messages:info.toString()});
          }
          console.log("Usuario obtenido del strategy: ");
          console.log(user);
          req.user = user;
          next();
      })(req, res, next);
  }
};

export const authorization = (role) => {
  return async (req, res, next) => {
    try {
      console.log("User role:", req.user?.role);
      console.log("Required role:", role);

      if (!req.user) {
        return res
          .status(401)
          .json({ error: "Unauthorized: Usuario no encontrado en JWT" });
      }

      if (req.user.role !== role) {
        return res.status(403).json({
          error: "Forbidden: El usuario no tiene permisos con este rol.",
        });
      }

      next();
    } catch (error) {
      console.error("Error in authorization middleware:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
};

export default __dirname;
