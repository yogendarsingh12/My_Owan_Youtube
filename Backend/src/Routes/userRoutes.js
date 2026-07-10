import express from "express"
import { registerUser } from "../Controllers/userController.js"

import { upload } from "../Middlewares/multerMiddleware.js"

const router= express.Router()

router.post("/register",
    upload.fields([
        {name:"avatar",maxCount:1},
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser)

export default router

