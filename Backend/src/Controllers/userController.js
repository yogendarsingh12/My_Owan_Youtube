




const registerUser= async(req,res)=>{
    res.status(200).json({
        success:true,
        message:"RegisterUser Controller Runs SuccessFully"
    })
}


export {
    registerUser
}