import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// Configuration
cloudinary.config({
  cloud_name: "dzzetvnsc",
  api_key: "527385842781562",
  api_secret: process.env.CLOUDINARY_API_SCRET,
});

export const fileUploadCloudinary = async (filepath) => {
  try {
    if (!filepath) return null;
    const response = await cloudinary.uploader.upload(filepath, {
      resource_type: "auto",
    });
    console.log("File upload complete.", response.url);
    fs.unlinkSync(filepath);
    return response.url
  } catch (error) {
    fs.unlinkSync(filepath);
    console.log("cloudinary error",error);
    return null;
  }
};
