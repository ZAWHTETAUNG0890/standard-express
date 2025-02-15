import express from "express";
import cors from "cors";
import router from "./routes/test.js";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.js";

const app = express();

app.use(
    cors({
        orgin: process.env.ORGIN,
        credential : true,
    })
)

app.use(express.json({limit : "16kb"}));
app.use(express.urlencoded({ extended: true, limit : "16kb"}));
app.use(express.static("public"));

app.use(cookieParser());

app.use("/beta/test", router);
app.use("/api/v1", authRouter);


export { app };