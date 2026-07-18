import express from "express"
import { forgetPassword, getAllUsers, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refrashAccessToken, registerUser, updateUserAvatar, updateUserCoverImage } from "../Controllers/userController.js"

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
router.get("/logout", auth, logoutUser)

router.get("/allusers", auth, getAllUsers)

router.get("/refrashToken", refrashAccessToken)

router.patch("/forgetpassword", auth, forgetPassword)

router.get("/current-user", auth, getCurrentUser)

router.get("/user-profile/:userName", auth, getUserChannelProfile)

router.get("/watch-history", auth, getWatchHistory)

router.patch("/update-avatar", auth, upload.single("avatar"), updateUserAvatar)

router.patch("/update-coverImage", auth, upload.single("coverImage"), updateUserCoverImage)





export default router

