import { asyncHandler } from "../utility/asyncHandler.js"
import {ApiError} from "../utility/ApiError.js"
import {User} from "../models/user.model.js"
import {uplodeOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponce } from "../utility/ApiResponce.js"

const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken= refreshToken
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


// Method for logging out 
// we can use _ instead of using res var 

  const logoutUser = asyncHandler(async(req,res)=>{
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



export { registerUser , loginUser , logoutUser}



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