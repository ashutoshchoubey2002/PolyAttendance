import express from "express";
import cors from "cors" ;
import cookieParser from "cookie-parser"
const app = express();
app.use(express.json())
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true 
}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))
app.use(express.json({limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// middleware - . (err,req,res,next)

//routes import
import userRouter from "./routes/user.routes.js"

//routes declaration
app.post("/api/v1/users", userRouter)

// app.use("/users", userRouter)
app.get("/users",(req,res)=>{
    res.send("users") ;
})


export {app}
