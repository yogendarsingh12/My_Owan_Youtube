import express from "express"
import { getAllUsers, loginUser, logoutUser, registerUser } from "../Controllers/userController.js"

import { upload } from "../Middlewares/multerMiddleware.js"

import auth from "../Middlewares/authMiddleware.js"

const router = express.Router()

router.post("/register",
    upload.fields([
        { name: "avatar", maxCount: 1 },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)


router.post("/login", loginUser)


//secure routes
router.get("/logout",auth,logoutUser)

router.get("/allusers",auth,getAllUsers)

export default router

