console.log('Node.js version:', process.version);
// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from './app.js'
import userRouter from './routes/user.routes.js'
dotenv.config({
    path: './.env'
})


// esko dala hu lvde
app.use(userRouter)

app.get('/', (req, res) => {
    res.json({ message: 'Hello, this is a HOME PAGE!' });
});

connectDB()
    .then(() => {

        app.on("error", (error) => {
            console.log("error", error);
            throw error
        })

        app.listen(process.env.PORT || 3000, () => {
            console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
        })
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!! ", err);
    })










/*
import express from "express"
const app = express()
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("errror", (error) => {
            console.log("ERRR: ", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("ERROR: ", error)
        throw err
    }
})()

*/