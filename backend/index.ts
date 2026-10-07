import dotenv from "dotenv"
import express from "express"
import {router} from "./route.ts" 
const app=express()

dotenv.config()

app.use(express.json())
app.use("/api",router)

app.listen(3000,()=>{
    console.log("App is running on PORT 3000")
})
