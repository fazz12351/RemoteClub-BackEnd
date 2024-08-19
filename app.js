const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken")
const cors = require("cors")
const { s3Upload, s3Retrieve } = require("./Functions/configuration")

const app = express();

const sendMessage = require("./Functions/Twilio")

// Middleware to parse JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

const CustomerService = require("./routes/customerRoutes/customerService-routes")
const CustomerBookingRouter = require("./routes/customerRoutes/booking-routes")
const CustomerLogin = require("./routes/customerRoutes/login-routes")

const TradesmanLoginRouter = require("./routes/tradesmanRoutes/login-routes")
const TradesmanPostRouter = require("./routes/tradesmanRoutes/posts-routes")
const TradesmanJob = require("./routes/tradesmanRoutes/jobs-routes")
const TradesmansProfile = require("./routes/tradesmanRoutes/profile-routes")

const Video = require("./routes/generalRoutes/video")

app.use(cors())

app.use("/CustomerBooking", CustomerBookingRouter)
app.use("/CustomerLogin", CustomerLogin)
app.use("/CustomerService", CustomerService)

app.use("/TradesmanLogin", TradesmanLoginRouter)
app.use("/TradesmanPosts", TradesmanPostRouter)
app.use("/TradesmanJob", TradesmanJob)
app.use("/TradesmanProfile", TradesmansProfile)

app.use("/video", Video)


const PORT = 3000;

app.listen(PORT, async () => {
    console.log(`Server is running on Port ${PORT}`);
});





