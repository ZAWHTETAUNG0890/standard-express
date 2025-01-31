import { fileUploadCloudinary } from "../utils/coludinary.js";
import fs from "fs";
import { User } from "../model/user.js";

export const registerController = async (req, res) => {
    
    const { username, password, email } = req.body;

    if ([username, password, email].some(field => field?.trim() === "")) {
        return res.status(400).json({message: "All fields are required."})
    };

    const profile_photo_path = req.files.profile_photo[0].path;
    const cover_photo_path = req.files.cover_photo[0].path;

    try {
        const existingUser = await User.findOne({
            $or: [{username},{email}],
        });
    
        if (existingUser) {
            res.status(409).json({message: "Email or username is already exits."});
            throw new Error("Email or username is already exists.");
        }
        
        let profile_photo="";
        let cover_photo="";
        
        if (profile_photo_path && cover_photo_path) {
                profile_photo = await fileUploadCloudinary(profile_photo_path);
                cover_photo = await fileUploadCloudinary(cover_photo_path);       
        }

        const user = await User.create({
            email,
            username: username.toLowerCase(),
            password,
            profile_photo,
            cover_photo,
        });

        const createdUser = await User.findById(user._id).select(
            "-password -refresh_token"
        );

        if (!createdUser) {
            return res
              .status(500)
              .json({ message: "Something went worng in registration new user." });
          }
      
          return res
            .status(200)
            .json({ userInfo: createdUser, message: "Registration is success." });

    } catch (error) {
        console.log("catch error is ",error);
                fs.unlinkSync(profile_photo_path);
                fs.unlinkSync(cover_photo_path); 
    }
    
}