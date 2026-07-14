
import { User } from "../Models/userModel.js";

import jwt from "jsonwebtoken";


const auth = async function (req, res, next) {
    try {
        const token = req.cookies?.accessToken || req.headers.authorization.split(" ")[1]

        if (!token) {
            return res.status(404).json({ success: false, message: "Token Not Found" })
        }

        let decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        let user = await User.findById(decodedToken?.id).select("-password -refreshToken")
        

        if(!user){
             return res.status(404).json({ success: false, message: "Invaild Access " })
        }

        req.userInfo =user
        next()
    } catch (error) {
        console.log(error)
        return res.status(401).json({ success: false, message: "UnAuthorized Access" })

    }
}



export default auth