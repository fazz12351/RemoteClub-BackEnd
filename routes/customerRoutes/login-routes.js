const express=require("express")
const app=express()

const {hashPassword}=require("../../Functions/general_functions")

const {CustomerModel}=require("../../Functions/databaseSchema")



app.post("/register_Customer",async(req,res)=>{
    try{
        //store each key as const from form
        const {firstname,lastname,password,address,telephone,email}=req.body
        //validation used to check all firleds are implemented
        if(!firstname||!lastname||!password||!address||!telephone||!email){
            return res.status(404).json({error:"missing fields"})
        }

        const exists=await CustomerModel.findOne({email:email})
        if(exists){
            return res.status(404).json({responce:"User with that email is registered already"})
        }

        const hashedPassword=await hashPassword(password)

        const newCustomer=new CustomerModel({
            firstname:firstname,
            lastname:lastname,
            password:hashedPassword,
            address:address,
            telephone:telephone,
            email:email
        })
        await newCustomer.save()
        return res.status(200).json({responce:"Customer added succesfully"})

    }
    catch(err){
        console.log(err)
    }
})


app.post("/login_Customer",async(req,res)=>{
    try{
        const {email,password}=req.body
        const hashPassword=await hashPassword(password)
        const checkLogin=await CustomerModel.find({"email":email})
        console.log(checkLogin)

    }
    catch(err){

    }
})


module.exports=app