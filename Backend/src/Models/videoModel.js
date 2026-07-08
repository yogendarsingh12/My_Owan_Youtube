import monogoose, { Schema, model } from "mongoose"

import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"


const videoSchema = new Schema({
    videoFile:{
        type:String,
        required:true,
        trim:true
    },
    thumbnail:{
        type:String,
        required:true,
        trim:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    title:{
        type:String,
        required:true
    },
     description:{
        type:String,
        required:true
    },
    duration:{
        type:Number,
    },
     viwes:{
        type:Number,
        default:0
    },
     isPublished:{
        type:Boolean,
        required:true
    }

    
}, { timestamps: true })


videoSchema.plugin(mongooseAggregatePaginate)

export const Video = model("Video", userSchema)