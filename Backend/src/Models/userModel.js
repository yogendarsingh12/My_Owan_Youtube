import monogoose, { Schema, model } from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import dotenv from 'dotenv'
dotenv.config()



const userSchema = new Schema({
    watchHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Video"
    }
    ],
    userName: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String,
        required: true

    },
    coverImage: {
        type: String,

    },
    password: {
        type: String,
        required: true
    },
    refrashToken: {
        type: String,
        default:undefined
    }

}, { timestamps: true })


userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return
    return this.password = await bcrypt.hashSync(this.password, 10)
})


userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compareSync(password, this.password)

}

userSchema.methods.generateJwtToken = async function () {
    let payload = {
        userName: this.userName,
        id: this._id
    }
    return await jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPRIY
    })

}

userSchema.methods.generateRefreshToken= async function(){
    let payload={
        id:this._id,
        userName:this.userName
    }
    return await jwt.sign(payload,process.env.REFRESH_TOKEN_SECRET,{
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    })
}



export const User = model("User", userSchema)