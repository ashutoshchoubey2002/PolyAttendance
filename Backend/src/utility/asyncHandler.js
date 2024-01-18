// const asyncHandler = () =>{}

const asyncHandler = (requestHandler)  => {
   return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).
        catch((err) => next(err));
    }
}
export {asyncHandler}







// const asyncHandler = (fn) => async(rea,res,next) => {
//     try{

//     } catch ( error) {
//        return res.status(err.code || 500).json({
//          success : false ,
//          message: err.message
//         })
//     } 
// }
// export {asyncHandler}
