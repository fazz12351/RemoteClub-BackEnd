const express = require("express")
const app = express()


app.get("/", async (req, res) => {
    try {
        console.log("im being called")

    }
    catch (err) {
        throw new Error("Error occured")
    }

})


app.listen(3000, async () => {
    try {
        console.log(`server running on Port 3000`)

    }
    catch (err) {
        console.log(err)
    }

})