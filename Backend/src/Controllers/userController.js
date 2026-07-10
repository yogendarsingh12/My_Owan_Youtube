import { createAction } from "@reduxjs/toolkit"

import ApiError from "../../utils/ApiError.js"

import { User } from "../Models/userModel.js"
import { uploadOnCloudinary } from "../../utils/cloudnary.js"


const registerUser = async (req, res) => {

    const { username, fullname, email, password } = req.body
    console.log("user email", email, password)

    if ([username, fullname, password, email].some((field => field?.trim() === ''))) {
        throw new ApiError(400, "all fields are required")
    }

    let existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User Alreday Has Account")
    }

    const avatarlocalpath = req.files?.avtar[0]?.path
    const coverImagepath = req.files?.coverImage?.path

    if (!avatarlocalpath) {
        throw new ApiError(400, "Avtar files required")
    }
    if (!coverImagepath) {
        throw new ApiError(400, "cover image did not find")
    }

    const avatrStored = await uploadOnCloudinary(avatarlocalpath)
    const coverImageStore = await uploadOnCloudinary(coverImagepath)

    if (!avatrStored) {
        throw new ApiError(400, 'avtar required')
    }

    const user = await User.create({
        fullName: fullname,
        avatar: avatrStored.url,
        coverImage: coverImageStore.url,
        email: email,
        password: password,
        userName: username.toLowerCase()
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