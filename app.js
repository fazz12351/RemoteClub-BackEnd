const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken")

require('dotenv').config();
const app = express();

// Middleware to parse JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

const TradesmanLoginRouter = require("./routes/tradesmanRoutes/login-routes")
const CustomerBookingRouter = require("./routes/customerRoutes/booking-routes")
const TradesmanPostRouter = require("./routes/tradesmanRoutes/posts-routes")
const TradesmanJob = require("./routes/tradesmanRoutes/jobs-routes")
const TradesmansProfile=require("./routes/tradesmanRoutes/profile-routes")

app.use("/TradesmanLogin", TradesmanLoginRouter)
app.use("/Customerbooking", CustomerBookingRouter)
app.use("/TradesmaPosts", TradesmanPostRouter)
app.use("/TradesmanJob", TradesmanJob)
app.use("/TradesmanProfile",TradesmansProfile)


const PORT = 3000;

app.listen(PORT, async () => {
    console.log(`Server is running on Port ${PORT}`);
});