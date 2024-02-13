import { Router } from "express";
import passport from "passport";
import { authorization, passportCall, generateJWToken } from "../utils.js"

const router = Router();

router.post(
  "/register",
  passport.authenticate("register", {
    failureRedirect: "api/sessions/fail-register",
  }),
  async (req, res) => {
    try {
      console.log("Registrando usuario:");

      res.status(201).send({
        status: "success",
        message: "Usuario creado con éxito con ID.",
      });
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      res.status(500).send("Error interno del servidor");
    }
  }
);

router.post(
  "/login",
  passport.authenticate("login", {
    failureRedirect: "api/sessions/fail-login",
  }),
  async (req, res) => {
    try {
      const user = req.user;
      console.log(user);

      const tokenUser = {
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        age: user.age,
        role: user.role,
      };
      const access_token = generateJWToken(tokenUser);
      console.log(access_token);

      res.cookie("jwtCookieToken", access_token, {
        maxAge: 60000,
        httpOnly: true,
      });
      res.send({ message: "Login success!!" });
    } catch (error) {
      console.error("Error al procesar el inicio de sesión:", error);
      res.status(500).send("Error interno del servidor");
    }
  }
);

router.post("/logout", (req, res) => {
  if (req.session.login || req.session.user) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error al destruir la sesión:", err);
        res
          .status(500)
          .json({ status: "error", message: "Error al cerrar sesión" });
      } else {
        res
          .status(200)
          .json({ status: "success", message: "Sesión cerrada exitosamente" });
      }
    });
  } else {
    res
      .status(400)
      .json({ status: "error", message: "No hay sesión activa para cerrar" });
  }
});

router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] }),
  async (req, res) => {}
);

router.get(
  "/githubcallback",
  passport.authenticate("github", { failureRedirect: "/github/error" }),
  async (req, res) => {
    const user = req.user;

    const tokenUser = {
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      age: user.age,
      role: user.role,
    };
    const access_token = generateJWToken(tokenUser);
    console.log(access_token);

    res.cookie("jwtCookieToken", access_token, {
      maxAge: 60000,
      httpOnly: true,
    });
    res.redirect("/api/products");
  }
);

router.get("/fail-register", (req, res) => {
  res.status(401).send({ error: "Failed to process register!" });
});

router.get("/fail-login", (req, res) => {
  res.status(401).send({ error: "Failed to process login!" });
});

router.get(
  "/current",
  passportCall("jwt"),
  authorization("user"),
  (req, res) => {
    res.send(req.user);
  }
);

export default router;
