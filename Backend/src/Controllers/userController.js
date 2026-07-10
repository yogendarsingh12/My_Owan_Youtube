import { createAction } from "@reduxjs/toolkit"

import ApiError from "../../utils/ApiError.js"

import { User } from "../Models/userModel.js"
import { uploadOnCloudinary } from "../../utils/cloudnary.js"


const registerUser = async (req, res) => {

    const { userName, fullName, email, password } = req.body
    console.log("req body response",req.body)

    if ([userName, fullName, password, email].some((field => field?.trim() === ''))) {
        throw new ApiError(400, "all fields are required")
    }

    let existedUser = await User.findOne({
        $or: [{ userName }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User Alreday Has Account")
    }

    console.log("req files",req.files)
    const avatarlocalpath = req.files?.avatar?.[0]?.path
    const coverImagepath = req.files?.coverImage?.[0]?.path
    console.log("avatar local path",avatarlocalpath)
    console.log("cover image paht loacl",coverImagepath)

    if (!avatarlocalpath) {
        throw new ApiError(400, "Avtar files required")
    }
  

    const avatrStored = await uploadOnCloudinary(avatarlocalpath)
    const coverImageStore = await uploadOnCloudinary(coverImagepath)

    if (!avatrStored) {
        throw new ApiError(400, 'avtar required')
    }

    const user = await User.create({
        fullName: fullName,
        avatar: avatrStored.url,
        coverImage: coverImageStore.url||'',
        email: email,
        password: password,
        userName: userName.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refrashToken"
    )

    if (!createdUser) {
        throw new ApiError(404, "user did not find")
    }

    return res.status(201).json({
        success:true,
        message:"User Register Successfully",
        user:createdUser
    })





}


export {
    registerUser
}