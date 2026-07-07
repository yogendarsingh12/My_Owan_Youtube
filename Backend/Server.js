import dotenv from "dotenv"
dotenv.config()
import express from 'express'
import ConnectDB from "./src/Config/DB/db.js"

ConnectDB()//connecting db
const app= express()

const port=process.env.PORT




app.get("/",(req,res)=>{
    res.send("lets Make Your Owan You Tube")
})


app.listen(port,()=>{
    console.log("Your YouTube Is Running On Port Number ",port)
})