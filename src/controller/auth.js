import { fileUploadCloudinary } from "../utils/coludinary.js";
import fs from "fs";
import { User } from "../model/user.js";
import jwt from "jsonwebtoken";

export const registerController = async (req, res) => {
  const { username, password, email } = req.body;

  if ([username, password, email].some((field) => field?.trim() === "")) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const profile_photo_path = req.files.profile_photo[0].path;
  const cover_photo_path = req.files.cover_photo[0].path;

  try {
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      res.status(409).json({ message: "Email or username is already exits." });
      throw new Error("Email or username is already exists.");
    }

    let profile_photo = "";
    let cover_photo = "";

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
    console.log("catch error is ", error);
    fs.unlinkSync(profile_photo_path);
    fs.unlinkSync(cover_photo_path);
  }
};

export const loginController = async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!existingUser) {
    return res.status(404).json({ message: "No user found." });
  }

  const isPassMatch = await existingUser.isPasswordMatch(password);

  if (!isPassMatch) {
    return res.status(401, "Invalid Credentials.");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(existingUser._id);

  const loggedUser = await User.findById(existingUser._id).select(
    "-password -refresh_token"
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshtoken", refreshToken, options)
    .json({ user: loggedUser, message: "login success." });
};

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return res.status(404).json({ message: "No user found." });
    }

    const accessToken =await existingUser.generateAccessToken();
    const refreshToken =await existingUser.generateRefreshToken();

    existingUser.refresh_token = refreshToken;

    await existingUser.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

export const generateNewRefreshToken = async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({ message: "No refresh token." });
  }

  try {
    const decodedToken = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SCRET_KEY
    );

    const existingUser = await User.findById(decodedToken?._id);

    if (!existingUser) {
      return res.status(404).json({ message: "No user found." });
    }

    if (incomingRefreshToken !== existingUser.refresh_token) {
      return res.status(401).json({ message: "Invalid refresh token." });
    }

    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(existingUser._id);
    
      const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      };
    
      return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshtoken", refreshToken, options)
        .json({ message: "Token Updated." });
  
    } catch (error) {
    return res.status(500).json({ message: "Something went wrong Refresh Token Generate!" });
  }
};

export const logoutController = async (req, res) => {
  
  if (!req.user || !req.user._id) {
    return res.status(400).json({ message: "Logout Unauthorized" });
  }

  try {
    
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset : {
          refresh_token: 1,
        }
      },
      { new: true }
    );

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };
  
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshtoken", options)
      .json({ message: `${req.user.username} logout successfully.` });

  } catch (error) {
    console.log("Logout error :", error);
    return res.status(500).json({ message: "Something went wrong." });
  }

}
