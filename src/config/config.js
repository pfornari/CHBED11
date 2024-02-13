import dotenv from "dotenv";

dotenv.config();

export default {
    port: process.env.PORT,
    mongoUrl:process.env.MONGODB_URI,
    privateKey: process.env.PRIVATE_KEY,
}