import dotenv from "dotenv"
dotenv.config()
import express from 'express'
import ConnectDB from "./src/Config/DB/db.js"
ConnectDB()//connecting db

import cors from "cors"
import cookieParser from "cookie-parser"
const app= express()

const port=process.env.PORT

//setting cors

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true,

}))

app.use(express.json({limit:"16kb",}))

app.use(express.urlencoded({
    limit:"16kb",
}))
app.use(express.static("public"))
app.use(cookieParser())



app.get("/",(req,res)=>{
    res.send("lets Make Your Owan You Tube")
})


app.listen(port,()=>{
    console.log("Your YouTube Is Running On Port Number ",port)
})