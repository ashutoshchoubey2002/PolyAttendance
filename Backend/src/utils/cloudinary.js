import {v2 as cloudinary}   from "cloudinary";
import fs from "fs" ; 

          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: CLOUDINARY_API_SECRET 
});


const uplodeOnCloudinary = async () =>{
    try {
        if(!localFilePath) return null
        // uplode the file on cloudinary
      const responce = await  cloudinary.uploader.upload(localFilePath , {
            resource_type:"auto"
        })

        console.log("File is uploded on cloudinary",responce.url);
        return responce ; 
        
    } catch(error){
        fs.unlinkSync(localFilePath)
        // remove the locally saved temporary file as the uplode operation got failed 
        return null ; 
    }

}


cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
  { public_id: "olympic_flag" }, 
  function(error, result) {console.log(result); });