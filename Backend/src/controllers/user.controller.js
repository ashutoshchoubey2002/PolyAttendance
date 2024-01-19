import { asyncHandler } from "../utility/asyncHandler.js"
import {ApiError} from "../utility/ApiError.js"
import {User} from "../models/user.model.js"
import {uplodeOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponce } from "../utility/ApiResponce.js"
import { jwt } from "jsonwebtoken"

const generateAccessAndRefreshTokens = async(userId)=>{
console.log(userId,"this is user id ");

    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        console.log(accessToken);
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken,refreshToken}
    } 
    catch (error) {
        throw new  ApiError(500 ,"Something went wrong whhile generating refresh and access Token")
        
    }
}


const registerUser = asyncHandler( async (req, res) => {
    
    const {fullname,email,username,password} = req.body
       console.log(req.body,"email",email,password,"this is a data");

    if(
        [fullname,email,username,password].some((field)=>
        field?.trim() === "")
    )
    {
        throw new ApiError(400,"All Fields are required")
    }

    //find 

   const existedUser = await User.findOne({
        $or: [{ username },{ email }]
    })

    if(existedUser){
        throw new ApiError(409 , "User with email or username already exists")
    }


    const avatarLocalPath = req.files?.avatar[0]?.path ; 
    // const coverImageLocalPath = req.files?.coverImage[0]?.path ;

    let coverImageLocalPath ;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0) {

        coverImageLocalPath = req.files.coverImage[0].path        
    }

    if (!avatarLocalPath) {
        throw new ApiError(400 , "Avatar File is required")
    }

   const avatar = await uplodeOnCloudinary(avatarLocalPath) ;
   const coverImage = await uplodeOnCloudinary(coverImageLocalPath);

   if (!avatar) {
    throw new ApiError(400 , "Avatar File is required")
   }


   // create USER

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    // coverImage: coverImage.url || "" ,
    coverImage: coverImage && coverImage.url ? coverImage.url : "" ,
    email,
    password,
    username:username.toLowerCase()
   })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if (!createdUser) {
    throw new ApiError(400 , "Somethinf went wrong while registering the user")
  
   }

   return res.status(201).json(
    new ApiResponce(200 , createdUser , "User registred successfully")
   )



      

})

const loginUser = asyncHandler( async  (req ,res) =>{
    const {email , username ,password} = req.body
if (!(username ||  email)) {
    throw new ApiError(400 , "Username or email is required")
    
}

const user = await User.findOne({
    $or: [{username} , {email}]
})

if (!user) {
    throw new ApiError(400 , "User does not exist")
}

 const isPasswordValid = await user.isPasswordCorrect(password)

 
if (!isPasswordValid) {
    throw new ApiError(401 , "Invalid User Credential")
}

const {accessToken ,refreshToken} = 
await generateAccessAndRefreshTokens(user._id)

 
const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

const options = {

    httpOnly:true ,
    secure :true
}

return res
.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
        
    new ApiResponce(
        200,
       {
        user:loggedInUser,accessToken,refreshToken
       },
       "User logged In Successfully"

    )

)
    
})

const logoutUser = asyncHandler(async(req,res)=>{


// we can use _ instead of using res var 

   await User.findByIdAndUpdate(
        req.user._id,
        {
           $set: {
            refreshToken: undefined
           }
        },
        {
            new :true
        }

        
    )

    const options = {

        httpOnly:true ,
        secure :true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json( new ApiResponce(200 , {} , "User logged out"))
   })


const refreshAccessToken   = asyncHandler(async(req,res)=>{
const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

if (!incomingRefreshToken) {
    throw new ApiError(400,"Unauthorized request")
}

try {
    const decodedToken =  jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )
    
    const user = await User.findById(decodedToken?._id)
    
    if (!user) {
        throw new ApiError(401,"Invalid Refresh Token")
    }
    
    if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401,"Access Token is expired or used")
    }
    
    const options = {
        httpOnly:true,
        secure: true
    }
    
      const {newaccessToken , newrefreshToken} =  
      await generateAccessAndRefreshTokens(user._id)
    
       return res
       .status(200)
       .cookie("newaccessToken", newaccessToken,options)
       .cookie("newrefeshToken", newrefreshToken,options)
       .json(
        new ApiResponce(
            200,
            {accessToken,refreshToken,newrefreshToken},
            "Access Token refreshed"
        )
       )
} catch (error) {

    throw new ApiError(401, error?.message || "Invalid refresh Token")
    
}




})

const changeCurrentPassword =  asyncHandler(async(req,res)=>{
    const {oldPassword , newPassword} = req.body

   const user = await User.findById(req.user?._id)
   const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

   if (!isPasswordCorrect) {
    throw new ApiError(400 , "Invalid old Password" )
   }

   user.password = newPassword
   await user.save({validateBeforeSave:false})

   return res
   .status(200)
   .json(new ApiResponce(200,{},"Password ChnageS successfully"))


})


const getCurrentUser = asyncHandler(async(req , res) =>{
    
    return res.status(200
        .json(200 , req.user , "current user fetched successsfully"))
})

const updateAccountDetails = asyncHandler( async(req,res) =>{

    const {fullyName,email} = req.body
    if (!fullname || !email) {
        throw new ApiError(400 , "All fields are required")
    }

User.findByIdAndUpdate(
    
    req.user?._id ,
    {
             $set: {
                fullname , 
                email : email
             }
    },
    {new:true}
    
    ).select("-password")


    return res.status(200)
    .json(new ApiResponce(200 , user , "Account Detail Updated Sucessfullly"))


})


const updateUserAvatar = asyncHandler(async(req,res) =>{
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400 , "Avatar file is misssing")
    }

    const avatar =  await uplodeOnCloudinary(avatarLocalPath)

    if(!avatar.url)
    {
        throw new ApiError(400 , "Error while uploading on avatar")
    }

    await User.findByIdAndUpdate(

        req.user?._id,
        {
            $set:
            {
                avatar:avatar.url

            }
        },
        {new:true}

    ).select("-password")


    return res 
    .status(200)
    .json( new ApiResponce( 200 , user, " Avatar updated successfully"))
})


const updateUserCoverImage = asyncHandler(async(req,res) =>{
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400 , "cover Image  is misssing")
    }

    const coverImage =  await uplodeOnCloudinary(coverImageLocalPath)

    if(!coverImage.url)
    {
        throw new ApiError(400 , "Error while uploading on cover Image")
    }

   const user =  await User.findByIdAndUpdate(

        req.user?._id,
        {
            $set:
            {
                coverImage:coverImage.url

            }
        },
        {new:true}

    ).select("-password")

    return res 
    .status(200)
    .json( new ApiResponce( 200 , user, " cover Image updated successfully"))
})



const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})


// add to watchhistory
const addToWatchHistory = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!req.user?._id) {
      throw new ApiErrorHandler("400", "Invalid User Id");
    }
    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
      throw new ApiErrorHandler(404, "Invalid video Id.");
    }
    try {
      const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
          $addToSet: {
            // $addToSet added videoIds ensure no duplication occurence :)
            watchHistory: videoId,
          },
        },
        { new: true }
      ).select("-password");
      if (!user) {
        throw new ApiErrorHandler(404, "watch history user's not added");
      }
      return res
        .status(200)
        .json(new ApiResponce(200, user, "Video added to watch history"));
    } catch (error) {
      throw new ApiErrorHandler(
        error?.statusCode || 500,
        error?.message ||
          "internal server error while tracking user's watch history"
      );
    }
  });
  

export { 

      registerUser 
    , loginUser 
    , logoutUser 
    , refreshAccessToken 
    , changeCurrentPassword
    , getCurrentUser
    , updateAccountDetails
    , updateUserAvatar
    , updateUserCoverImage
    , getUserChannelProfile
    , getWatchHistory
    , addToWatchHistory
   
}



//01
    // res.status(200).json({
    //     message: "ashu bhai"
    // })
    
    // steps

//02 
     /*
     
     steps -
     get user details from frontend 
     validation - not empty 
     check if user already exists : username , email
     check for images , checkfor avtar
     create user object- create entry in db 
     remove password and refresh token  field from response 
     check for user creation
     return res

     */    

     //---field checking 
    //  if(fullName === "")
     //    {
     //     throw new ApiError(400,"Full name is required")
     //    }

//................Auth
     // User Credentials or details 
     // username , email , password , access token , refresh token 
     //req body => data 
     //check whether the username or email is sent or not 
     //find the user 
     //Password checking 
     //Access and Refresh Token 
     //Send cookie 