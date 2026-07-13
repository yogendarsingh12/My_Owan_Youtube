

import { uploadOnCloudinary } from "../../utils/cloudnary.js"
import { User } from "../Models/userModel.js"


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateJwtToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }

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

        const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(isUser._id)

        const LoggedInUser = await User.findById(isUser._id).select("-password -refreshToken")

        const options = {
            httpOnly: true,
            secure: true
        }


        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json({
                success: true,
                message: "Login SuccessFully",
                user: LoggedInUser,
                accessToken: accessToken,
                refreshToken: refreshToken

            })

    } catch (error) {
        console.log(error)

        res.status(500).json({ success: false, message: "Login Failed" })

    }

}

const logoutUser = async (req, res) => {
    await User.findByIdAndUpdate(req.userInfo._id, {
        $set: {
            refreshToken: undefined
        }
    }, {
        new: true
    })
    
    const options={
        httpOnly:true,
        secure:true,
    }

    res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json({success:true,
        message:"Logout Sccuess fully"
    })


}


const refreshAccessToken = async (req, res) => {

}







export {
    registerUser, loginUser, logoutUser, getAllUsers, refreshAccessToken
}