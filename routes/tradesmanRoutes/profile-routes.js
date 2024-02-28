const express=require("express")
const { verifyToken } = require("../../Functions/middleware/authorisation")
const { EmployeeModel } = require("../../Functions/databaseSchema")
const app=express()



app.get("/profile",verifyToken,async(req,res)=>{
    try{
        const profileInfo=await EmployeeModel.findOne({_id:req.user.id})
        const {firstname,lastname,email}=profileInfo
        return res.status(200).json({responce:{firstname:firstname,lastname:lastname,email:email}})
    }
    catch(err){
        return res.status(500).json({responce:"Internal server error"})
    }
})

module.exports=app;