// const asyncHandler = () =>{}
const asyncHandler = ()  => {
   return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).
        catch((err) => next(err))
    }
}


export {asyncHandler}


// const asyncHandler = (fn) => async(rea,res,next) => {
//     try{

//     } catch ( error) {
//         res.status(err.code || 500).json({
//          success : false ,
//          message: err.message
//         })
//     } 
// }