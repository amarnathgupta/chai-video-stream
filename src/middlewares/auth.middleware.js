import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken.split(" ")[1] ||
    req.headers["Authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized access!" });
  }
  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken -__v -createdAt -updatedAt"
    );
    if (!user) {
      return res.status(401).json({ message: "Unauthorized access!" });
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid token!");
  }
});
