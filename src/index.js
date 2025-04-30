import "dotenv/config";
import connectDB from "./db/index.js";
import { app } from "./app.js";


connectDB()
.then(() => {
    app.on("error", () => {
        console.log("Express crashed!")
        process.exit(1)
    })
    app.listen(process.env.PORT, () => {
        console.log(`Server is running at port ${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log("MongoDb connection failed! || ", err);
    process.exit(1);
})







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