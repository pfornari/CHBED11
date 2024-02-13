import { Router } from "express";
import { passportCall } from "../utils.js";
import usersDao from "../services/db/users.dao.js";
const router = Router();

router.get("/", passportCall("jwt"), async (request, response) => {
    try {
      if (!request.isAuthenticated()) {
        return response.status(401).send("Unauthorized: Usuario no autenticado");
      }

      const userEmail = request.user.email;  
      const userToRender = await usersDao.getUserByEmail(userEmail);
  
      response.render("profile", {
        title: "Perfil",
        userToRender,
        fileCss: "../css/styles.css",
      });
    } catch (error) {
      console.error("Error:", error);
      response.status(500).send("Internal Server Error");
    }
  });
  
export default router;