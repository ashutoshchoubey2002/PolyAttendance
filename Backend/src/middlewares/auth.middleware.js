import { ApiError } from "../utility/ApiError.js";
import { asyncHandler } from "../utility/asyncHandler.js";
import { User } from "../models/user.model.js"
import jwt from "jsonwebtoken"
 export const verifyJWT = asyncHandler(async (req, _, next)=> {

  try {
    /*handle mobile app as well */
    const token = req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer", "")

    if (!token) {
      throw new ApiError(401, "Unauthorized request")
    }

    const decodedToken = jwt.verify(token
      , process.env.ACCESS_TOKEN_SECRET)

    console.log("This is decoded Token", decodedToken);

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")


    if (!user) {
      // Front end 
      throw new ApiError(401, "Invalid Access Token ")

    }

    req.user = user;
    next()
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token")
  }
})

