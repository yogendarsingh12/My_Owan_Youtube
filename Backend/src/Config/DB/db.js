import mongoose from "mongoose";
import dotenv from "dotenv"
dotenv.config()


const ConnectDB=async()=>{
   try {
     let db= await mongoose.connect(process.env.MONGODB_URI)
     console.log("Mogodb Connected")
    
   } catch (error) {
    console.log("MongoDB Disconnected",error)
   }
}


export default ConnectDB