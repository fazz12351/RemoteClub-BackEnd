const express=require("express")
const app=express()
const {generateToken}=require("../../Functions/middleware/authorisation")
const {hashPassword,comparePasswords}=require("../../Functions/general_functions")

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
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ response: "Please provide both email and password" });
        }

        const user = await CustomerModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ response: "Email or password does not exist" });
        }

        const isPasswordValid = await comparePasswords(password, user.password);


        if (!isPasswordValid) {
            return res.status(401).json({ response: "User password is incorrect" });
        }

        const userPayload = { email: user.email, id: user.id /* Add other relevant claims */ };
        const token = generateToken(userPayload);

        return res.status(200).json({ token, response: "User successfully logged in" });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ response: "Internal Server Error" });
    }
})


module.exports=app