const express = require("express");
const bodyParser = require("body-parser");
const app = express();

// Middleware to parse JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const loginRouter = require("./routes/login-routes")
const bookingRouter = require("./routes/booking-routes")

app.use("/login", loginRouter)
app.use("/booking", bookingRouter)

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server is running on Port ${PORT}`);
});
