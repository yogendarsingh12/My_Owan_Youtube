

import mongoose from "mongoose"
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
        console.log("reqest ", req.body)
        const { userName, email, password } = req.body


        if (!userName || !password || !email) {
            return res.status(404).json({ success: false, message: "username or passoword required" })
        }

        const isUser = await User.findOne({ userName: userName })

        if (!isUser) {
            return res.status(404).json({ success: false, message: "User Not Found" })
        }
        const isPassword = await isUser.comparePassword(password)
        if (isUser && isPassword) {
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


const changeCurrentUserPassword = async (req, res) => {

    try {
        const { newPassword, oldPassword } = req.body


        const userId = req.userInfo.id

        const existUser = await User.findById(userId).select("-refrashToken ")

        if (!existUser) {
            return res.status(404).json({ success: false, message: "User Not Found" })

        }
        const isPassword = await existUser.comparePassword(oldPassword)
        if (isPassword) {
            existUser.password = newPassword
            await existUser.save({ validateBeforeSave: false })

            res.status(200).json({ success: true, message: "Password Changed Successfully" })

        }
        else {
            res.status(404).json({ success: false, message: "Invalid Password " })

        }


    } catch (error) {

        console.log(error)

        return res.status(500).json({ success: false, message: "internal server error while Changing Password " })

    }





}


const forgetPassword = async (req, res) => {

    try {
        const { email, newPassword } = req.body
        console.log("forget password request")

        if (!email || !newPassword) {
            return res.status(404).json({ success: false, message: "email and password are reqired" })
        }

        let existedUser = await User.findOne({ email: email }).select("-refrashToken")

        if (!existedUser) {
            return res.status(404).json({ success: false, message: "User Does Not Exist" })

        }
        existedUser.password = newPassword
        existedUser.save({ validateBeforeSave: false })

        res.status(200).json({ success: true, message: "Password Changed Successfully" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal server Error While changing User Password" })
    }

}



const getCurrentUser = async (req, res) => {
    try {
        const currentUser = req.userInfo

        res.status(200).json({ user: currentUser, success: true })

    } catch (error) {
        res.status(500).json({ message: "internal serveror error while getting current user", success: false })

    }

}

const updateAccountDetails = async (req, res) => {

}


const updateUserAvatar = async (req, res) => {

    try {

        const avatarLocalpath = req.file?.path

        if (!avatarLocalpath) {
            return res.status(404).json({ success: false, message: "avatar required" })
        }

        const avatar = await uploadOnCloudinary(avatarLocalpath)
        const user = req.userInfo

        let existUser = await User.findById(user._id).select("-password -refrashToken")

        if (!existUser) {
            return res.status(404).json({ success: false, message: "User Not found" })
        }
        const updatedUser = await User.findByIdAndUpdate(user._id, {
            $set: {
                avatar: avatar
            }
        }, {
            new: true
        })
        return res.status(200).json({ success: true, message: "Avatar Updated" })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "Internal server error while updateing avatar" })


    }
}



const updateUserCoverImage = async (req, res) => {

    try {

        const coverImageLocalpath = req.file?.path

        if (!coverImageLocalpath) {
            return res.status(404).json({ success: false, message: "coverImage required" })
        }

        const coverImage = await uploadOnCloudinary(coverImageLocalpath)
        const user = req.userInfo

        let existUser = await User.findById(user._id).select("-password -refrashToken")

        if (!existUser) {
            return res.status(404).json({ success: false, message: "User Not found" })
        }
        const updatedUser = await User.findByIdAndUpdate(user._id, {
            $set: {
                coverImage: coverImage
            }
        }, {
            new: true
        })
        return res.status(200).json({ success: true, message: "Avatar Updated" })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "Internal server error while updateing avatar" })


    }
}


const getUserChannelProfile = async (req, res) => {
    const { userName } = req.params

    if (!userName) {
        return res.status(404).json({ success: false, message: "Username not found" })
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: userName
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribed to"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                channelSubscribeToCount: {
                    $size: "subscribed to"
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.userInfo?._id, "$subscribers.subscriber"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                email: 1,
                userName: 1,
                subscriberCount: 1,
                channelSubscribeToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1


            }
        }
    ])

    if (!channel.length) {
        return res.status(404).json({ success: false, message: "Channel does not exists " })
    }

    return res.status(200)
        .json({ success: true, channel: channel[0], message: "user channel successfully fatched" })


}


const getWatchHistory = async (req, res) => {
    try {
        const user = await User.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.userInfo.id)
                }

            },
            {
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: [
                                    {
                                        $project: {
                                            fullName: 1,
                                            userName: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            },
        ])

        return res.status(200).json({
            success: true,
            user: user[0].watchHistory,
            message: "watch history fatched successfully"
        })
    } catch (error) {
        console.log(error)

        return res.status(500).json({
            success: false,
            message: "watch history could not fatched"
        })


    }

}




export {
    registerUser, loginUser, logoutUser, getAllUsers, refrashAccessToken, changeCurrentUserPassword, getCurrentUser,
    updateAccountDetails, updateUserCoverImage, forgetPassword,getUserChannelProfile,getWatchHistory
}