import express from "express"
import { forgetPassword, getAllUsers, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refrashAccessToken, registerUser } from "../Controllers/userController.js"

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

router.get("/refrashToken",refrashAccessToken)

router.post("/forgetpassword",auth,forgetPassword)

router.get("/current-user",auth,getCurrentUser)

router.get("/user-profile",auth,getUserChannelProfile)

router.get("/watch-history",auth,getWatchHistory)



export default router

