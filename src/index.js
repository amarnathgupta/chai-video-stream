import "dotenv/config";
import express from "express";
import connectDB from "./db/index.js";

const app = express()

connectDB()









// ( async () => {
//     try {
//         const response = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error", (error) => {
//             console.log("Express errror: ", error);
//             throw error;
//         })
//         app.listen(process.env.PORT, () => {
//             console.log(`Server is running at port ${process.env.PORT}`)
//         })
//     } catch (error) {
//         console.error("Error: ", error);
//         throw error;
//     }
// })()