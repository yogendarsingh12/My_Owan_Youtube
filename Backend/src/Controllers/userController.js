

import { uploadOnCloudinary } from "../../utils/cloudnary.js"
import { User } from "../Models/userModel.js"

import jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ success: false, message: "user not found while genrating tokens" })
        }
        
        const accessToken = await user.generateJwtToken()
        const refrashToken = await user.generateRefreshToken()

        user.refrashToken = refrashToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refrashToken }

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Something went wrong while generating access and refresh token" })

    }

}


const registerUser = async (req, res) => {
    try {
        const { userName, fullName, email, password } = req.body;


        if (!userName || !fullName || !email || !password) {
            return res.status(400).json({ success: false, message: "All text fields are required" });
        }

        let existedUser = await User.findOne({
            $or: [{ userName }, { email }]
        });

        if (existedUser) {
            return res.status(409).json({ success: false, message: "User already exists" });
        }

        const avatarLocalPath = req.files?.avatar?.[0]?.path;
        const coverImagePath = req.files?.coverImage?.[0]?.path;

        if (!avatarLocalPath) {
            return res.status(400).json({ success: false, message: "Avatar file is required" });
        }

        const Avatar = await uploadOnCloudinary(avatarLocalPath);
        const CoverImage = coverImagePath ? await uploadOnCloudinary(coverImagePath) : null;


        if (!Avatar) {
            return res.status(500).json({ success: false, message: "Internal Error While Uploading Files On Cloudinary" });
        }

        const newUser = await User.create({
            userName: userName.toLowerCase().trim(),
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            avatar: Avatar.url || Avatar,
            coverImage: CoverImage?.url || "",
            password: password
        });


        const createdUser = await User.findById(newUser._id).select("-password -refreshToken");

        if (!createdUser) {
            return res.status(500).json({ success: false, message: "Failed to locate registered user profile" });
        }


        return res.status(201).json({
            success: true,
            message: "User Registered Successfully",
            user: createdUser,
        });

    } catch (error) {
        console.error("System Registration Error Logs:", error);
        return res.status(500).json({
            success: false,
            message: "Error encountered during registration handling",
            error: error.message
        });
    }
};


const getAllUsers = async (req, res) => {
    try {
        const allUsers = await User.find().select("-password -refreshToken")
        return res.status(201).json({ success: true, message: "Users Fatched Successfully", users: allUsers })


    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }

}


const loginUser = async (req, res) => {
    try {
        const { userName, email, password } = req.body

        if (!userName || !password || !email) {
            return res.status(404).json({ success: false, message: "username or passoword required" })
        }

        const isUser = await User.findOne({ userName: userName })

        if (!isUser) {
            return res.status(404).json({ success: false, message: "User Not Found" })
        }

        if (isUser && (isUser.comparePassword(password))) {
            console.log("validation successfully user exist and password also matching")
        }
        else {
            return res.status(404).json({ success: false, message: "password Wrong" })

        }

        const { refrashToken, accessToken } = await generateAccessAndRefreshTokens(isUser._id)

        const LoggedInUser = await User.findById(isUser._id).select("-password  -refrashToken")

        const options = {
            httpOnly: true,
            secure: true
        }


        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refrashToken", refrashToken, options)
            .json({
                success: true,
                message: "Login SuccessFully",
                user: LoggedInUser,
                accessToken: accessToken,
                refrashToken: refrashToken

            })

    } catch (error) {
        console.log(error)

        res.status(500).json({ success: false, message: "Login Failed" })

    }

}

const logoutUser = async (req, res) => {

    try {
        console.log("logout request getting", req.userInfo)
        await User.findByIdAndUpdate(req.userInfo._id, {
            $set: {
                refrashToken: null
            }
        },
            {
                returnDocument: 'after'
            })

        const options = {
            httpOnly: true,
            secure: true,
        }

        res.status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refrashToken", options)
            .json({
                success: true,
                message: "Logout Sccuess fully"
            })

    } catch (error) {

        console.log(error)
        return res.status(500).json({ success: false, message: "Internal Server Error While User Logout" })

    }

}


const refrashAccessToken = async (req, res) => {

    try {
        const incomingRefrashToken = req.cookies?.refrashToken || req.body.refrashToken

        if (!incomingRefrashToken) {
            return res.status(404).json({ success: false, message: "Refrash Token Not Found" })
        }

        const decodedRefrashToken = await jwt.verify(incomingRefrashToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedRefrashToken.id)

        if (!user) {
            return res.status(404).json({ success: false, message: "UnAurhorized Access" })
        }

        if (incomingRefrashToken === user.refrashToken) {
            const { refrashToken, accessToken } = await generateAccessAndRefreshTokens(user._id)

            const Options = {
                httpOnly: true,
                Secure: true
            }

            res.status(200).cookie("accessToken", accessToken, Options)
                .cookie("NewrefrashToken", refrashToken, Options)
                .json({ success: true, message: "Refrash Token Generated" })
        }
        else {
            return res.status(404).json({ success: false, message: "UnAurhorized Access" })

        }
    } catch (error) {
        console.log(error)
         return res.status(500).json({ success: false, message: "internal server error could not genrate Refrash Token" })

    }

}







export {
    registerUser, loginUser, logoutUser, getAllUsers, refrashAccessToken
}