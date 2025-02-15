import jwt from "jsonwebtoken";
import { User } from "../model/user.js";

export const verifyJWT = async (req, res, next) =>{

    const incomingToken = req.cookies.accessToken || req.header("Authorization");

    if (!incomingToken) {
        return res.status(401).json({message: "Unauthorized 1!"});
    }

    try {
        
        const decodedToken = jwt.decode(incomingToken);

        if (!decodedToken) {
            return res.status(401).json({ message: "Unauthorized 2!" });
        }

        const existingUser = await User.findById(decodedToken._id).select("-password -refresh_token");

        if (!existingUser) {
            return res.status(401).json({ message: "Unauthorized 3!" });
        }

        req.user = existingUser;

        next();

    } catch (error) {
        return res.status(500).json({ message: "Something went wrong!" });
    }

}