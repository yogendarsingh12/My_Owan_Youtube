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
    }

}, { timestamps: true })

userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect=async function(password) {
    return await bcrypt.compare(password,this.password)
    
}

userSchema.methods.genrateAccessToken= function(){
    const payload={
        _id:this._id,
        email:this.email,
        userName:this.userName,
        fullName:this.fullName
    }
    return jwt.sign(payload,process.env.ACCESS_TOKEN_SECRET,{expiresIn:process.env.ACCESS_TOKEN_EXPRIY})
}

userSchema.methods.genrateRefresToken= function(){
     const payload={
        _id:this._id,
        email:this.email,
        userName:this.userName,
        fullName:this.fullName
    }
    return jwt.sign(payload,process.env.REFRESH_TOKEN_SECRET,{expiresIn:process.env.REFRESH_TOKEN_EXPRIY})
    
}

export const User = model("User", userSchema)