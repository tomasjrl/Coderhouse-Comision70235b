import { Router } from "express";
const router = Router(); 
// import { createHash, isValidPassword } from "../utils/hashbcryp.js";
import UserModel from "../models/user.model.js";

// import passport from "passport";

// router.post("/register", passport.authenticate("register", {}) ,async (req, res) => {

//     req.session.user = {
//         first_name: req.user.first_name, 
//         last_name: req.user.last_name
//     } 

//     req.session.login = true;

//     res.redirect("/profile"); 
// })



router.post("/login", async (req, res) => {
    const {email, password} = req.body; 

    try {
        const usuario = await UserModel.findOne({email: email}); 

        if(usuario) {
            if(isValidPassword(password, usuario)) {            
                req.session.login = true; 
                req.session.user = {
                    first_name: usuario.first_name, 
                    last_name: usuario.last_name
                }

                res.redirect("/profile");
            } else {
                res.send({error: "La contraseña que me pasaste es horrible!"});
            }

        } else {
            res.send({error: "Usuario no encontrado"});
        }
    } catch (error) {
        res.send({error: "Error en todo el proceso de Login"}); 
    }
})

router.get("/logout", (req, res) => {
    if(req.session.login) {
        req.session.destroy(); 
    }
    res.redirect("/login"); 
})


export default router; 