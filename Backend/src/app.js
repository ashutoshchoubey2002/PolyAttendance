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
app.use("/api/v1/users", userRouter)


// app.post('/api/v1/users', (req, res) => {
   
//     console.log('Received POST request to /api/v1/users');
//         res.status(200).json({
//         message: "ok"
//     })
    
// });






export {app}
