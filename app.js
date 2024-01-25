const express = require("express");
const bodyParser = require("body-parser");
const app = express();

// Middleware to parse JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const TradesmanLoginRouter = require("./routes/tradesmanRoutes/login-routes")
const CustomerBookingRouter = require("./routes/customerRoutes/booking-routes")
const TradesmanPostRouter = require("./routes/tradesmanRoutes/posts-routes")

app.use("/TradesmanLogin", TradesmanLoginRouter)
app.use("/Customerbooking", CustomerBookingRouter)
app.use("/TradesmaPosts", TradesmanPostRouter)

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server is running on Port ${PORT}`);
});
